import { useLocation, Link } from "wouter";
  import { Building2, ArrowLeftRight, LayoutDashboard, ReceiptText, Users, Landmark, FileText, Truck, Banknote, FolderKanban, Factory, UserCog, HardHat, Clock, Wallet, Ship, Settings } from "lucide-react";
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
    SidebarSeparator,
  } from "@/components/ui/sidebar";
  import { useAuth } from "@/hooks/use-auth";

  const financialItems = [
    { title: "لوحة التحكم", url: "/", icon: LayoutDashboard, parentOnly: false, permission: null },
    { title: "الشركات", url: "/companies", icon: Building2, parentOnly: false, permission: "companies" },
    { title: "التحويلات", url: "/transfers", icon: ArrowLeftRight, parentOnly: false, permission: "transfers" },
    { title: "المصاريف", url: "/expenses", icon: ReceiptText, parentOnly: true, permission: "expenses" },
    { title: "الأعضاء", url: "/members", icon: Users, parentOnly: true, permission: "members" },
    { title: "الديون الخارجية", url: "/external-debts", icon: Landmark, parentOnly: true, permission: "external_debts" },
    { title: "أموال خارجية", url: "/external-funds", icon: Banknote, parentOnly: true, permission: "external_funds" },
    { title: "المشاريع", url: "/projects", icon: FolderKanban, parentOnly: true, permission: "projects" },
    { title: "كشف الحساب", url: "/account-statement", icon: FileText, parentOnly: false, permission: "account_statement" },
  ];

  const operationsItems = [
    { title: "الشاحنات", url: "/trucks", icon: Truck, parentOnly: true, permission: "trucks" },
    { title: "المصنع", url: "/factory", icon: Factory, parentOnly: true, permission: "factory" },
    { title: "العمال", url: "/workers-management", icon: HardHat, parentOnly: true, permission: "workers" },
    { title: "الحضور والرواتب", url: "/attendance", icon: Clock, parentOnly: true, permission: "workers" },
  ];

  const systemItems = [
    { title: "إدارة المستخدمين", url: "/users", icon: UserCog, parentOnly: true, permission: null },
  ];

  export function AppSidebar() {
    const [location] = useLocation();
    const { isParent, user, hasPermission } = useAuth();

    const filterItems = (items: typeof financialItems) => items.filter(item => {
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

    const visibleFinancial = filterItems(financialItems);
    const visibleOperations = filterItems(operationsItems);
    const visibleSystem = filterItems(systemItems);

    return (
      <Sidebar side="right" className="border-l-0">
        <SidebarHeader className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
              <Factory className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground" data-testid="text-app-title">مجموعة تجاني</h2>
              <p className="text-xs text-sidebar-foreground/50">TEDJANI GROUP</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide">الإدارة المالية</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleFinancial.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}>
                        <item.icon className="!w-[18px] !h-[18px]" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {visibleOperations.length > 0 && (
            <>
              <SidebarSeparator className="bg-sidebar-border/50" />
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide">العمليات والمصنع</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleOperations.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}>
                            <item.icon className="!w-[18px] !h-[18px]" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {visibleSystem.length > 0 && (
            <>
              <SidebarSeparator className="bg-sidebar-border/50" />
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold tracking-wide">النظام</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleSystem.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "dashboard"}`}>
                            <item.icon className="!w-[18px] !h-[18px]" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
      </Sidebar>
    );
  }
  