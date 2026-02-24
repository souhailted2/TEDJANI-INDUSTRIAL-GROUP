import { useState, useEffect, createContext, useContext } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Languages, Settings, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Suppliers from "@/pages/suppliers";
import Categories from "@/pages/categories";
import Warehouses from "@/pages/warehouses";
import Orders from "@/pages/orders";
import Deliveries from "@/pages/deliveries";
import Shipping from "@/pages/shipping";
import Arrivals from "@/pages/arrivals";
import SupplierAccounts from "@/pages/supplier-accounts";
import ShippingAccounts from "@/pages/shipping-accounts";
import WarehouseInventory from "@/pages/warehouse-inventory";
import Login from "@/pages/login";
import UserManagement from "@/pages/user-management";
import Cashbox from "@/pages/cashbox";
import Expenses from "@/pages/expenses";
import ContainerInvoices from "@/pages/container-invoices";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatusAlerts } from "@/hooks/use-status-alerts";
import { useToast } from "@/hooks/use-toast";
import { LanguageContext, useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";
import { t } from "@/lib/translations";

interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
  allowedCategories: number[];
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Redirect to="/" />;
  return <Component />;
}

function NonWarehouseRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role === "warehouse") return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/products" component={Products} />
      <Route path="/suppliers">{() => <NonWarehouseRoute component={Suppliers} />}</Route>
      <Route path="/categories">{() => <NonWarehouseRoute component={Categories} />}</Route>
      <Route path="/warehouses" component={Warehouses} />
      <Route path="/orders" component={Orders} />
      <Route path="/deliveries" component={Deliveries} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/arrivals">{() => <AdminRoute component={Arrivals} />}</Route>
      <Route path="/supplier-accounts">{() => <AdminRoute component={SupplierAccounts} />}</Route>
      <Route path="/shipping-accounts">{() => <AdminRoute component={ShippingAccounts} />}</Route>
      <Route path="/warehouse-inventory" component={WarehouseInventory} />
      <Route path="/users">{() => <AdminRoute component={UserManagement} />}</Route>
      <Route path="/cashbox">{() => <AdminRoute component={Cashbox} />}</Route>
      <Route path="/expenses">{() => <AdminRoute component={Expenses} />}</Route>
      <Route path="/container-invoices">{() => <AdminRoute component={ContainerInvoices} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function StatusAlertProvider() {
  useStatusAlerts();
  return null;
}

function ProfileDialog({ open, onOpenChange, user, onUpdate }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
  onUpdate: (user: AuthUser) => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    if (open) {
      setUsername(user.username);
      setDisplayName(user.displayName);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [open, user]);

  const handleSave = async () => {
    setError("");

    if (!username.trim() || !displayName.trim()) {
      setError(t("profile.errorRequired", language));
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError(t("profile.errorMismatch", language));
      return;
    }

    if (newPassword && !currentPassword) {
      setError(t("profile.errorCurrentRequired", language));
      return;
    }

    try {
      setSaving(true);
      const body: any = { username: username.trim(), displayName: displayName.trim() };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await apiRequest("PATCH", "/api/auth/profile", body);
      const updated = await res.json();
      onUpdate(updated);
      toast({ title: t("profile.success", language) });
      onOpenChange(false);
    } catch (e: any) {
      let msg = t("profile.errorGeneric", language);
      if (e?.message) {
        try {
          const parsed = JSON.parse(e.message.replace(/^\d+:\s*/, ""));
          msg = parsed.message || msg;
        } catch {
          msg = e.message.replace(/^\d+:\s*/, "");
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle>{t("profile.title", language)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md" data-testid="text-profile-error">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>{t("profile.username", language)}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-profile-username"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.displayName", language)}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid="input-profile-display-name"
            />
          </div>
          <div className="border-t pt-4 space-y-2">
            <Label className="text-muted-foreground">{t("profile.changePassword", language)}</Label>
            <div className="space-y-2">
              <Label>{t("profile.currentPassword", language)}</Label>
              <div className="flex gap-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex-1"
                  data-testid="input-profile-current-password"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  data-testid="button-toggle-current-password"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("profile.newPassword", language)}</Label>
              <div className="flex gap-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                  data-testid="input-profile-new-password"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  data-testid="button-toggle-new-password"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("profile.confirmPassword", language)}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-profile-confirm-password"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-profile-cancel">
              {t("profile.cancel", language)}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="button-profile-save">
              {saving ? t("profile.saving", language) : t("profile.save", language)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("app-language") as Language) || "ar";
  });

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "ar" ? "ar" : "zh";
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("not logged in");
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
    queryClient.clear();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login onLogin={setUser} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
          <AuthContext.Provider value={{ user, setUser }}>
            <StatusAlertProvider />
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="flex items-center justify-between gap-2 px-3 border-b h-12 shrink-0">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex items-center gap-2">
                      {user.role === "warehouse" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLanguageChange(language === "ar" ? "zh" : "ar")}
                          data-testid="button-language-toggle"
                        >
                          <Languages className="h-4 w-4" />
                          <span className="mr-1">{t("header.switchLang", language)}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProfileOpen(true)}
                        className="text-sm text-muted-foreground"
                        data-testid="button-profile-settings"
                      >
                        <Settings className="h-4 w-4" />
                        <span>{user.displayName}</span>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleLogout} data-testid="button-logout">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthContext.Provider>
          <ProfileDialog
            open={profileOpen}
            onOpenChange={setProfileOpen}
            user={user}
            onUpdate={setUser}
          />
        </LanguageContext.Provider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
