replit_final_file
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { Download, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import { Loader2, AlertCircle } from "lucide-react";

export function SUKReports() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [reportType, setReportType] = useState("standard");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
    enabled: isAuthenticated,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds to check status updates
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ companyId, companyName, reportType }) => {
      const response = await apiRequest('POST', '/api/reports/generate', {
        companyId,
        companyName,
        reportType
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Generation Started",
        description: "Your report is being generated. You'll be notified when it's ready.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setSelectedCompany("");
      setReportType("standard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedCompany) {
      toast({
        title: "Selection Required",
        description: "Please select a company first.",
        variant: "destructive",
      });
      return;
    }

    const company = companies?.find(c => c.id === selectedCompany);
    if (!company) {
      toast({
        title: "Error",
        description: "Selected company not found.",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate({
      companyId: selectedCompany,
      companyName: company.name,
      reportType
    });
  };

  const handleDownloadReport = async (reportId, fileName) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (authLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">SUK Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download company analysis reports</p>
      </div>

      {/* Report Generation Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Company
              </label>
              {companiesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Analysis</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="financial">Financial Analysis</SelectItem>
                  <SelectItem value="market">Market Position</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending || !selectedCompany}
              className="flex items-center space-x-2"
            >
              {generateReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>Generate Report</span>
            </Button>

            {generateReportMutation.isPending && (
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing workflow...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports?.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{report.companyName}</div>
                            <div className="text-sm text-gray-500">{report.fileName || `report-${report.id}.pdf`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="capitalize">
                          {report.reportType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={getStatusColor(report.status)}
                          className="capitalize flex items-center space-x-1"
                        >
                          {getStatusIcon(report.status)}
                          <span>{report.status}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.status === 'ready' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(report.id, report.fileName)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-gray-400 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {report.status === 'processing' ? 'Processing' : 'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!reports || reports.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No reports generated yet. Use the form above to generate your first report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}