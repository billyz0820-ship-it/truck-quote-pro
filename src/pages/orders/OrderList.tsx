import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  reference_number: string | null;
  pro_number: string | null;
  bol_number: string | null;
  sku: string | null;
  pickup_zip: string;
  delivery_zip: string;
  cargo_description: string | null;
  status: string;
  quoted_amount: number;
  created_at: string;
}

const OrderList = () => {
  const navigate = useNavigate();
  const { customerId, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (customerId || userRole === 'admin') {
      fetchOrders();
    }
  }, [customerId, userRole]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select('*');
      
      // 如果是客户，只显示自己的订单
      if (userRole !== 'admin' && customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("加载订单失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatuses = () => {
    const allCount = orders.length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { value: "all", label: "全部订单", count: allCount },
      { value: "quoted", label: "已报价", count: statusCounts.quoted || 0 },
      { value: "confirmed", label: "已确认", count: statusCounts.confirmed || 0 },
      { value: "picked-up", label: "已提货", count: statusCounts["picked-up"] || 0 },
      { value: "in-transit", label: "运输中", count: statusCounts["in-transit"] || 0 },
      { value: "delivered", label: "已送达", count: statusCounts.delivered || 0 },
    ];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "quoted": { label: "已报价", className: "bg-blue-500" },
      "confirmed": { label: "已确认", className: "bg-purple-500" },
      "picked-up": { label: "已提货", className: "bg-yellow-500" },
      "in-transit": { label: "运输中", className: "bg-orange-500" },
      "delivered": { label: "已送达", className: "bg-green-500" }
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    // Filter by tab
    if (activeTab !== "all" && order.status !== activeTab) {
      return false;
    }

    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    switch (searchType) {
      case "order":
        return order.order_number.toLowerCase().includes(term);
      case "reference":
        return order.reference_number?.toLowerCase().includes(term);
      case "pro":
        return order.pro_number?.toLowerCase().includes(term);
      case "bol":
        return order.bol_number?.toLowerCase().includes(term);
      case "sku":
        return order.sku?.toLowerCase().includes(term);
      case "pickup":
        return order.pickup_zip.includes(term);
      case "delivery":
        return order.delivery_zip.includes(term);
      default:
        return (
          order.order_number.toLowerCase().includes(term) ||
          order.reference_number?.toLowerCase().includes(term) ||
          order.pro_number?.toLowerCase().includes(term) ||
          order.bol_number?.toLowerCase().includes(term) ||
          order.sku?.toLowerCase().includes(term) ||
          order.pickup_zip.includes(term) ||
          order.delivery_zip.includes(term)
        );
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">订单管理</h1>
          <p className="text-muted-foreground">查看和管理所有运输订单</p>
        </div>
        <Button onClick={() => navigate("/dashboard/orders/create")}>
          <Plus className="h-4 w-4 mr-2" />
          创建订单
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="搜索类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="order">订单编号</SelectItem>
                  <SelectItem value="reference">参考编号</SelectItem>
                  <SelectItem value="pro">PRO号</SelectItem>
                  <SelectItem value="bol">BOL号</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="pickup">起点邮编</SelectItem>
                  <SelectItem value="delivery">终点邮编</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 订单状态标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {getOrderStatuses().map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label} ({status.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>{getOrderStatuses().find(s => s.value === activeTab)?.label || "订单列表"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无订单</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单编号</TableHead>
                    <TableHead>参考编号</TableHead>
                    <TableHead>起点</TableHead>
                    <TableHead>终点</TableHead>
                    <TableHead>货物</TableHead>
                    <TableHead>PRO号</TableHead>
                    <TableHead>BOL号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.reference_number || "-"}</TableCell>
                      <TableCell>{order.pickup_zip}</TableCell>
                      <TableCell>{order.delivery_zip}</TableCell>
                      <TableCell>{order.cargo_description || "-"}</TableCell>
                      <TableCell>{order.pro_number || "-"}</TableCell>
                      <TableCell>{order.bol_number || "-"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">${order.quoted_amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('zh-CN')}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default OrderList;
