import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Building, User, Factory, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import Transfers from "@/pages/transfers";
import Expenses from "@/pages/expenses";
import Members from "@/pages/members";
import ExternalDebts from "@/pages/external-debts";
import AccountStatement from "@/pages/account-statement";
import Trucks from "@/pages/trucks";
import ExternalFunds from "@/pages/external-funds";
import Projects from "@/pages/projects";
import FactoryPage from "@/pages/factory";
import WorkersManagement from "@/pages/workers-management";
import Attendance from "@/pages/attendance";
import UsersPage from "@/pages/users";
import Landing from "@/pages/landing";
import OperatorDashboard from "@/pages/operator-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/companies" component={Companies} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/members" component={Members} />
      <Route path="/external-debts" component={ExternalDebts} />
      <Route path="/account-statement" component={AccountStatement} />
      <Route path="/trucks" component={Trucks} />
      <Route path="/external-funds" component={ExternalFunds} />
      <Route path="/projects" component={Projects} />
      <Route path="/factory" component={FactoryPage} />
      <Route path="/workers-management" component={WorkersManagement} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OperatorApp() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold" data-testid="text-operator-name">
              {user?.name}
            </span>
            <Badge variant="secondary" className="mr-2 text-[10px] px-1.5 py-0">مشغّل</Badge>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="text-muted-foreground hover:text-destructive"
          data-testid="button-operator-logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <OperatorDashboard />
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { company, user, logout, isLoggingOut, isParent } = useAuth();

  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3rem",
  };

  const getRoleBadge = () => {
    if (user?.role === "app_user") return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">مستخدم</Badge>;
    if (isParent) return <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">مدير</Badge>;
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">شركة</Badge>;
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              {(company || user?.role === "app_user") && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                    {user?.role === "app_user" ? <Shield className="w-4 h-4 text-white" /> : isParent ? <Factory className="w-4 h-4 text-white" /> : <Building className="w-4 h-4 text-white" />}
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold leading-tight" data-testid="text-company-name">
                      {user?.name}
                    </span>
                    {getRoleBadge()}
                  </div>
                </div>
              )}
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="text-muted-foreground hover:text-destructive transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isOperator } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900">
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-pulse">
            <Factory className="w-7 h-7 text-emerald-950" />
          </div>
          <p className="text-emerald-200/70 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Landing />;
  if (isOperator) return <OperatorApp />;
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
