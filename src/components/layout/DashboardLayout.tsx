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
  Truck,
  LogOut,
  User,
  ChevronDown,
  Ticket,
  Receipt,
  Users,
  PackageCheck,
  CornerUpLeft,
  ArrowLeftRight,
  Star,
  FileSignature,
  ScrollText,
  MapPin
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
        { title: "退货订单", url: "/dashboard/orders/return", icon: CornerUpLeft },
      ]
    },
    { 
      title: "财务", 
      icon: DollarSign,
      subItems: [
        { title: "财务概览", url: "/dashboard/finance", icon: DollarSign },
        { title: "当前报价", url: "/dashboard/finance/quotations", icon: FileText },
        { title: "流水记录", url: "/dashboard/finance/transactions", icon: Receipt },
        { title: "反弹账单", url: "/dashboard/finance/rebills", icon: Receipt },
        { title: "运费差异", url: "/dashboard/finance/freight-difference", icon: ArrowLeftRight },
      ]
    },
    { title: "优惠券", url: "/dashboard/coupons", icon: Ticket },
    { 
      title: "配置管理", 
      icon: Settings,
      subItems: [
        { title: "系统设置", url: "/dashboard/settings", icon: Settings },
        { title: "地址配置", url: "/dashboard/settings/addresses", icon: MapPin },
      ]
    },
    { title: "工单管理", url: "/dashboard/tickets", icon: FileText },
    { title: "知识库", url: "/dashboard/knowledge", icon: FileText },
    { title: "通知管理", url: "/dashboard/notifications", icon: FileText },
    { title: "邮件管理", url: "/dashboard/emails", icon: FileText },
    { title: "用户管理", url: "/dashboard/users", icon: Users },
    { 
      title: "快递管理", 
      icon: PackageCheck,
      subItems: [
        { title: "快递账号", url: "/dashboard/carrier/accounts", icon: Truck },
        { title: "账套管理", url: "/dashboard/carrier/templates", icon: FileText },
        { title: "账号成本", url: "/dashboard/carrier/costs", icon: DollarSign },
        { title: "价格比较", url: "/dashboard/carrier/comparison", icon: Receipt },
        { title: "打单规则", url: "/dashboard/carrier/rules", icon: Settings },
        { title: "客户报价", url: "/dashboard/carrier/customer-pricing", icon: Settings },
      ]
    },
    { 
      title: "物流设置", 
      icon: Settings,
      subItems: [
        { title: "物流触发", url: "/dashboard/logistics/triggers", icon: Settings },
        { title: "物流服务", url: "/dashboard/logistics/services", icon: Package },
        { title: "偏远地址", url: "/dashboard/logistics/remote-areas", icon: Package },
        { title: "渠道配置", url: "/dashboard/logistics/channels", icon: Settings },
      ]
    },
    { 
      title: "卡车管理", 
      icon: Truck,
      subItems: [
        { title: "承运商管理", url: "/dashboard/truck/carriers", icon: Truck },
        { title: "平台仓专送", url: "/dashboard/truck/platform-warehouse", icon: Package },
        { title: "邮编地区映射", url: "/dashboard/truck/zip-region", icon: Settings },
      ]
    },
    { 
      title: "合同与协议", 
      icon: FileSignature,
      subItems: [
        { title: "合同管理", url: "/dashboard/contracts", icon: ScrollText },
        { title: "协议管理", url: "/dashboard/agreements", icon: FileText },
      ]
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <AppSidebar menuItems={menuItems} isActive={isActive} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-slate-600 hover:text-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-800">智运物流</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                <Avatar className="h-8 w-8 bg-blue-100">
                  <AvatarFallback className="bg-blue-100 text-blue-600">用</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">用户名</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
              <DropdownMenuLabel className="text-slate-800">我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="text-slate-600 hover:text-slate-800 hover:bg-slate-50">
                <User className="mr-2 h-4 w-4" />
                个人设置
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem onClick={handleLogout} className="text-slate-600 hover:text-slate-800 hover:bg-slate-50">
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
        <main className="flex-1 p-6 bg-slate-50 overflow-auto">
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
    <Sidebar collapsible="icon" className="w-64 bg-white border-r border-slate-200">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-3 text-slate-800">导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="h-12 px-4 cursor-pointer text-slate-600 hover:text-slate-800 hover:bg-slate-50">
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
                                className={`h-10 cursor-pointer ${
                                  isActive(subItem.url) 
                                    ? "bg-blue-50 text-blue-600" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
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
                      className={`h-12 px-4 cursor-pointer ${
                        item.url && isActive(item.url) 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                      }`}
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
