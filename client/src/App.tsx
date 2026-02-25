import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Building, User } from "lucide-react";
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
      <header className="flex items-center justify-between gap-2 p-3 border-b sticky top-0 z-50 bg-background" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium" data-testid="text-operator-name">
            {user?.name}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => logout()}
          disabled={isLoggingOut}
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
  const { company, user, logout, isLoggingOut } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              {(company || user?.role === "app_user") && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
                    {user?.role === "app_user" ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline" data-testid="text-company-name">
                    {user?.name}
                  </span>
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => logout()}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-md mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
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
