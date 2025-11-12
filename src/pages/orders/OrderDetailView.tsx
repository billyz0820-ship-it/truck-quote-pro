import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Package, Truck, FileText, Clock, Edit, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import { RouteMap } from "@/components/RouteMap";

interface Order {
  id: string;
  order_number: string;
  customer_code: string;
  reference_number: string | null;
  pro_number: string | null;
  bol_number: string | null;
  sku: string | null;
  pickup_zip: string;
  delivery_zip: string;
  cargo_description: string | null;
  carrier_name: string | null;
  status: string;
  quoted_amount: number;
  actual_cost: number | null;
  profit: number | null;
  bol_url: string | null;
  sbol_url: string | null;
  pallet_label_url: string | null;
  created_at: string;
  updated_at: string;
}

const OrderDetailView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userRole } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [updateForm, setUpdateForm] = useState({
    status: "",
    pro_number: "",
    bol_number: "",
    carrier_name: "",
    actual_cost: "",
  });

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setOrder(data);
      
      // 初始化更新表单
      setUpdateForm({
        status: data.status,
        pro_number: data.pro_number || "",
        bol_number: data.bol_number || "",
        carrier_name: data.carrier_name || "",
        actual_cost: data.actual_cost?.toString() || "",
      });
    } catch (error: any) {
      toast.error("加载订单详情失败: " + error.message);
      navigate("/dashboard/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      
      const updateData: any = {
        status: updateForm.status,
        carrier_name: updateForm.carrier_name || null,
        pro_number: updateForm.pro_number || null,
        bol_number: updateForm.bol_number || null,
      };

      // 只有管理员可以更新成本
      if (userRole === 'admin' && updateForm.actual_cost) {
        updateData.actual_cost = parseFloat(updateForm.actual_cost);
        updateData.profit = order.quoted_amount - parseFloat(updateForm.actual_cost);
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      toast.success("订单更新成功！");
      setUpdateDialogOpen(false);
      fetchOrder();
    } catch (error: any) {
      toast.error("更新订单失败: " + error.message);
    } finally {
      setUpdating(false);
    }
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

  const getStatusTimeline = (status: string) => {
    const allStatuses = ["quoted", "confirmed", "picked-up", "in-transit", "delivered"];
    const currentIndex = allStatuses.indexOf(status);
    
    const statusLabels: Record<string, string> = {
      "quoted": "已报价",
      "confirmed": "已确认",
      "picked-up": "已提货",
      "in-transit": "运输中",
      "delivered": "已送达"
    };

    return (
      <div className="flex items-center justify-between">
        {allStatuses.map((s, index) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentIndex 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <p className={`text-xs mt-2 ${index <= currentIndex ? "font-medium" : "text-muted-foreground"}`}>
                {statusLabels[s]}
              </p>
            </div>
            {index < allStatuses.length - 1 && (
              <div 
                className={`h-0.5 flex-1 ${
                  index < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">订单不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard/orders")}
            className="p-2 h-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">订单详情</h1>
            <p className="text-sm text-muted-foreground">{order.order_number}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Upload className="h-4 w-4 mr-2" />
                管理文件
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>订单文件管理</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FileUpload
                  orderId={order.id}
                  fileType="bol"
                  currentUrl={order.bol_url}
                  onUploadComplete={fetchOrder}
                  label="BOL文档"
                />
                <FileUpload
                  orderId={order.id}
                  fileType="sbol"
                  currentUrl={order.sbol_url}
                  onUploadComplete={fetchOrder}
                  label="SBOL文档"
                />
                <FileUpload
                  orderId={order.id}
                  fileType="pallet_label"
                  currentUrl={order.pallet_label_url}
                  onUploadComplete={fetchOrder}
                  label="托盘标签"
                />
              </div>
            </DialogContent>
          </Dialog>

          {userRole === 'admin' && (
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Edit className="h-4 w-4 mr-2" />
                  更新订单
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>更新订单信息</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">订单状态</Label>
                  <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quoted">已报价</SelectItem>
                      <SelectItem value="placed">已下单</SelectItem>
                      <SelectItem value="picked-up">已提货</SelectItem>
                      <SelectItem value="in-transit">运输中</SelectItem>
                      <SelectItem value="delivered">已送达</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-sm">承运商名称</Label>
                  <Input
                    value={updateForm.carrier_name}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, carrier_name: e.target.value }))}
                    placeholder="承运商名称"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">PRO号</Label>
                  <Input
                    value={updateForm.pro_number}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, pro_number: e.target.value }))}
                    placeholder="PRO号"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">BOL号</Label>
                  <Input
                    value={updateForm.bol_number}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, bol_number: e.target.value }))}
                    placeholder="BOL号"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">实际成本</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={updateForm.actual_cost}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, actual_cost: e.target.value }))}
                    placeholder="实际成本"
                    className="h-9"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} disabled={updating} size="sm" className="h-9">
                    取消
                  </Button>
                  <Button onClick={handleUpdateOrder} disabled={updating} size="sm" className="h-9">
                    {updating ? "更新中..." : "确认更新"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* 路线图 */}
      <RouteMap 
        pickupZip={order.pickup_zip}
        deliveryZip={order.delivery_zip}
      />

      {/* 物流追踪时间线 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            物流追踪
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusTimeline(order.status)}
        </CardContent>
      </Card>

      {/* 订单基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              订单信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单编号:</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">客户编码:</span>
              <span className="font-medium">{order.customer_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">参考编号:</span>
              <span className="font-medium">{order.reference_number || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU:</span>
              <span className="font-medium">{order.sku || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">状态:</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间:</span>
              <span className="font-medium">{new Date(order.created_at).toLocaleString('zh-CN')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              物流信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">承运商:</span>
              <span className="font-medium">{order.carrier_name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PRO号:</span>
              <span className="font-medium">{order.pro_number || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BOL号:</span>
              <span className="font-medium">{order.bol_number || "-"}</span>
            </div>
            {order.bol_url && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">BOL文件:</span>
                <a href={order.bol_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  查看文件
                </a>
              </div>
            )}
            {order.pallet_label_url && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">托盘标签:</span>
                <a href={order.pallet_label_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  查看标签
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 路线信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            路线信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">发货地址</h4>
              <p className="text-muted-foreground">邮编: {order.pickup_zip}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">收货地址</h4>
              <p className="text-muted-foreground">邮编: {order.delivery_zip}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 货物信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            货物信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">货物描述:</span>
              <span className="font-medium">{order.cargo_description || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 费用信息 */}
      <Card>
        <CardHeader>
          <CardTitle>费用信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">报价金额:</span>
              <span className="font-medium text-lg">${order.quoted_amount.toFixed(2)}</span>
            </div>
            {userRole === 'admin' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">实际成本:</span>
                  <span className="font-medium">${order.actual_cost?.toFixed(2) || "-"}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">利润:</span>
                  <span className={`font-medium text-lg ${(order.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${order.profit?.toFixed(2) || "-"}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetailView;
