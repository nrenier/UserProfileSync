import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  FileText, 
  Building2, 
  PieChart, 
  LogOut,
  User
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar({ className }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'SUK Reports', href: '/suk-reports', icon: FileText },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
  ];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 ${className || ''}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-800">Analytics</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-primary bg-primary/10 font-medium' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}>
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || ''} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}