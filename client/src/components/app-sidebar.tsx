import { useLocation, Link } from "wouter";
import { Building2, ArrowLeftRight, LayoutDashboard, Building, ReceiptText, Users, Landmark, FileText, Truck, Banknote, FolderKanban, Factory, UserCog, HardHat, Clock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard, parentOnly: false, permission: null },
  { title: "الشركات", url: "/companies", icon: Building2, parentOnly: false, permission: "companies" },
  { title: "التحويلات", url: "/transfers", icon: ArrowLeftRight, parentOnly: false, permission: "transfers" },
  { title: "المصاريف", url: "/expenses", icon: ReceiptText, parentOnly: true, permission: "expenses" },
  { title: "الأعضاء", url: "/members", icon: Users, parentOnly: true, permission: "members" },
  { title: "الديون الخارجية", url: "/external-debts", icon: Landmark, parentOnly: true, permission: "external_debts" },
  { title: "الشاحنات", url: "/trucks", icon: Truck, parentOnly: true, permission: "trucks" },
  { title: "أموال خارجية", url: "/external-funds", icon: Banknote, parentOnly: true, permission: "external_funds" },
  { title: "المشاريع", url: "/projects", icon: FolderKanban, parentOnly: true, permission: "projects" },
  { title: "المصنع", url: "/factory", icon: Factory, parentOnly: true, permission: "factory" },
  { title: "العمال", url: "/workers-management", icon: HardHat, parentOnly: true, permission: "workers" },
  { title: "الحضور والرواتب", url: "/attendance", icon: Clock, parentOnly: true, permission: "workers" },
  { title: "كشف الحساب", url: "/account-statement", icon: FileText, parentOnly: false, permission: "account_statement" },
  { title: "إدارة المستخدمين", url: "/users", icon: UserCog, parentOnly: true, permission: null },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { isParent, user, hasPermission } = useAuth();

  const visibleItems = menuItems.filter(item => {
    if (item.url === "/users") {
      return user?.role === "company" && user?.isParent;
    }
    if (user?.role === "app_user") {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    }
    if (item.parentOnly) return isParent;
    return true;
  });

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold" data-testid="text-app-title">التحويلات المالية</h2>
            <p className="text-xs text-muted-foreground">إدارة الحسابات</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
