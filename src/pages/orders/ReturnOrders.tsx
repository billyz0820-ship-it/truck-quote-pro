import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditReturnOrderForm } from "@/components/express/EditReturnOrderForm";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReturnOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_code: string;
  return_person: string;
  carrier: string;
  service_type: string;
  order_source: string | null;
  warehouse: string;
  zip_code: string;
  state: string;
  city: string;
  address: string;
  zone: string | null;
  shipping_fee: number;
  address_type: string | null;
  status: string;
  created_at: string;
}

export default function ReturnOrders() {
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending_label");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("order_number");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("return_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "获取退货订单失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_label: { label: "待打单", variant: "outline" },
      labeled: { label: "已打单", variant: "default" },
      in_transit: { label: "在途", variant: "secondary" },
      delivered: { label: "已送达", variant: "default" },
      cancelled: { label: "取消", variant: "destructive" },
    };
    const status_info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const getOrderStatusCounts = () => {
    return {
      pending_label: orders.filter(o => o.status === "pending_label").length,
      labeled: orders.filter(o => o.status === "labeled").length,
      in_transit: orders.filter(o => o.status === "in_transit").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      all: orders.length,
    };
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => {
        const value = order[searchType as keyof ReturnOrder];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [orders, activeTab, searchTerm, searchType]);

  const handleEdit = (orderId: string) => {
    setEditingOrderId(orderId);
    setIsEditDialogOpen(true);
  };

  const counts = getOrderStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">退货订单管理</h1>
          <p className="text-muted-foreground">管理所有退货订单</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_number">订单号</SelectItem>
            <SelectItem value="customer_code">客户编码</SelectItem>
            <SelectItem value="return_person">退货人</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending_label">待打单 ({counts.pending_label})</TabsTrigger>
          <TabsTrigger value="labeled">已打单 ({counts.labeled})</TabsTrigger>
          <TabsTrigger value="in_transit">在途 ({counts.in_transit})</TabsTrigger>
          <TabsTrigger value="delivered">已送达 ({counts.delivered})</TabsTrigger>
          <TabsTrigger value="cancelled">取消 ({counts.cancelled})</TabsTrigger>
          <TabsTrigger value="all">全部 ({counts.all})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>退货人</TableHead>
                  <TableHead>物流商</TableHead>
                  <TableHead>物流服务</TableHead>
                  <TableHead>收货仓库</TableHead>
                  <TableHead>邮编</TableHead>
                  <TableHead>州</TableHead>
                  <TableHead>城市</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>分区</TableHead>
                  <TableHead>运费</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8">加载中...</TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">暂无退货订单</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.customer_code}</TableCell>
                      <TableCell>{order.return_person}</TableCell>
                      <TableCell>{order.carrier}</TableCell>
                      <TableCell>{order.service_type}</TableCell>
                      <TableCell>{order.warehouse}</TableCell>
                      <TableCell>{order.zip_code}</TableCell>
                      <TableCell>{order.state}</TableCell>
                      <TableCell>{order.city}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.address}</TableCell>
                      <TableCell>{order.zone || "-"}</TableCell>
                      <TableCell>${order.shipping_fee}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleString("zh-CN")}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(order.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>编辑</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑退货订单</DialogTitle>
          </DialogHeader>
          {editingOrderId && (
            <EditReturnOrderForm
              orderId={editingOrderId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingOrderId(null);
                fetchOrders();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingOrderId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
