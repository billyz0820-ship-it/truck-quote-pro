import { Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TabProvider, useTab } from "@/contexts/TabContext";
import { TabBar } from "@/components/TabBar";
import { PageTransition } from "@/components/PageTransition";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  Package, 
  DollarSign, 
  Settings, 
  FileText, 
  ShoppingCart,
  Truck,
  LogOut,
  User,
  ChevronDown,
  Ticket,
  Receipt,
  Users,
  PackageCheck
} from "lucide-react";

const DashboardLayout = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { title: "首页", url: "/dashboard", icon: Home },
    { 
      title: "订单列表", 
      icon: Package,
      subItems: [
        { title: "卡车订单", url: "/dashboard/orders/truck", icon: Truck },
        { title: "快递订单", url: "/dashboard/orders/express", icon: Package },
      ]
    },
    { title: "财务", url: "/dashboard/finance", icon: DollarSign },
    { title: "优惠券", url: "/dashboard/coupons", icon: Ticket },
    { title: "配置管理", url: "/dashboard/settings", icon: Settings },
    { title: "工单管理", url: "/dashboard/tickets", icon: FileText },
    { title: "产品模块", url: "/dashboard/products", icon: ShoppingCart },
    { title: "知识库", url: "/dashboard/knowledge", icon: FileText },
    { title: "通知管理", url: "/dashboard/notifications", icon: FileText },
    { title: "邮件管理", url: "/dashboard/emails", icon: FileText },
    { title: "返单管理", url: "/dashboard/rebills", icon: Receipt },
    { title: "用户管理", url: "/dashboard/users", icon: Users },
    { 
      title: "快递管理", 
      icon: PackageCheck,
      subItems: [
        { title: "快递账号", url: "/dashboard/carrier/accounts", icon: Truck },
        { title: "账套管理", url: "/dashboard/carrier/templates", icon: FileText },
        { title: "账号成本", url: "/dashboard/carrier/costs", icon: DollarSign },
        { title: "价格比较", url: "/dashboard/carrier/comparison", icon: Receipt },
        { title: "偏远地址", url: "/dashboard/carrier/remote-areas", icon: Package },
        { title: "打单规则", url: "/dashboard/carrier/rules", icon: Settings },
        { title: "客户报价", url: "/dashboard/carrier/customer-pricing", icon: Settings },
        { title: "计算历史", url: "/dashboard/carrier/price-history", icon: Settings },
      ]
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar menuItems={menuItems} isActive={isActive} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary">北美卡车经纪</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>用</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">用户名</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                个人设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Tab Bar */}
        <TabBar />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-secondary/10 overflow-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

const AppSidebar = ({ 
  menuItems, 
  isActive 
}: { 
  menuItems: any[], 
  isActive: (path: string) => boolean 
}) => {
  const { state } = useSidebar();
  const { openTab } = useTab();

  const handleNavClick = (item: any) => {
    if (item.url) {
      openTab({
        title: item.title,
        path: item.url,
        icon: item.icon,
      });
    }
  };

  return (
    <Sidebar collapsible="icon" className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-3">导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="h-12 px-4 cursor-pointer">
                          <item.icon className="h-5 w-5" />
                          {state === "expanded" && (
                            <>
                              <span className="text-base flex-1 text-left">{item.title}</span>
                              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem: any) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                className={`h-10 cursor-pointer ${isActive(subItem.url) ? "bg-accent text-accent-foreground" : ""}`}
                                onClick={() => handleNavClick(subItem)}
                              >
                                <subItem.icon className="h-4 w-4" />
                                {state === "expanded" && <span>{subItem.title}</span>}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton 
                      className={`h-12 px-4 cursor-pointer ${item.url && isActive(item.url) ? "bg-accent text-accent-foreground" : ""}`}
                      onClick={() => handleNavClick(item)}
                    >
                      <item.icon className="h-5 w-5" />
                      {state === "expanded" && <span className="text-base">{item.title}</span>}
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const DashboardLayoutWithProvider = () => (
  <SidebarProvider>
    <TabProvider>
      <DashboardLayout />
    </TabProvider>
  </SidebarProvider>
);

export default DashboardLayoutWithProvider;