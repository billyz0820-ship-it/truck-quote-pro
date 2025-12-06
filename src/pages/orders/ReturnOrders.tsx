import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Search, Printer, Trash2, FileDown, Undo2, Plus, CornerUpLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditReturnOrderForm } from "@/components/express/EditReturnOrderForm";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { ExpressOrderFilters, FilterValues } from "@/components/express/ExpressOrderFilters";
import { PrintLabelDialog } from "@/components/express/PrintLabelDialog";
import { LabelExportDialog } from "@/components/express/LabelExportDialog";
import { useTab } from "@/contexts/TabContext";

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
  updated_at: string;
}

export default function ReturnOrders() {
  const { openTab } = useTab();
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending_label");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("order_number");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    startDate: undefined,
    endDate: undefined,
    customerCode: "",
    carrier: "",
  });
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<string | null>(null);
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

    // 状态筛选
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // 时间范围筛选
    if (filters.startDate) {
      filtered = filtered.filter(order => new Date(order.created_at) >= filters.startDate!);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= endDate);
    }

    // 客户筛选
    if (filters.customerCode) {
      filtered = filtered.filter(order => 
        order.customer_code.toLowerCase().includes(filters.customerCode.toLowerCase())
      );
    }

    // 物流商筛选
    if (filters.carrier && filters.carrier !== "all") {
      filtered = filtered.filter(order => order.carrier === filters.carrier);
    }

    // 搜索筛选
    if (searchTerm) {
      const terms = searchTerm.split(/[,，\n]/).map(t => t.trim()).filter(Boolean);
      filtered = filtered.filter(order => {
        return terms.some(term => {
          const value = order[searchType as keyof ReturnOrder];
          return value && value.toString().toLowerCase().includes(term.toLowerCase());
        });
      });
    }

    return filtered;
  }, [orders, activeTab, searchTerm, searchType, filters]);

  const handleEdit = (orderId: string) => {
    setEditingOrderId(orderId);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此退货订单？")) return;
    
    try {
      const { error } = await supabase
        .from("return_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "退货订单已删除",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRevert = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("return_orders")
        .update({ status: "pending_label" })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "撤回成功",
        description: "订单已撤回到待打单状态",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "撤回失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      customerCode: "",
      carrier: "",
    });
  };

  const handlePrintLabel = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("return_orders")
        .update({ 
          status: "labeled",
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "打单成功",
        description: "退货订单面单已打印",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "打单失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const counts = getOrderStatusCounts();

  const renderActions = (order: ReturnOrder) => {
    switch (order.status) {
      case "pending_label":
        return (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => handleEdit(order.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>编辑</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => handlePrintLabel(order.id)}>
                  <Printer className="h-4 w-4 mr-1" />
                  打单
                </Button>
              </TooltipTrigger>
              <TooltipContent>打印标签</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(order.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除</TooltipContent>
            </Tooltip>
          </div>
        );
      case "labeled":
      case "in_transit":
      case "delivered":
        return (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => {
                  setSelectedOrders([order.id]);
                  setExportDialogOpen(true);
                }}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>导出面单</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => handleRevert(order.id)}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>撤回</TooltipContent>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">退货订单管理</h1>
          <p className="text-muted-foreground">管理所有退货订单</p>
        </div>
        <div className="flex gap-2">
          {(activeTab === "labeled" || activeTab === "in_transit" || activeTab === "delivered") && selectedOrders.length > 0 && (
            <Button onClick={() => setExportDialogOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              批量导出面单 ({selectedOrders.length})
            </Button>
          )}
          <Button onClick={() => openTab({
            title: "新增退货订单",
            path: "/dashboard/orders/return/new",
            icon: CornerUpLeft,
          })}>
            <Plus className="h-4 w-4 mr-2" />
            新增退货订单
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex gap-2 flex-1">
          <ExpressOrderFilters 
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
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
          <Textarea
            placeholder="输入搜索内容，支持批量搜索（用逗号或换行分隔）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-h-[80px]"
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
                  {activeTab !== "cancelled" && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
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
                    <TableCell colSpan={17} className="text-center py-8">加载中...</TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">暂无退货订单</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      {activeTab !== "cancelled" && (
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                          />
                        </TableCell>
                      )}
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
                      <TableCell>{renderActions(order)}</TableCell>
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


      <LabelExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        orderIds={selectedOrders}
        orderType="return"
      />
    </div>
  );
}
