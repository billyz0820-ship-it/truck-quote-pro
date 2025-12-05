import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import TruckOrders from "./pages/orders/TruckOrders";
import ExpressOrders from "./pages/orders/ExpressOrders";
import ReturnOrders from "./pages/orders/ReturnOrders";
import CreateExpressOrderPage from "./pages/orders/CreateExpressOrderPage";
import CreateReturnOrderPage from "./pages/orders/CreateReturnOrderPage";
import CreateOrder from "./pages/orders/CreateOrder";
import QuoteResults from "./pages/orders/QuoteResults";
import OrderDetails from "./pages/orders/OrderDetails";
import OrderDetailView from "./pages/orders/OrderDetailView";
import OrderConfirmation from "./pages/orders/OrderConfirmation";
import Finance from "./pages/finance/Finance";
import FinanceQuotations from "./pages/finance/FinanceQuotations";
import TransactionRecords from "./pages/finance/TransactionRecords";
import FreightDifference from "./pages/finance/FreightDifference";
import Settings from "./pages/settings/Settings";
import TicketManagement from "./pages/tickets/TicketManagement";
import TicketDetail from "./pages/tickets/TicketDetail";
import CouponManagement from "./pages/coupons/CouponManagement";
import RebillManagement from "./pages/rebills/RebillManagement";
import KnowledgeBase from "./pages/knowledge/KnowledgeBase";
import NotificationManagement from "./pages/notifications/NotificationManagement";
import EmailManagement from "./pages/emails/EmailManagement";
import UserManagement from "./pages/users/UserManagement";
import CarrierAccounts from "./pages/carrier/CarrierAccounts";
import PricingTemplates from "./pages/carrier/PricingTemplates";
import AccountCosts from "./pages/carrier/AccountCosts";
import AccountCostEdit from "./pages/carrier/AccountCostEdit";
import PriceComparison from "./pages/carrier/PriceComparison";
import RemoteAreas from "./pages/carrier/RemoteAreas";
import ShippingRules from "./pages/carrier/ShippingRules";
import CustomerPricing from "./pages/carrier/CustomerPricing";
import PriceHistory from "./pages/carrier/PriceHistory";
import LogisticsTriggers from "./pages/logistics/LogisticsTriggers";
import LogisticsServices from "./pages/logistics/LogisticsServices";
import ChannelConfigs from "./pages/logistics/ChannelConfigs";
import TruckCarrierManagement from "./pages/truck/TruckCarrierManagement";
import TruckCarrierPricing from "./pages/truck/TruckCarrierPricing";
import PlatformWarehousePricing from "./pages/truck/PlatformWarehousePricing";
import PlatformWarehousePricingDetail from "./pages/truck/PlatformWarehousePricingDetail";
import ZipRegionMapping from "./pages/truck/ZipRegionMapping";
import PricingTemplateEdit from "./pages/carrier/PricingTemplateEdit";
import CustomerPricingEdit from "./pages/carrier/CustomerPricingEdit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="orders/truck" element={<TruckOrders />} />
            <Route path="orders/express" element={<ExpressOrders />} />
            <Route path="orders/express/new" element={<CreateExpressOrderPage />} />
            <Route path="orders/return" element={<ReturnOrders />} />
            <Route path="orders/return/new" element={<CreateReturnOrderPage />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/quote" element={<QuoteResults />} />
            <Route path="orders/confirm" element={<OrderDetails />} />
            <Route path="orders/order-confirm" element={<OrderConfirmation />} />
            <Route path="orders/:id" element={<OrderDetailView />} />
            <Route path="finance" element={<Finance />} />
            <Route path="finance/quotations" element={<FinanceQuotations />} />
            <Route path="finance/transactions" element={<TransactionRecords />} />
            <Route path="finance/rebills" element={<RebillManagement />} />
            <Route path="finance/freight-difference" element={<FreightDifference />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="emails" element={<EmailManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="carrier/accounts" element={<CarrierAccounts />} />
            <Route path="carrier/templates" element={<PricingTemplates />} />
            <Route path="carrier/templates/new" element={<PricingTemplateEdit />} />
            <Route path="carrier/templates/:id" element={<PricingTemplateEdit />} />
            <Route path="carrier/costs" element={<AccountCosts />} />
            <Route path="carrier/costs/:accountId/new" element={<AccountCostEdit />} />
            <Route path="carrier/costs/:accountId/:costId" element={<AccountCostEdit />} />
            <Route path="carrier/comparison" element={<PriceComparison />} />
            <Route path="carrier/remote-areas" element={<RemoteAreas />} />
            <Route path="carrier/rules" element={<ShippingRules />} />
            <Route path="carrier/customer-pricing" element={<CustomerPricing />} />
            <Route path="carrier/customer-pricing/new" element={<CustomerPricingEdit />} />
            <Route path="carrier/customer-pricing/:id" element={<CustomerPricingEdit />} />
            <Route path="carrier/price-history" element={<PriceHistory />} />
            <Route path="logistics/triggers" element={<LogisticsTriggers />} />
            <Route path="logistics/services" element={<LogisticsServices />} />
            <Route path="logistics/remote-areas" element={<RemoteAreas />} />
            <Route path="logistics/channels" element={<ChannelConfigs />} />
            <Route path="truck/carriers" element={<TruckCarrierManagement />} />
            <Route path="truck/pricing/:carrierId" element={<TruckCarrierPricing />} />
            <Route path="truck/platform-warehouse" element={<PlatformWarehousePricing />} />
            <Route path="truck/platform-warehouse/:pricingName" element={<PlatformWarehousePricingDetail />} />
            <Route path="truck/zip-region" element={<ZipRegionMapping />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
