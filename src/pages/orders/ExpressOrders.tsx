import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Copy, Printer, Undo2, FileDown, Search, Download, Upload, Eye, Package, Home, Building, Mailbox, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CreateExpressOrderForm } from "@/components/express/CreateExpressOrderForm";
import { ExpressOrderFilters, FilterValues } from "@/components/express/ExpressOrderFilters";
import { ExpressOrderImport } from "@/components/express/ExpressOrderImport";
import { ExpressOrderExport } from "@/components/express/ExpressOrderExport";
import { EditReturnOrderForm } from "@/components/express/EditReturnOrderForm";
import { PrintLabelDialog } from "@/components/express/PrintLabelDialog";
import { LabelExportDialog } from "@/components/express/LabelExportDialog";
import { useTab } from "@/contexts/TabContext";

interface ExpressOrder {
  id: string;
  customerId: string;
  customerName: string;
  orderSourceType: number;
  orderSourceTypeName: string;
  wareHouseName: string;
  orderNo: string;
  productQty: number;
  trackingNumber: string;
  logisticsidService: string;
  recipient: string;
  recipientAddress1: string;
  recipientCountry: string;
  recipientCityName: string;
  recipientStateorProvince: string;
  recipientPostalCode: string;
  productNo: string | null;
  billingTime: string | null;
  zone: string | null;
  orderStatus: number;
  addressType: number;
  validateAddressStatus: number;
  createdTime: string;
  platFormId: string | null;
  carrier: number;
  carrierStr: string;
  recipientZone: string | null;
  isReturn: boolean;
  serviceCode: string;
  logisticsidPrintId: string;
  recordNo: string;
  account: string | null;
  billNoPrint: string | null;
  trackingNumberList: (string | null)[];
  uspsTrackingNumberList: (string | null)[];
  orderType: number;
  orderTypeStr: string;
  pod: string | null;
  isPickup: boolean | null;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  pickupCode: string | null;
  pickupStatus: string | null;
  remark: string | null;
  freightDetail: string | null;
  customsInvoiceNo: string | null;
  customsAmount: number | null;
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
  const { openTab } = useTab();
  const [orders, setOrders] = useState<ExpressOrder[]>([]);
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("order_number");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isEditReturnDialogOpen, setIsEditReturnDialogOpen] = useState(false);
  const [editingReturnOrderId, setEditingReturnOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    startDate: undefined,
    endDate: undefined,
    customerCode: "",
    customerName: "",
    recipient: "",
    carrier: "",
  });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { toast } = useToast();

  // 地址类型图标映射
  const getAddressIcon = (addressType: number) => {
    switch (addressType) {
      case 1: // MIXED 混合
        return <MapPin className="h-4 w-4 text-purple-500" />;
      case 2: // UNKNOWN 未知
        return <MapPin className="h-4 w-4 text-gray-500" />;
      case 3: // BUSINESS 商业
        return <Building className="h-4 w-4 text-green-500" />;
      case 4: // RESIDENTIAL 住宅
        return <Home className="h-4 w-4 text-blue-500" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  // 地址类型文本映射
  const getAddressTypeText = (addressType: number) => {
    switch (addressType) {
      case 1:
        return "混合";
      case 2:
        return "未知";
      case 3:
        return "商业";
      case 4:
        return "住宅";
      default:
        return "未知";
    }
  };

  useEffect(() => {
    fetchOrders();
    if (activeTab === "return") {
      fetchReturnOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 构建查询参数
      const queryParams: any = {
        pageIndex: 1,
        pageSize: 1000, // 获取足够多的数据
        sortField: "createdTime",
        sortValue: false, // 倒序，最新的在前面
      };

      // 根据当前选中的tab添加订单状态过滤
      if (activeTab !== "all" && activeTab !== "return") {
        const statusMap: Record<string, number> = {
          pending_label: 10,
          labeled: 20,
          in_transit: 30,
          delivered: 40,
          cancelled: 50,
        };
        const targetStatus = statusMap[activeTab];
        if (targetStatus) {
          queryParams.orderStatus = targetStatus;
        }
      }

      // 添加时间范围过滤
      if (filters.startDate) {
        queryParams.startCreateTime = new Date(filters.startDate).toLocaleString("zh-CN", { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          hour12: false 
        }).replace(/\//g, '-');
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        queryParams.endCreateTime = endDate.toLocaleString("zh-CN", { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit', 
          hour12: false 
        }).replace(/\//g, '-');
      }

      // 添加客户编码过滤
      if (filters.customerCode) {
        queryParams.customerId = filters.customerCode;
      }

      // 添加客户名称过滤
      if (filters.customerName) {
        queryParams.customerId = filters.customerName;
      }

      // 添加收件人过滤
      if (filters.recipient) {
        queryParams.recipient = filters.recipient;
      }

      // 添加物流商过滤
      if (filters.carrier && filters.carrier !== "all") {
        const carrierMap: Record<string, number> = {
          "FedEx": 1,
          "UPS": 2,
          "USPS": 3,
          "DHL": 4,
          // 根据实际枚举值调整
        };
        if (carrierMap[filters.carrier]) {
          queryParams.carrier = carrierMap[filters.carrier];
        }
      }

      // 添加搜索条件 - 支持数组装入
      if (searchTerm) {
        const terms = searchTerm.split(/[,，\n]/).map(t => t.trim()).filter(Boolean);
        if (terms.length > 0) {
          switch (searchType) {
            case "order_number":
              queryParams.orderNo = terms; // 直接传入数组
              break;
            case "tracking_number":
              queryParams.trackingNumber = terms; // 直接传入数组
              break;
          }
        }
      }

      const result = await api.post('/api/v1/Order/GetList', queryParams);
      setOrders(result.items || []);
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

  const getStatusBadge = (orderStatus: number) => {
    const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      10: { label: "待打单", variant: "outline" },
      20: { label: "已打单", variant: "default" },
      30: { label: "运输中", variant: "secondary" },
      40: { label: "已送达", variant: "default" },
      50: { label: "已取消", variant: "destructive" },
    };
    const status_info = statusMap[orderStatus] || { label: `状态${orderStatus}`, variant: "outline" };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const getOrderStatusCounts = () => {
    return {
      all: orders.length,
      pending_label: orders.filter(o => o.orderStatus === 10).length,
      labeled: orders.filter(o => o.orderStatus === 20).length,
      in_transit: orders.filter(o => o.orderStatus === 30).length,
      delivered: orders.filter(o => o.orderStatus === 40).length,
      cancelled: orders.filter(o => o.orderStatus === 50).length,
      return: returnOrders.length,
    };
  };

  const filteredOrders = useMemo(() => {
    // 由于过滤现在在服务端进行，这里直接返回orders
    return orders;
  }, [orders]);

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
          status: "pending",
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

  const handleEditReturnOrder = (orderId: string) => {
    setEditingReturnOrderId(orderId);
    setIsEditReturnDialogOpen(true);
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

  const handleBatchPrint = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "请选择订单",
        description: "请先选择要打印的订单",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "批量打印",
      description: `正在为 ${selectedOrders.length} 个订单打印标签...`,
    });
    
    // 这里可以实现实际的批量打印逻辑
    setSelectedOrders([]);
  };

  const handleBatchExport = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "请选择订单",
        description: "请先选择要导出的订单",
        variant: "destructive",
      });
      return;
    }

    // 触发导出功能
    toast({
      title: "正在导出",
      description: `正在导出 ${selectedOrders.length} 个订单...`,
    });
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
          status: "pending",
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
      customerName: "",
      recipient: "",
      carrier: "",
    });
    // 重置后自动查询
    fetchOrders();
  };

  const handleApplyFilters = () => {
    // 应用筛选时查询
    fetchOrders();
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchOrders();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    // 清空搜索后自动查询
    fetchOrders();
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
      "分区", "创建时间", "备注", "操作"
    ];

    const statusSpecificHeaders: Record<string, string[]> = {
      pending_label: ["记录号"],
      labeled: ["追踪号", "记录号", "物流账号"],
      in_transit: ["追踪号", "记录号", "物流账号", "物流状态"],
      delivered: ["追踪号", "记录号", "物流账号"],
      cancelled: ["追踪号", "记录号", "物流账号"],
    };

    let headers = [...baseHeaders];
    if (activeTab !== "all" && statusSpecificHeaders[activeTab]) {
      headers.splice(3, 0, ...statusSpecificHeaders[activeTab]);
    }

    return headers;
  };

  const renderTableRow = (order: ExpressOrder) => {
    const baseCells = [
      order.orderNo,
      order.customerName,
      order.wareHouseName,
      order.carrierStr,
      order.logisticsidService,
      order.orderSourceTypeName,
      order.recipient,
      order.recipientPostalCode,
      order.recipientStateorProvince,
      order.recipientCityName,
      <div className="flex items-center gap-2">
        {getAddressIcon(order.addressType)}
        <span className="max-w-xs truncate">{order.recipientAddress1}</span>
      </div>,
      order.recipientZone || "-",
      new Date(order.createdTime).toLocaleString("zh-CN", { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      }).replace(/\//g, '-'),
      order.remark || "-",
    ];

    const statusSpecificCells: Record<string, (string | null)[]> = {
      pending_label: [order.recordNo],
      labeled: [
        order.trackingNumber || "-",
        order.recordNo,
        order.account || "-",
      ],
      in_transit: [
        order.trackingNumber || "-",
        order.recordNo,
        order.account || "-",
        "运输中", // 可以从接口获取具体的物流状态
      ],
      delivered: [
        order.trackingNumber || "-",
        order.recordNo,
        order.account || "-",
      ],
      cancelled: [
        order.trackingNumber || "-",
        order.recordNo,
        order.account || "-",
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedOrderForPrint(order.id);
                    setPrintDialogOpen(true);
                  }}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  打单
                </Button>
              </TooltipTrigger>
              <TooltipContent>打印标签</TooltipContent>
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
                <Button size="sm" variant="outline" onClick={() => handlePrintLabel(order)}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>打印标签</TooltipContent>
            </Tooltip>
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
          <h1 className="text-3xl font-bold">快递订单管理</h1>
          <p className="text-muted-foreground">管理所有快递订单</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => openTab({
            title: "新增快递订单",
            path: "/dashboard/orders/express/new",
            icon: Package,
          })}>
            <Plus className="h-4 w-4" />
            新增
          </Button>
          {activeTab === "pending_label" && selectedOrders.length > 0 && (
            <Button onClick={() => {
              setSelectedOrderIds(selectedOrders);
              setPrintDialogOpen(true);
            }}>
              <Printer className="h-4 w-4 mr-2" />
              批量打单 ({selectedOrders.length})
            </Button>
          )}
          {(activeTab === "labeled" || activeTab === "in_transit" || activeTab === "delivered") && selectedOrders.length > 0 && (
            <Button onClick={() => setExportDialogOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              批量导出面单 ({selectedOrders.length})
            </Button>
          )}
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
            onApply={handleApplyFilters}
          />
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_number">订单号</SelectItem>
              <SelectItem value="tracking_number">追踪号</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="输入搜索内容，支持批量搜索（用逗号或换行分隔）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
            {searchTerm.trim() && (
              <Button variant="outline" onClick={handleClearSearch}>
                清空
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pending_label">
            待打单 ({counts.pending_label})
          </TabsTrigger>
          <TabsTrigger value="labeled">
            已打单 ({counts.labeled})
          </TabsTrigger>
          <TabsTrigger value="in_transit">
            运输中 ({counts.in_transit})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            已送达 ({counts.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            已取消 ({counts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="all">
            全部 ({counts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="border rounded-lg overflow-auto shadow-sm">
            <div className="min-w-full">
              <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {activeTab !== "cancelled" && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  {renderTableHeaders().map((header, index) => (
                    <TableHead key={index} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={22} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={22} className="text-center py-8 text-muted-foreground">
                      暂无订单
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      {activeTab !== "cancelled" && (
                        <TableCell className="w-12">
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                          />
                        </TableCell>
                      )}
                      {renderTableRow(order).map((cell, index) => (
                        <TableCell key={index} className="whitespace-nowrap">
                          {cell}
                        </TableCell>
                      ))}
                      <TableCell className="w-32">{renderActions(order)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
      <Dialog open={isEditReturnDialogOpen} onOpenChange={setIsEditReturnDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑退货订单</DialogTitle>
          </DialogHeader>
          {editingReturnOrderId && (
            <EditReturnOrderForm
              orderId={editingReturnOrderId}
              onSuccess={() => {
                setIsEditReturnDialogOpen(false);
                setEditingReturnOrderId(null);
                fetchReturnOrders();
              }}
              onCancel={() => {
                setIsEditReturnDialogOpen(false);
                setEditingReturnOrderId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Print Dialog */}
      <PrintLabelDialog
        open={printDialogOpen && selectedOrderIds.length > 0 && !selectedOrderForPrint}
        onOpenChange={setPrintDialogOpen}
        orderIds={selectedOrderIds}
        onSuccess={() => {
          fetchOrders();
          setSelectedOrderIds([]);
          setSelectedOrders([]);
        }}
      />
      
      {/* Single Print Dialog */}
      <PrintLabelDialog
        open={printDialogOpen && selectedOrderForPrint !== null}
        onOpenChange={(open) => {
          setPrintDialogOpen(open);
          if (!open) setSelectedOrderForPrint(null);
        }}
        orderIds={selectedOrderForPrint ? [selectedOrderForPrint] : []}
        onSuccess={() => {
          fetchOrders();
          setSelectedOrderForPrint(null);
        }}
      />

      <LabelExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        orderIds={selectedOrders}
        orderType="express"
      />
    </div>
  );
}
