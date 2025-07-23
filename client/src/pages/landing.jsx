import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Building2, FileText, Shield } from "lucide-react";
import { useLocation } from "wouter";

export function Landing() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Company Analytics Platform</h1>
          <p className="text-xl text-blue-100 mb-8">
            Access your business intelligence platform with comprehensive company data and automated reporting
          </p>
          
          <Button 
            onClick={() => setLocation('/auth')}
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3"
          >
            Sign In to Continue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Company Database</h3>
              <p className="text-blue-100">
                Access comprehensive company information with ATECO sector classifications
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Automated Reports</h3>
              <p className="text-blue-100">
                Generate detailed PDF reports through integrated n8n workflows
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
              <p className="text-blue-100">
                Role-based authentication with admin and user access levels
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-blue-100 text-sm">
            Powered by Neo4j, n8n, and modern web technologies
          </p>
        </div>
      </div>
    </div>
  );
}