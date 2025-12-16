import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Download, Trash2, PlayCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PalletInfo {
  id: string;
  count: number;
  weight: number;
  dimensions: string;
  class: string;
}

interface Order {
  id: string;
  order_number: string;
  reference_number: string | null;
  pro_number: string | null;
  bol_number: string | null;
  bol_url: string | null;
  sku: string | null;
  pickup_zip: string;
  pickup_address: string | null;
  pickup_city: string | null;
  pickup_state: string | null;
  pickup_contact_name: string | null;
  delivery_zip: string;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_contact_name: string | null;
  cargo_description: string | null;
  status: string;
  quoted_amount: number;
  created_at: string;
  customer_code: string;
  pallet_count: number | null;
  pallet_info: PalletInfo[] | null;
  customers?: {
    company_name: string;
  } | null;
}

const TruckOrders = () => {
  const navigate = useNavigate();
  const { customerId, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quoted");

  useEffect(() => {
    if (customerId || userRole === 'admin') {
      fetchOrders();
    }
  }, [customerId, userRole]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select(`
        *,
        customers(company_name)
      `);
      
      if (userRole !== 'admin' && customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders((data || []).map(order => ({
        ...order,
        pallet_info: Array.isArray(order.pallet_info) ? order.pallet_info as unknown as PalletInfo[] : null
      })));
    } catch (error: any) {
      toast.error("加载订单失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatuses = () => {
    const allCount = orders.filter(o => o.status !== 'deleted').length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { value: "quoted", label: "已报价", count: statusCounts.quoted || 0 },
      { value: "pending_review", label: "待审核", count: statusCounts.pending_review || 0 },
      { value: "reviewed", label: "已审核", count: statusCounts.reviewed || 0 },
      { value: "picked-up", label: "已提货", count: statusCounts["picked-up"] || 0 },
      { value: "in-transit", label: "运输中", count: statusCounts["in-transit"] || 0 },
      { value: "delivered", label: "已送达", count: statusCounts.delivered || 0 },
      { value: "cancelled", label: "已取消", count: statusCounts.cancelled || 0 },
      { value: "all", label: "全部订单", count: allCount },
    ];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "quoted": { label: "已报价", className: "bg-blue-500" },
      "pending_review": { label: "待审核", className: "bg-purple-500" },
      "reviewed": { label: "已审核", className: "bg-indigo-500" },
      "picked-up": { label: "已提货", className: "bg-yellow-500" },
      "in-transit": { label: "运输中", className: "bg-orange-500" },
      "delivered": { label: "已送达", className: "bg-green-500" },
      "cancelled": { label: "已取消", className: "bg-gray-500" },
      "deleted": { label: "已删除", className: "bg-red-500" }
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all" && order.status === "deleted") return false;
    if (activeTab !== "all" && order.status !== activeTab) return false;
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    switch (searchType) {
      case "order": return order.order_number.toLowerCase().includes(term);
      case "reference": return order.reference_number?.toLowerCase().includes(term);
      case "pro": return order.pro_number?.toLowerCase().includes(term);
      case "bol": return order.bol_number?.toLowerCase().includes(term);
      case "sku": return order.sku?.toLowerCase().includes(term);
      case "pickup": return order.pickup_zip.includes(term);
      case "delivery": return order.delivery_zip.includes(term);
      case "customer": return order.customer_code?.toLowerCase().includes(term) || order.customers?.company_name?.toLowerCase().includes(term);
      default:
        return (
          order.order_number.toLowerCase().includes(term) ||
          order.reference_number?.toLowerCase().includes(term) ||
          order.pro_number?.toLowerCase().includes(term) ||
          order.bol_number?.toLowerCase().includes(term) ||
          order.sku?.toLowerCase().includes(term) ||
          order.pickup_zip.includes(term) ||
          order.delivery_zip.includes(term) ||
          order.customer_code?.toLowerCase().includes(term) ||
          order.customers?.company_name?.toLowerCase().includes(term)
        );
    }
  });

  const handleDelete = async (orderId: string) => {
    if (!confirm("确定要删除此报价吗？")) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'deleted' })
        .eq('id', orderId);
      if (error) throw error;
      toast.success("报价已删除");
      fetchOrders();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("确定要取消此订单吗？")) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) throw error;
      toast.success("订单已取消");
      fetchOrders();
    } catch (error: any) {
      toast.error("取消失败: " + error.message);
    }
  };

  const handleReview = async (orderId: string) => {
    if (!confirm("确定要审核通过此订单吗？")) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'reviewed' })
        .eq('id', orderId);
      if (error) throw error;
      toast.success("订单已审核通过");
      fetchOrders();
    } catch (error: any) {
      toast.error("审核失败: " + error.message);
    }
  };

  const getPalletSummary = (palletInfo: PalletInfo[] | null, palletCount: number | null) => {
    if (palletInfo && palletInfo.length > 0) {
      const totalPallets = palletInfo.reduce((sum, p) => sum + (p.count || 1), 0);
      const totalWeight = palletInfo.reduce((sum, p) => sum + ((p.weight || 0) * (p.count || 1)), 0);
      return (
        <div className="text-sm">
          <div>{totalPallets}托</div>
          <div className="text-xs text-muted-foreground">{totalWeight}磅</div>
        </div>
      );
    }
    if (palletCount) {
      return <span>{palletCount}托</span>;
    }
    return "-";
  };

  const isQuotedTab = activeTab === "quoted";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">卡车订单</h1>
          <p className="text-muted-foreground">查看和管理所有卡车运输订单</p>
        </div>
        <Button onClick={() => navigate("/dashboard/orders/create")}>
          <Plus className="h-4 w-4 mr-2" />
          创建订单
        </Button>
      </div>

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
                  <SelectItem value="customer">客户</SelectItem>
                  {!isQuotedTab && <SelectItem value="pro">PRO号</SelectItem>}
                  {!isQuotedTab && <SelectItem value="bol">BOL号</SelectItem>}
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
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单编号</TableHead>
                    {isQuotedTab && <TableHead>客户</TableHead>}
                    <TableHead>参考编号</TableHead>
                    <TableHead>发货人</TableHead>
                    <TableHead>发货地址</TableHead>
                    <TableHead>收货人</TableHead>
                    <TableHead>收货地址</TableHead>
                    {isQuotedTab && <TableHead>托盘信息</TableHead>}
                    {!isQuotedTab && <TableHead>货物</TableHead>}
                    {!isQuotedTab && <TableHead>PRO号</TableHead>}
                    {!isQuotedTab && <TableHead>BOL号</TableHead>}
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
                      {isQuotedTab && (
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{order.customer_code}</div>
                            <div className="text-xs text-muted-foreground">{order.customers?.company_name || '-'}</div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{order.reference_number || "-"}</TableCell>
                      <TableCell>{order.pickup_contact_name || "-"}</TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <div className="truncate">{order.pickup_address || order.pickup_zip}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.pickup_city && order.pickup_state ? `${order.pickup_city}, ${order.pickup_state}` : order.pickup_zip}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.delivery_contact_name || "-"}</TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <div className="truncate">{order.delivery_address || order.delivery_zip}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.delivery_city && order.delivery_state ? `${order.delivery_city}, ${order.delivery_state}` : order.delivery_zip}
                          </div>
                        </div>
                      </TableCell>
                      {isQuotedTab && (
                        <TableCell>{getPalletSummary(order.pallet_info, order.pallet_count)}</TableCell>
                      )}
                      {!isQuotedTab && <TableCell>{order.cargo_description || "-"}</TableCell>}
                      {!isQuotedTab && <TableCell>{order.pro_number || "-"}</TableCell>}
                      {!isQuotedTab && <TableCell>{order.bol_number || "-"}</TableCell>}
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">${order.quoted_amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('zh-CN')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看详情</TooltipContent>
                          </Tooltip>
                          {order.status === "quoted" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // 继续下单 - 恢复订单数据并跳转到报价页面
                                      const orderData = {
                                        customerId: order.customer_code ? undefined : order.id, // Will be fetched
                                        customerCode: order.customer_code,
                                        shipmentType: 'LTL',
                                        pickupZip: order.pickup_zip,
                                        pickupCity: order.pickup_city,
                                        pickupState: order.pickup_state,
                                        deliveryZip: order.delivery_zip,
                                        deliveryCity: order.delivery_city,
                                        deliveryState: order.delivery_state,
                                        cargoDescription: order.cargo_description,
                                        referenceNumber: order.reference_number,
                                        pallets: order.pallet_info || [],
                                      };
                                      navigate("/dashboard/orders/quote", { 
                                        state: { orderData, savedOrderId: order.id } 
                                      });
                                    }}
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>继续下单</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(order.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>删除</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {order.status === "pending_review" && (
                            <>
                              {order.bol_url && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(order.bol_url!, '_blank')}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>下载BOL</TooltipContent>
                                </Tooltip>
                              )}
                              {userRole === 'admin' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleReview(order.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      审核
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>审核通过</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancel(order.id)}
                                  >
                                    取消
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>取消订单</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {filteredOrders.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={isQuotedTab ? 14 : 13} className="text-center py-8 text-muted-foreground">
                        暂无订单
                      </td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default TruckOrders;