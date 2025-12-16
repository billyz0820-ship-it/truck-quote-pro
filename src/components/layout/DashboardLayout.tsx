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
  const { signOut, sidebarMenus, user } = useAuth();
  const { t } = useLanguage();

  // 使用动态权限菜单，如果没有权限信息则显示空数组
  const menuItems = sidebarMenus || [];

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

// 图标映射函数
const getIcon = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    'Dashboard': Home,
    'Package': Package,
    'DollarSign': DollarSign,
    'Settings': Settings,
    'FileText': FileText,
    'Truck': Truck,
    'HelpCircle': FileText, // 临时使用FileText
    'Tag': Ticket,
    'Book': FileText, // 临时使用FileText
    'Bell': FileText, // 临时使用FileText
    'Mail': FileText, // 临时使用FileText
    'Users': Users,
    'ShoppingCart': Package,
    'FileSignature': FileSignature,
    'ScrollText': ScrollText,
    'MapPin': MapPin,
  };
  return iconMap[iconName || ''] || Package;
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
    if (item.path) {
      openTab({
        title: item.title,
        path: item.path,
        icon: getIcon(item.icon),
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
              {menuItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <SidebarMenuItem key={item.code || item.title}>
                    {item.children ? (
                      <Collapsible defaultOpen className="group/collapsible">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="h-12 px-4 cursor-pointer text-slate-600 hover:text-slate-800 hover:bg-slate-50">
                            <Icon className="h-5 w-5" />
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
                            {item.children.map((subItem: any) => {
                              const SubIcon = getIcon(subItem.icon);
                              return (
                                <SidebarMenuSubItem key={subItem.code || subItem.title}>
                                  <SidebarMenuSubButton
                                    className={`h-10 cursor-pointer ${
                                      isActive(subItem.path) 
                                        ? "bg-blue-50 text-blue-600" 
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    }`}
                                    onClick={() => handleNavClick(subItem)}
                                  >
                                    <SubIcon className="h-4 w-4" />
                                    {state === "expanded" && <span>{subItem.title}</span>}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton 
                        className={`h-12 px-4 cursor-pointer ${
                          item.path && isActive(item.path) 
                            ? "bg-blue-50 text-blue-600" 
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                        onClick={() => handleNavClick(item)}
                      >
                        <Icon className="h-5 w-5" />
                        {state === "expanded" && <span className="text-base">{item.title}</span>}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
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
