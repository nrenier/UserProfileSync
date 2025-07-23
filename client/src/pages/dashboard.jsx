import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Factory, 
  FileText, 
  TrendingUp,
  Plus,
  RotateCcw,
  UserCheck,
  Activity
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated,
  });

  const { data: sectors, isLoading: sectorsLoading } = useQuery({
    queryKey: ['/api/dashboard/sectors'],
    enabled: isAuthenticated,
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-reports'],
    enabled: isAuthenticated,
  });

  if (authLoading || statsLoading) {
    return <DashboardSkeleton />;
  }

  const maxSectorCount = Math.max(...(sectors?.map(s => s.count) || [1]));

  const activityItems = [
    {
      icon: FileText,
      description: `${stats?.recentReports || 0} new reports generated`,
      timestamp: "Last 24 hours",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: Plus,
      description: "Companies database updated",
      timestamp: "2 hours ago",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: RotateCcw,
      description: "n8n workflows synchronized",
      timestamp: "3 hours ago",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: UserCheck,
      description: "System health check completed",
      timestamp: "6 hours ago",
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your company data and analytics</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {stats?.companyCount?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Neo4j Database
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sectors</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {sectors?.length || '0'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <Activity className="h-3 w-3 inline mr-1" />
                  ATECO Classification
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Factory className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Generated Reports</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {recentReports?.length || '0'}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  <FileText className="h-3 w-3 inline mr-1" />
                  This month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">98.2%</p>
                <p className="text-sm text-green-600 mt-1">
                  <Activity className="h-3 w-3 inline mr-1" />
                  n8n Integration
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top ATECO Sectors</CardTitle>
          </CardHeader>
          <CardContent>
            {sectorsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sectors?.slice(0, 5).map((sector, index) => {
                  const percentage = (sector.count / maxSectorCount) * 100;
                  const colors = [
                    'bg-primary', 
                    'bg-orange-500', 
                    'bg-green-500', 
                    'bg-purple-500', 
                    'bg-blue-500'
                  ];
                  
                  return (
                    <div key={sector.sector} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${colors[index]} rounded-full mr-3`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {sector.sector || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Progress value={percentage} className="w-32 mr-3" />
                        <span className="text-sm text-gray-600">{sector.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityItems.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Reports Table */}
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
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentReports?.slice(0, 5).map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{report.companyName}</div>
                            <div className="text-sm text-gray-500">ID: {report.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="capitalize">
                          {report.reportType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={report.status === 'ready' ? 'default' : 
                                  report.status === 'processing' ? 'secondary' : 'destructive'}
                          className="capitalize"
                        >
                          {report.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!recentReports || recentReports.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No reports generated yet. Visit the SUK Reports page to generate your first report.
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

function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}