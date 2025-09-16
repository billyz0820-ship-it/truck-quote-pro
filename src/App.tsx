import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import OrderList from "./pages/orders/OrderList";
import CreateOrder from "./pages/orders/CreateOrder";
import QuoteResults from "./pages/orders/QuoteResults";
import Finance from "./pages/finance/Finance";
import Settings from "./pages/settings/Settings";
import TicketManagement from "./pages/tickets/TicketManagement";
import ProductModule from "./pages/products/ProductModule";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/quote" element={<QuoteResults />} />
            <Route path="finance" element={<Finance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="products" element={<ProductModule />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
