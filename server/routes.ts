import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, initializeAdmin } from "./auth";
import { neo4jService } from "./services/neo4j";
import { n8nService } from "./services/n8n";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Neo4j connection
  await neo4jService.connect();

  // Auth middleware setup
  setupAuth(app);

  // Initialize admin user
  await initializeAdmin();

  // Dashboard data routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const [companyCount, sectorAggregations] = await Promise.all([
        neo4jService.getCompanyCount(),
        neo4jService.getSectorAggregations()
      ]);

      const recentReports = await storage.getRecentReports(5);

      res.json({
        companyCount,
        sectorAggregations,
        recentReports: recentReports.length
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get('/api/dashboard/sectors', isAuthenticated, async (req, res) => {
    try {
      const sectors = await neo4jService.getSectorAggregations();
      res.json(sectors);
    } catch (error) {
      console.error("Error fetching sectors:", error);
      res.status(500).json({ message: "Failed to fetch sector data" });
    }
  });

  app.get('/api/dashboard/recent-reports', isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getRecentReports(10);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching recent reports:", error);
      res.status(500).json({ message: "Failed to fetch recent reports" });
    }
  });

  // Companies routes
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const companies = await neo4jService.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const company = await neo4jService.getCompanyById(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Reports routes
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reports = await storage.getReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post('/api/reports/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertReportSchema.parse({
        ...req.body,
        userId
      });

      // Create report record
      const report = await storage.createReport(validatedData);

      // Trigger n8n workflow
      const workflowId = process.env.N8N_WORKFLOW_ID || 'default-workflow';
      
      try {
        const { executionId } = await n8nService.triggerWorkflow(workflowId, {
          companyId: validatedData.companyId,
          companyName: validatedData.companyName,
          reportType: validatedData.reportType,
          reportId: report.id
        });

        // Update report with workflow ID
        await storage.updateReportStatus(report.id, 'processing', undefined, undefined);

        res.json({ 
          reportId: report.id, 
          executionId,
          message: "Report generation started successfully" 
        });

        // Start polling for completion (in background)
        pollWorkflowCompletion(executionId, report.id);

      } catch (workflowError) {
        await storage.updateReportStatus(report.id, 'failed');
        throw workflowError;
      }

    } catch (error) {
      console.error("Error generating report:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get('/api/reports/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const report = await storage.getReportById(parseInt(id));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Check if user owns the report or is admin
      const user = await storage.getUser(userId);
      if (report.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (report.status !== 'ready' || !report.filePath) {
        return res.status(400).json({ message: "Report not ready for download" });
      }

      const filePath = path.join(process.cwd(), 'uploads', report.filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(filePath, report.fileName || `report-${report.id}.pdf`);
      
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Helper function to poll workflow completion
  async function pollWorkflowCompletion(executionId: string, reportId: number) {
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const { status, finished } = await n8nService.getExecutionStatus(executionId);

        if (finished) {
          if (status === 'success') {
            // Try to download the result
            const fileBuffer = await n8nService.downloadExecutionResult(executionId);
            
            if (fileBuffer) {
              // Ensure uploads directory exists
              const uploadsDir = path.join(process.cwd(), 'uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              const fileName = `report-${reportId}-${Date.now()}.pdf`;
              const filePath = path.join(uploadsDir, fileName);
              
              fs.writeFileSync(filePath, fileBuffer);
              
              await storage.updateReportStatus(reportId, 'ready', fileName, fileName);
            } else {
              await storage.updateReportStatus(reportId, 'failed');
            }
          } else {
            await storage.updateReportStatus(reportId, 'failed');
          }
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 10000); // 10 seconds
        } else {
          // Timeout
          await storage.updateReportStatus(reportId, 'failed');
        }
      } catch (error) {
        console.error('Error polling workflow:', error);
        await storage.updateReportStatus(reportId, 'failed');
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  }

  const httpServer = createServer(app);
  return httpServer;
}
