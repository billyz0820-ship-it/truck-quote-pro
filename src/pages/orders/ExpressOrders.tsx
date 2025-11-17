import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Copy, Printer, Undo2, CornerUpLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CreateExpressOrderForm } from "@/components/express/CreateExpressOrderForm";
import { ExpressOrderFilters, FilterValues } from "@/components/express/ExpressOrderFilters";
import { ExpressOrderImport } from "@/components/express/ExpressOrderImport";
import { ExpressOrderExport } from "@/components/express/ExpressOrderExport";

interface ExpressOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_code: string;
  warehouse: string;
  carrier: string;
  service_type: string;
  signature_service: string | null;
  reference_number: string | null;
  tracking_number: string | null;
  logistics_account: string | null;
  order_source: string | null;
  country: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  zip_code: string;
  state: string;
  city: string;
  address: string;
  address_type: string | null;
  shipping_fee: number;
  zone: string | null;
  status: string;
  logistics_status: string | null;
  notes: string | null;
  created_at: string;
  label_printed_at: string | null;
  cancelled_at: string | null;
}

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

export default function ExpressOrders() {
  const [orders, setOrders] = useState<ExpressOrder[]>([]);
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("order_number");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    startDate: undefined,
    endDate: undefined,
    customerCode: "",
    carrier: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    if (activeTab === "return") {
      fetchReturnOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("express_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "获取订单失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("return_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReturnOrders(data || []);
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
      all: orders.length,
      pending_label: orders.filter(o => o.status === "pending_label").length,
      labeled: orders.filter(o => o.status === "labeled").length,
      in_transit: orders.filter(o => o.status === "in_transit").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      return: returnOrders.length,
    };
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // 状态筛选
    if (activeTab !== "all" && activeTab !== "return") {
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
          const value = order[searchType as keyof ExpressOrder];
          return value && value.toString().toLowerCase().includes(term.toLowerCase());
        });
      });
    }

    return filtered;
  }, [orders, activeTab, searchTerm, searchType, filters]);

  const filteredReturnOrders = useMemo(() => {
    let filtered = returnOrders;

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
  }, [returnOrders, searchTerm, searchType, filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此订单？")) return;
    
    try {
      const { error } = await supabase
        .from("express_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "订单已删除",
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

  const handleCopy = async (order: ExpressOrder) => {
    try {
      const { error } = await supabase
        .from("express_orders")
        .insert({
          order_number: `${order.order_number}-COPY-${Date.now()}`,
          customer_id: order.customer_id,
          customer_code: order.customer_code,
          warehouse: order.warehouse,
          carrier: order.carrier,
          service_type: order.service_type,
          signature_service: order.signature_service,
          reference_number: order.reference_number,
          order_source: order.order_source,
          country: order.country,
          recipient_name: order.recipient_name,
          recipient_phone: order.recipient_phone,
          recipient_email: order.recipient_email,
          zip_code: order.zip_code,
          state: order.state,
          city: order.city,
          address: order.address,
          address_type: order.address_type,
          shipping_fee: order.shipping_fee,
          zone: order.zone,
          notes: order.notes,
          status: "pending_label",
        });

      if (error) throw error;

      toast({
        title: "复制成功",
        description: "订单已复制为待打单状态",
      });
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "复制失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (orderId: string) => {
    setEditingOrderId(orderId);
    setIsEditDialogOpen(true);
  };

  const handlePrintLabel = async (order: ExpressOrder) => {
    toast({
      title: "打印标签",
      description: `正在为订单 ${order.order_number} 打印标签...`,
    });
  };

  const handleRevert = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("express_orders")
        .update({ 
          status: "pending_label",
          label_printed_at: null,
          tracking_number: null,
        })
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

  const handleConvertToReturn = async (order: ExpressOrder) => {
    try {
      const { error } = await supabase.from("return_orders").insert({
        order_number: `RET-${order.order_number}`,
        customer_id: order.customer_id,
        customer_code: order.customer_code,
        return_person: order.recipient_name,
        carrier: order.carrier,
        service_type: order.service_type,
        order_source: order.order_source,
        warehouse: order.warehouse,
        zip_code: order.zip_code,
        state: order.state,
        city: order.city,
        address: order.address,
        zone: order.zone,
        shipping_fee: order.shipping_fee,
        address_type: order.address_type,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "转退货成功",
        description: "已创建退货订单",
      });
      fetchReturnOrders();
    } catch (error: any) {
      toast({
        title: "转退货失败",
        description: error.message,
        variant: "destructive",
      });
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

  const counts = getOrderStatusCounts();

  const renderTableHeaders = () => {
    if (activeTab === "return") {
      return [
        "订单号", "客户", "退货人", "物流商", "物流服务", "订单来源",
        "收货仓库", "邮编", "州", "城市", "地址", "分区", "运费",
        "地址属性", "创建时间", "操作"
      ];
    }

    const baseHeaders = [
      "订单号", "客户", "发货仓库", "物流商", "物流服务", 
      "订单来源", "收件人", "邮编", "州", "城市", "地址", 
      "分区", "运费", "地址属性", "创建时间", "备注", "操作"
    ];

    const statusSpecificHeaders: Record<string, string[]> = {
      pending_label: ["记录号"],
      labeled: ["追踪号", "记录号", "物流账号", "打单时间"],
      in_transit: ["追踪号", "记录号", "物流账号", "物流状态", "打单时间"],
      delivered: ["追踪号", "记录号", "物流账号", "打单时间"],
      cancelled: ["追踪号", "记录号", "物流账号", "取消时间"],
    };

    let headers = [...baseHeaders];
    if (activeTab !== "all" && statusSpecificHeaders[activeTab]) {
      headers.splice(3, 0, ...statusSpecificHeaders[activeTab]);
    }

    return headers;
  };

  const renderTableRow = (order: ExpressOrder) => {
    const baseCells = [
      order.order_number,
      order.customer_code,
      order.warehouse,
      order.carrier,
      order.service_type,
      order.order_source || "-",
      order.recipient_name,
      order.zip_code,
      order.state,
      order.city,
      order.address,
      order.zone || "-",
      `$${order.shipping_fee}`,
      order.address_type || "-",
      new Date(order.created_at).toLocaleString("zh-CN"),
      order.notes || "-",
    ];

    const statusSpecificCells: Record<string, (string | null)[]> = {
      pending_label: [order.reference_number || "-"],
      labeled: [
        order.tracking_number || "-",
        order.reference_number || "-",
        order.logistics_account || "-",
        order.label_printed_at ? new Date(order.label_printed_at).toLocaleString("zh-CN") : "-",
      ],
      in_transit: [
        order.tracking_number || "-",
        order.reference_number || "-",
        order.logistics_account || "-",
        order.logistics_status || "-",
        order.label_printed_at ? new Date(order.label_printed_at).toLocaleString("zh-CN") : "-",
      ],
      delivered: [
        order.tracking_number || "-",
        order.reference_number || "-",
        order.logistics_account || "-",
        order.label_printed_at ? new Date(order.label_printed_at).toLocaleString("zh-CN") : "-",
      ],
      cancelled: [
        order.tracking_number || "-",
        order.reference_number || "-",
        order.logistics_account || "-",
        order.cancelled_at ? new Date(order.cancelled_at).toLocaleString("zh-CN") : "-",
      ],
    };

    let cells = [...baseCells];
    if (activeTab !== "all" && statusSpecificCells[activeTab]) {
      cells.splice(3, 0, ...statusSpecificCells[activeTab]);
    }

    return cells;
  };

  const renderActions = (order: ExpressOrder) => {
    switch (activeTab) {
      case "pending_label":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(order.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(order.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      case "labeled":
      case "in_transit":
      case "delivered":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handlePrintLabel(order)}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRevert(order.id)}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleConvertToReturn(order)}>
              <CornerUpLeft className="h-4 w-4" />
            </Button>
          </div>
        );
      case "cancelled":
        return (
          <Button size="sm" variant="outline" onClick={() => handleCopy(order)}>
            <Copy className="h-4 w-4 mr-1" />
            复制
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">快递订单管理</h1>
          <p className="text-muted-foreground">管理所有快递订单</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            新增
          </Button>
          <ExpressOrderImport onSuccess={fetchOrders} />
          <ExpressOrderExport orders={activeTab === "return" ? filteredReturnOrders : filteredOrders} />
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
              <SelectItem value="tracking_number">物流单号</SelectItem>
              <SelectItem value="recipient_name">收件人</SelectItem>
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">
            全部 ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending_label">
            待打单 ({counts.pending_label})
          </TabsTrigger>
          <TabsTrigger value="labeled">
            已打单 ({counts.labeled})
          </TabsTrigger>
          <TabsTrigger value="in_transit">
            在途 ({counts.in_transit})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            已送达 ({counts.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            取消 ({counts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="return">
            退货订单 ({counts.return})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {activeTab === "return" ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderTableHeaders().map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredReturnOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                        暂无退货订单
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturnOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.customer_code}</TableCell>
                        <TableCell>{order.return_person}</TableCell>
                        <TableCell>{order.carrier}</TableCell>
                        <TableCell>{order.service_type}</TableCell>
                        <TableCell>{order.order_source || "-"}</TableCell>
                        <TableCell>{order.warehouse}</TableCell>
                        <TableCell>{order.zip_code}</TableCell>
                        <TableCell>{order.state}</TableCell>
                        <TableCell>{order.city}</TableCell>
                        <TableCell>{order.address}</TableCell>
                        <TableCell>{order.zone || "-"}</TableCell>
                        <TableCell>${order.shipping_fee}</TableCell>
                        <TableCell>{order.address_type || "-"}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleString("zh-CN")}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">查看</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderTableHeaders().map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={20} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={20} className="text-center py-8 text-muted-foreground">
                        暂无订单
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        {renderTableRow(order).map((cell, index) => (
                          <TableCell key={index}>{cell}</TableCell>
                        ))}
                        <TableCell>{renderActions(order)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>新增快递订单</DialogTitle>
          </DialogHeader>
          <CreateExpressOrderForm
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchOrders();
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>编辑快递订单</DialogTitle>
          </DialogHeader>
          <CreateExpressOrderForm
            orderId={editingOrderId || undefined}
            mode="edit"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
