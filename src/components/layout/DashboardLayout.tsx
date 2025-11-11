import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
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
  Users
} from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { title: "首页", url: "/dashboard", icon: Home },
    { title: "订单列表", url: "/dashboard/orders", icon: Package },
    { title: "财务", url: "/dashboard/finance", icon: DollarSign },
    { title: "优惠券", url: "/dashboard/coupons", icon: Ticket },
    { title: "配置管理", url: "/dashboard/settings", icon: Settings },
    { title: "工单管理", url: "/dashboard/tickets", icon: FileText },
    { title: "产品模块", url: "/dashboard/products", icon: ShoppingCart },
    { title: "知识库", url: "/dashboard/knowledge", icon: FileText },
    { title: "通知管理", url: "/dashboard/notifications", icon: FileText },
    { title: "邮件管理", url: "/dashboard/emails", icon: FileText },
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

        {/* Main Content */}
        <main className="flex-1 p-6 bg-secondary/10">
          <Outlet />
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

  return (
    <Sidebar collapsible="icon" className="w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-3">导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 px-4">
                    <a 
                      href={item.url}
                      className={isActive(item.url) ? "bg-accent text-accent-foreground" : ""}
                    >
                      <item.icon className="h-5 w-5" />
                      {state === "expanded" && <span className="text-base">{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
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
    <DashboardLayout />
  </SidebarProvider>
);

export default DashboardLayoutWithProvider;