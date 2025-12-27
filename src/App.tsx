import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "./components/LoadingSpinner";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

// 懒加载组件
const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  Dashboard: lazy(() => import('@/pages/Dashboard')),
  TruckOrders: lazy(() => import('@/pages/orders/TruckOrders')),
  ExpressOrders: lazy(() => import('@/pages/orders/ExpressOrders')),
  CreateExpressOrderPage: lazy(() => import('@/pages/orders/CreateExpressOrderPage')),
  ReturnOrders: lazy(() => import('@/pages/orders/ReturnOrders')),
  CreateReturnOrderPage: lazy(() => import('@/pages/orders/CreateReturnOrderPage')),
  CreateOrder: lazy(() => import('@/pages/orders/CreateOrder')),
  QuoteResults: lazy(() => import('@/pages/orders/QuoteResults')),
  OrderDetails: lazy(() => import('@/pages/orders/OrderDetails')),
  OrderDetailView: lazy(() => import('@/pages/orders/OrderDetailView')),
  OrderConfirmation: lazy(() => import('@/pages/orders/OrderConfirmation')),
  Finance: lazy(() => import('@/pages/finance/Finance')),
  FinanceQuotations: lazy(() => import('@/pages/finance/FinanceQuotations')),
  TransactionRecords: lazy(() => import('@/pages/finance/TransactionRecords')),
  RebillManagement: lazy(() => import('@/pages/rebills/RebillManagement')),
  FreightDifference: lazy(() => import('@/pages/finance/FreightDifference')),
  CouponManagement: lazy(() => import('@/pages/coupons/CouponManagement')),
  Settings: lazy(() => import('@/pages/settings/Settings')),
  TicketManagement: lazy(() => import('@/pages/tickets/TicketManagement')),
  TicketDetail: lazy(() => import('@/pages/tickets/TicketDetail')),
  KnowledgeBase: lazy(() => import('@/pages/knowledge/KnowledgeBase')),
  NotificationManagement: lazy(() => import('@/pages/notifications/NotificationManagement')),
  EmailManagement: lazy(() => import('@/pages/emails/EmailManagement')),
  UserManagement: lazy(() => import('@/pages/users/UserManagement')),
  CarrierAccounts: lazy(() => import('@/pages/carrier/CarrierAccounts')),
  PricingTemplates: lazy(() => import('@/pages/carrier/PricingTemplates')),
  PricingTemplateEdit: lazy(() => import('@/pages/carrier/PricingTemplateEdit')),
  AccountCosts: lazy(() => import('@/pages/carrier/AccountCosts')),
  AccountCostEdit: lazy(() => import('@/pages/carrier/AccountCostEdit')),
  PriceComparison: lazy(() => import('@/pages/carrier/PriceComparison')),
  RemoteAreas: lazy(() => import('@/pages/carrier/RemoteAreas')),
  ShippingRules: lazy(() => import('@/pages/carrier/ShippingRules')),
  CustomerPricing: lazy(() => import('@/pages/carrier/CustomerPricing')),
  CustomerPricingEdit: lazy(() => import('@/pages/carrier/CustomerPricingEdit')),
  PriceHistory: lazy(() => import('@/pages/carrier/PriceHistory')),
  LogisticsTriggers: lazy(() => import('@/pages/logistics/LogisticsTriggers')),
  LogisticsServices: lazy(() => import('@/pages/logistics/LogisticsServices')),
  ChannelConfigs: lazy(() => import('@/pages/logistics/ChannelConfigs')),
  TruckCarrierManagement: lazy(() => import('@/pages/truck/TruckCarrierManagement')),
  TruckCarrierPricing: lazy(() => import('@/pages/truck/TruckCarrierPricing')),
  PlatformWarehousePricing: lazy(() => import('@/pages/truck/PlatformWarehousePricing')),
  PlatformWarehousePricingDetail: lazy(() => import('@/pages/truck/PlatformWarehousePricingDetail')),
  ZipRegionMapping: lazy(() => import('@/pages/truck/ZipRegionMapping')),
  ContractManagement: lazy(() => import('@/pages/contracts/ContractManagement')),
  AgreementManagement: lazy(() => import('@/pages/contracts/AgreementManagement')),
  AddressManagement: lazy(() => import('@/pages/settings/AddressManagement')),
  AddressZoneConfig: lazy(() => import('@/pages/settings/AddressZoneConfig')),
  ResourceManagement: lazy(() => import('@/pages/settings/ResourceManagement')),
};

const queryClient = new QueryClient();

// 内部组件，使用AuthContext
const AppContent = () => {
  const { filteredRoutes, loading } = useAuth();

  // 渲染动态路由
  const renderDynamicRoutes = () => {
    if (loading) {
      return <Route path="*" element={<div>Loading permissions...</div>} />;
    }

    // 将所有路由扁平化为单一层级
    const flatRoutes: JSX.Element[] = [];

    console.log('=== 开始处理动态路由 ===');
    console.log('过滤后路由:', filteredRoutes.map(r => ({ code: r.code, title: r.title, childrenCount: r.children?.length || 0 })));

    filteredRoutes.forEach(route => {
      // 跳过 dashboard 主路由
      if (route.path === '/dashboard') return;

      if (route.children && route.children.length > 0) {
        // 处理所有子路由
        console.log(`处理父路由: ${route.code}, 子路由数量: ${route.children.length}`);
        route.children.forEach((child: any) => {
          console.log(`处理子路由: ${child.code} -> ${child.path}, 组件: ${child.component}`);
          
          // 将完整路径转换为相对路径（移除 /dashboard 前缀）
          const finalChildPath = child.path.replace('/dashboard/', '');
          
          // 检查组件是否存在
          const Component = componentMap[child.component];
          if (!Component) {
            console.error(`组件不存在: ${child.component}，路由: ${child.path}`);
            return; // 跳过这个路由
          }
          
          console.log(`✅ 生成路由: ${finalChildPath} -> ${child.component}`);
          console.log(`  原路径: ${child.path}`);
          console.log(`  相对路径: ${finalChildPath}`);
          flatRoutes.push(
            <Route
              key={child.path}
              path={finalChildPath}
              element={
                <ProtectedRoute requireRoutePermission={`/dashboard/${finalChildPath}`}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          );
        });
      } else {
        // 处理单个路由
        // 将完整路径转换为相对路径（移除 /dashboard 前缀）
        const routePath = route.path.replace('/dashboard/', '');
        
        // 检查组件是否存在
        const Component = componentMap[route.component];
        if (!Component) {
          console.error(`组件不存在: ${route.component}，路由: ${route.path}`);
          return; // 跳过这个路由
        }
        
        flatRoutes.push(
          <Route
            key={route.path}
            path={routePath}
            element={
              <ProtectedRoute requireRoutePermission={route.path}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Component />
                </Suspense>
              </ProtectedRoute>
            }
          />
        );
      }
    });
    
    console.log(`=== 路由生成完成 ===`);
    console.log(`生成路由数量: ${flatRoutes.length}`);
    console.log('=== 动态路由处理结束 ===');
    
    return flatRoutes;
  };

  return (
    <Routes>
      {/* 公共路由 */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* 受保护的路由 */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        {/* 动态路由 */}
        {renderDynamicRoutes()}
        {/* 兜底404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
