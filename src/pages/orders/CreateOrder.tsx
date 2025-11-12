import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapPin, Package, Plus, Trash2, Copy, Calendar, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Pallet {
  id: string;
  count: number;
  weight: number;
  dimensions: string;
  class: string;
  itemCount: number;
  value: number;
  nmfc: string;
  nmfcSub: string;
}

const CreateOrder = () => {
  const navigate = useNavigate();
  const { customerId, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // 客户选择（仅管理员需要）
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  // 运输类型
  const [shipmentType, setShipmentType] = useState<"FTL" | "LTL">("LTL");
  
  const [formData, setFormData] = useState({
    pickupZip: "",
    deliveryZip: "",
    pickupDate: "",
    pickupTimeSlot: "",
    referenceNumber: "",
    cargoDescription: "",
  });
  
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: "1", count: 1, weight: 0, dimensions: "", class: "", itemCount: 0, value: 0, nmfc: "", nmfcSub: "" }
  ]);

  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  
  // 发货配套服务
  const [pickupServices, setPickupServices] = useState({
    doorPickup: false,
    liftgate: false,
  });

  // 收货配套服务
  const [deliveryServices, setDeliveryServices] = useState({
    deliveryAppointment: false,
    residential: false,
    notifyConsignee: false,
    limitedAccess: false,
    liftgate: false,
    hazmat: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPallet = () => {
    const newPallet: Pallet = {
      id: Date.now().toString(),
      count: 1,
      weight: 0,
      dimensions: "",
      class: "",
      itemCount: 0,
      value: 0,
      nmfc: "",
      nmfcSub: ""
    };
    setPallets(prev => [...prev, newPallet]);
  };

  const copyPallet = (pallet: Pallet) => {
    const newPallet: Pallet = {
      ...pallet,
      id: Date.now().toString(),
    };
    setPallets(prev => [...prev, newPallet]);
  };

  const removePallet = (id: string) => {
    setPallets(prev => prev.filter(pallet => pallet.id !== id));
  };

  const updatePallet = (id: string, field: keyof Pallet, value: string | number) => {
    setPallets(prev => prev.map(pallet => 
      pallet.id === id ? { ...pallet, [field]: value } : pallet
    ));
  };

  // 加载客户列表（仅管理员需要）
  useEffect(() => {
    if (userRole === "admin") {
      loadCustomers();
    }
  }, [userRole]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, customer_code, status')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      if (data) setCustomers(data);
    } catch (error: any) {
      console.error("加载客户列表失败:", error);
      toast.error("加载客户列表失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 确定使用的客户ID
    const orderCustomerId = userRole === "admin" ? selectedCustomerId : customerId;
    
    if (!orderCustomerId) {
      toast.error(userRole === "admin" ? "请选择客户" : "无法获取客户信息");
      return;
    }

    try {
      setLoading(true);

      // 生成订单编号
      const orderNumber = `ORD-${Date.now()}`;
      
      // 计算总重量和报价（简化版本）
      const totalWeight = pallets.reduce((sum, p) => sum + (p.weight * p.count), 0);
      const baseRate = 0.5; // 每磅0.5美元
      const quotedAmount = totalWeight * baseRate;

      // 获取客户编码
      const { data: customerData } = await supabase
        .from('customers')
        .select('customer_code')
        .eq('id', orderCustomerId)
        .single();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: orderCustomerId,
          customer_code: customerData?.customer_code || '',
          pickup_zip: formData.pickupZip,
          delivery_zip: formData.deliveryZip,
          reference_number: formData.referenceNumber || null,
          cargo_description: formData.cargoDescription || null,
          quoted_amount: quotedAmount,
          status: 'quoted',
          shipment_type: shipmentType,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("订单创建成功！");
      navigate("/dashboard/orders");
    } catch (error: any) {
      console.error("创建订单失败:", error);
      toast.error("创建订单失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const weightUnit = unit === "imperial" ? "磅" : "千克";
  const dimensionUnit = unit === "imperial" ? "英寸" : "厘米";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/orders")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">创建新订单</h1>
          <p className="text-muted-foreground">输入运输详情获取实时报价</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 客户选择（仅管理员可见） */}
        {userRole === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>选择客户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customer">客户</Label>
                <Select 
                  value={selectedCustomerId} 
                  onValueChange={setSelectedCustomerId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name} ({customer.customer_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 运输路线 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              运输路线
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 运输类型选择 */}
            <div>
              <Label className="text-base font-semibold mb-3 block">运输类型</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={shipmentType === "LTL" ? "default" : "outline"}
                  className="h-16 text-base"
                  onClick={() => setShipmentType("LTL")}
                >
                  <Package className="mr-2 h-5 w-5" />
                  零担运输 (LTL)
                </Button>
                <Button
                  type="button"
                  variant={shipmentType === "FTL" ? "default" : "outline"}
                  className="h-16 text-base"
                  onClick={() => setShipmentType("FTL")}
                >
                  <Truck className="mr-2 h-5 w-5" />
                  整车运输 (FTL)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupZip">发货邮编</Label>
                <Input
                  id="pickupZip"
                  placeholder="发货邮编"
                  value={formData.pickupZip}
                  onChange={(e) => handleInputChange("pickupZip", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">收货邮编</Label>
                <Input
                  id="deliveryZip"
                  placeholder="收货邮编"
                  value={formData.deliveryZip}
                  onChange={(e) => handleInputChange("deliveryZip", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">参考编号（可选）</Label>
                <Input
                  id="referenceNumber"
                  placeholder="参考编号"
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cargoDescription">货物描述</Label>
                <Input
                  id="cargoDescription"
                  placeholder="货物描述"
                  value={formData.cargoDescription}
                  onChange={(e) => handleInputChange("cargoDescription", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 发货时间 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              发货时间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">发货日期</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupTimeSlot">发货时间段</Label>
                <Select value={formData.pickupTimeSlot} onValueChange={(value) => handleInputChange("pickupTimeSlot", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8-10">8:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="10-12">10:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="12-14">12:00 PM - 2:00 PM</SelectItem>
                    <SelectItem value="14-16">2:00 PM - 4:00 PM</SelectItem>
                    <SelectItem value="16-18">4:00 PM - 6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 发货配套服务（仅零担时显示） */}
        {shipmentType === "LTL" && (
          <Card>
            <CardHeader>
              <CardTitle>发货配套服务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="doorPickup" 
                    checked={pickupServices.doorPickup}
                    onCheckedChange={(checked) => setPickupServices(prev => ({ ...prev, doorPickup: checked as boolean }))}
                  />
                  <label htmlFor="doorPickup" className="text-sm font-medium">上门取件</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pickupLiftgate" 
                    checked={pickupServices.liftgate}
                    onCheckedChange={(checked) => setPickupServices(prev => ({ ...prev, liftgate: checked as boolean }))}
                  />
                  <label htmlFor="pickupLiftgate" className="text-sm font-medium">卸货装置</label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 收货配套服务（仅零担时显示） */}
        {shipmentType === "LTL" && (
          <Card>
            <CardHeader>
              <CardTitle>收货配套服务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="deliveryAppointment" 
                    checked={deliveryServices.deliveryAppointment}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, deliveryAppointment: checked as boolean }))}
                  />
                  <label htmlFor="deliveryAppointment" className="text-sm font-medium">送货预约</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="residential" 
                    checked={deliveryServices.residential}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, residential: checked as boolean }))}
                  />
                  <label htmlFor="residential" className="text-sm font-medium">住宅配送</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="notifyConsignee" 
                    checked={deliveryServices.notifyConsignee}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, notifyConsignee: checked as boolean }))}
                  />
                  <label htmlFor="notifyConsignee" className="text-sm font-medium">通知收货人</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="limitedAccess" 
                    checked={deliveryServices.limitedAccess}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, limitedAccess: checked as boolean }))}
                  />
                  <label htmlFor="limitedAccess" className="text-sm font-medium">限制交付</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="deliveryLiftgate" 
                    checked={deliveryServices.liftgate}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, liftgate: checked as boolean }))}
                  />
                  <label htmlFor="deliveryLiftgate" className="text-sm font-medium">卸货装置</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hazmat" 
                    checked={deliveryServices.hazmat}
                    onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, hazmat: checked as boolean }))}
                  />
                  <label htmlFor="hazmat" className="text-sm font-medium">危险品</label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 托盘信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                托盘信息
              </div>
              <div className="flex gap-2">
                <Select value={unit} onValueChange={(value: "imperial" | "metric") => setUnit(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">lb / in</SelectItem>
                    <SelectItem value="metric">kg / cm</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addPallet} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  添加托盘
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pallets.map((pallet, index) => (
              <div key={pallet.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">托盘 #{index + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPallet(pallet)}
                      className="text-primary hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {pallets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePallet(pallet.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>托盘数量</Label>
                    <Input
                      type="number"
                      placeholder="数量"
                      value={pallet.count}
                      onChange={(e) => updatePallet(pallet.id, "count", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>重量 ({weightUnit})</Label>
                    <Input
                      type="number"
                      placeholder="重量"
                      value={pallet.weight}
                      onChange={(e) => updatePallet(pallet.id, "weight", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>尺寸 ({dimensionUnit})</Label>
                    <Input
                      placeholder="例: 48x40x42"
                      value={pallet.dimensions}
                      onChange={(e) => updatePallet(pallet.id, "dimensions", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>货物等级</Label>
                    <Select 
                      value={pallet.class} 
                      onValueChange={(value) => updatePallet(pallet.id, "class", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">Class 50</SelectItem>
                        <SelectItem value="55">Class 55</SelectItem>
                        <SelectItem value="60">Class 60</SelectItem>
                        <SelectItem value="65">Class 65</SelectItem>
                        <SelectItem value="70">Class 70</SelectItem>
                        <SelectItem value="77.5">Class 77.5</SelectItem>
                        <SelectItem value="85">Class 85</SelectItem>
                        <SelectItem value="92.5">Class 92.5</SelectItem>
                        <SelectItem value="100">Class 100</SelectItem>
                        <SelectItem value="110">Class 110</SelectItem>
                        <SelectItem value="125">Class 125</SelectItem>
                        <SelectItem value="150">Class 150</SelectItem>
                        <SelectItem value="175">Class 175</SelectItem>
                        <SelectItem value="200">Class 200</SelectItem>
                        <SelectItem value="250">Class 250</SelectItem>
                        <SelectItem value="300">Class 300</SelectItem>
                        <SelectItem value="400">Class 400</SelectItem>
                        <SelectItem value="500">Class 500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>商品总数</Label>
                    <Input
                      type="number"
                      placeholder="商品数量"
                      value={pallet.itemCount}
                      onChange={(e) => updatePallet(pallet.id, "itemCount", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>总货值 ($)</Label>
                    <Input
                      type="number"
                      placeholder="货值"
                      value={pallet.value}
                      onChange={(e) => updatePallet(pallet.id, "value", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NMFC</Label>
                    <Input
                      placeholder="NMFC编码"
                      value={pallet.nmfc}
                      onChange={(e) => updatePallet(pallet.id, "nmfc", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NMFC Sub</Label>
                    <Input
                      placeholder="NMFC子类"
                      value={pallet.nmfcSub}
                      onChange={(e) => updatePallet(pallet.id, "nmfcSub", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/dashboard/orders")}
            disabled={loading}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "创建中..." : "创建订单"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
