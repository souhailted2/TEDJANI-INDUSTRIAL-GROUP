import { useLocation } from "wouter";
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  Ship,
  Anchor,
  LayoutDashboard,
  Wallet,
  FolderOpen,
  Warehouse,
  UserCog,
  CreditCard,
  Landmark,
  Receipt,
  FileText,
} from "lucide-react";
import { useAuth } from "@/App";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";
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

const mainItems = [
  { titleKey: "sidebar.dashboard", url: "/", icon: LayoutDashboard },
  { titleKey: "sidebar.products", url: "/products", icon: Package },
  { titleKey: "الموردين", url: "/suppliers", icon: Users },
  { titleKey: "الفئات", url: "/categories", icon: FolderOpen },
  { titleKey: "sidebar.warehouses", url: "/warehouses", icon: Warehouse },
];

const operationItems = [
  { titleKey: "sidebar.orders", url: "/orders", icon: ShoppingCart },
  { titleKey: "sidebar.deliveries", url: "/deliveries", icon: Truck },
  { titleKey: "sidebar.warehouseInventory", url: "/warehouse-inventory", icon: Warehouse },
  { titleKey: "sidebar.shipping", url: "/shipping", icon: Ship },
  { titleKey: "وصول الحاويات", url: "/arrivals", icon: Anchor },
  { titleKey: "سجل الفواتير", url: "/container-invoices", icon: FileText },
];

const financeItems = [
  { titleKey: "صندوق الحسابات", url: "/cashbox", icon: Landmark },
  { titleKey: "صندوق المصاريف", url: "/expenses", icon: Receipt },
  { titleKey: "حسابات الموردين", url: "/supplier-accounts", icon: Wallet },
  { titleKey: "حسابات شركات الشحن", url: "/shipping-accounts", icon: CreditCard },
];

const warehouseMainUrls = ["/", "/products", "/warehouses"];
const warehouseOperationUrls = ["/orders", "/deliveries", "/warehouse-inventory", "/shipping"];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAdmin = user?.role === "admin";
  const isWarehouse = user?.role === "warehouse";

  const resolveTitle = (titleKey: string) => {
    const translated = t(titleKey, language);
    return translated !== titleKey ? translated : titleKey;
  };

  const getMainItems = () => {
    if (isAdmin) return mainItems;
    if (isWarehouse) return mainItems.filter(i => warehouseMainUrls.includes(i.url));
    return mainItems.filter(i => i.url === "/" || i.url === "/products");
  };

  const getOperationItems = () => {
    if (isAdmin) return operationItems;
    if (isWarehouse) return operationItems.filter(i => warehouseOperationUrls.includes(i.url));
    return [];
  };

  const visibleMainItems = getMainItems();
  const visibleOperationItems = getOperationItems();

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold" data-testid="text-app-title">
              {isWarehouse && language === "zh" ? "库存管理系统" : "نظام إدارة المخزون"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isWarehouse && language === "zh" ? "中国进口管理" : "إدارة الاستيراد من الصين"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.main", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{resolveTitle(item.titleKey)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleOperationItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.operations", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleOperationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "")}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{resolveTitle(item.titleKey)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>المالية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "")}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{resolveTitle(item.titleKey)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/users"}
                    data-testid="nav-users"
                  >
                    <a href="/users">
                      <UserCog className="h-4 w-4" />
                      <span>إدارة المستخدمين</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
