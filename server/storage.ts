import {
  users,
  reports,
  type User,
  type InsertUser,
  type Report,
  type InsertReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for local authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReportsByUser(userId: number): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  updateReportStatus(id: number, status: string, fileName?: string, filePath?: string): Promise<Report | undefined>;
  getRecentReports(limit?: number): Promise<Report[]>;
}

export class DatabaseStorage implements IStorage {
  async testConnection() {
    // Test if the users table exists by running a simple query
    try {
      await db.select().from(users).limit(1);
    } catch (error: any) {
      if (error.code === '42P01') { // Table does not exist
        throw new Error('Database tables not found. Please run migrations.');
      }
      throw error;
    }
  }
  // User operations for local authentication

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async getReportById(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async updateReportStatus(
    id: number, 
    status: string, 
    fileName?: string, 
    filePath?: string
  ): Promise<Report | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (fileName) updateData.fileName = fileName;
    if (filePath) updateData.filePath = filePath;

    const [updatedReport] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async getRecentReports(limit: number = 10): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();