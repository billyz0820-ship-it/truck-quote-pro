import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MapPin, Package, Plus, Trash2, Copy, Calendar, Truck, Warehouse, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RouteMap } from "@/components/RouteMap";
import { useZipCodeLookup } from "@/hooks/useZipCodeLookup";

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

// 地址类型选项
const ADDRESS_TYPES = [
  { value: "commercial_dock", label: "商业地址带卸货口" },
  { value: "commercial_no_dock", label: "商业地址无卸货口" },
  { value: "residential", label: "住宅地址" },
];

const CreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const { lookupZipCode, loading: zipLoading } = useZipCodeLookup();
  
  // 从路由状态恢复数据（从报价页面返回时）
  const restoredData = location.state?.orderData;
  
  // 客户选择（仅管理员需要）
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(restoredData?.customerId || "");
  
  // 运输类型
  const [shipmentType, setShipmentType] = useState<"FTL" | "LTL">(restoredData?.shipmentType || "LTL");
  
  // 地址类型
  const [pickupAddressType, setPickupAddressType] = useState<string>(restoredData?.pickupAddressType || "commercial_dock");
  const [deliveryAddressType, setDeliveryAddressType] = useState<string>(restoredData?.deliveryAddressType || "commercial_dock");
  
  // 平台仓库相关
  const [isPlatformWarehouse, setIsPlatformWarehouse] = useState<boolean>(restoredData?.isPlatformWarehouse || false);
  const [warehouseCode, setWarehouseCode] = useState<string>(restoredData?.warehouseCode || "");
  const [warehouseAddress, setWarehouseAddress] = useState<string>(restoredData?.warehouseAddress || "");
  
  // ZIP code 对应的城市和州
  const [pickupLocation, setPickupLocation] = useState({
    city: restoredData?.pickupCity || "",
    state: restoredData?.pickupState || ""
  });
  const [deliveryLocation, setDeliveryLocation] = useState({
    city: restoredData?.deliveryCity || "",
    state: restoredData?.deliveryState || ""
  });
  
  const [formData, setFormData] = useState({
    pickupZip: restoredData?.pickupZip || "",
    deliveryZip: restoredData?.deliveryZip || "",
    pickupDate: restoredData?.pickupDate || "",
    pickupTimeSlot: restoredData?.pickupTimeSlot || "",
    referenceNumber: restoredData?.referenceNumber || "",
    cargoDescription: restoredData?.cargoDescription || "",
  });
  
  const [pallets, setPallets] = useState<Pallet[]>(
    restoredData?.pallets?.length > 0 
      ? restoredData.pallets 
      : [{ id: "1", count: 1, weight: 0, dimensions: "", class: "", itemCount: 0, value: 0, nmfc: "", nmfcSub: "" }]
  );

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
  
  // 根据地址类型自动设置服务
  useEffect(() => {
    // 发货地址无卸货口 -> 强制添加卸货装置
    if (pickupAddressType === "commercial_no_dock") {
      setPickupServices(prev => ({ ...prev, liftgate: true }));
    }
  }, [pickupAddressType]);
  
  useEffect(() => {
    // 收货地址无卸货口 -> 强制添加卸货装置
    // 收货地址住宅 -> 强制添加卸货装置和住宅配送
    if (deliveryAddressType === "commercial_no_dock") {
      setDeliveryServices(prev => ({ ...prev, liftgate: true }));
    } else if (deliveryAddressType === "residential") {
      setDeliveryServices(prev => ({ ...prev, liftgate: true, residential: true }));
    }
  }, [deliveryAddressType]);
  
  // 判断是否为商业地址（用于显示平台仓库选项）
  const isDeliveryCommercial = deliveryAddressType === "commercial_dock" || deliveryAddressType === "commercial_no_dock";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 验证邮编格式: 5位数 或 5位数-4位数
  const validateZipCode = (value: string): boolean => {
    const zipPattern = /^\d{5}(-\d{4})?$/;
    return zipPattern.test(value);
  };

  // 邮编变更时自动查询城市和州
  const handleZipChange = async (field: 'pickupZip' | 'deliveryZip', value: string) => {
    // 允许输入数字和连字符
    const cleanValue = value.replace(/[^\d-]/g, '');
    handleInputChange(field, cleanValue);
    
    // 取前5位进行查询
    const zip5 = cleanValue.substring(0, 5);
    
    if (zip5.length === 5) {
      const result = await lookupZipCode(zip5);
      if (result) {
        if (field === 'pickupZip') {
          setPickupLocation({ city: result.city, state: result.stateCode });
        } else {
          setDeliveryLocation({ city: result.city, state: result.stateCode });
        }
      }
    } else {
      // 清空位置信息
      if (field === 'pickupZip') {
        setPickupLocation({ city: "", state: "" });
      } else {
        setDeliveryLocation({ city: "", state: "" });
      }
    }
  };

  // 验证托盘尺寸格式: 长*宽*高，每项必填，支持一位小数
  const validateDimensions = (dimensions: string): boolean => {
    if (!dimensions) return false;
    const dimPattern = /^\d+(\.\d)?[*xX]\d+(\.\d)?[*xX]\d+(\.\d)?$/;
    return dimPattern.test(dimensions);
  };

  // 格式化托盘尺寸
  const formatDimensions = (value: string): string => {
    // 将 x 或 X 替换为 *
    return value.replace(/[xX]/g, '*');
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
    let processedValue = value;
    if (field === 'dimensions' && typeof value === 'string') {
      processedValue = formatDimensions(value);
    }
    setPallets(prev => prev.map(pallet => 
      pallet.id === id ? { ...pallet, [field]: processedValue } : pallet
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

    // 验证邮编格式
    if (!validateZipCode(formData.pickupZip)) {
      toast.error("发货邮编格式不正确，请输入5位数或5位数-4位数格式");
      return;
    }
    if (!validateZipCode(formData.deliveryZip)) {
      toast.error("收货邮编格式不正确，请输入5位数或5位数-4位数格式");
      return;
    }

    // 验证托盘数据
    if (pallets.length === 0) {
      toast.error("请至少添加一个托盘");
      return;
    }

    // 验证托盘尺寸格式
    for (const pallet of pallets) {
      if (!validateDimensions(pallet.dimensions)) {
        toast.error(`托盘尺寸格式不正确，请使用 长*宽*高 格式（如 48*40*72）`);
        return;
      }
    }

    try {
      // 获取客户编码
      const { data: customerData } = await supabase
        .from('customers')
        .select('customer_code')
        .eq('id', orderCustomerId)
        .single();

      // 准备订单数据
      const orderData = {
        customerId: orderCustomerId,
        customerCode: customerData?.customer_code,
        shipmentType,
        pickupZip: formData.pickupZip,
        pickupCity: pickupLocation.city,
        pickupState: pickupLocation.state,
        deliveryZip: formData.deliveryZip,
        deliveryCity: deliveryLocation.city,
        deliveryState: deliveryLocation.state,
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        referenceNumber: formData.referenceNumber,
        cargoDescription: formData.cargoDescription,
        pallets,
        pickupAddressType,
        deliveryAddressType,
        isPlatformWarehouse,
        warehouseCode: isPlatformWarehouse ? warehouseCode : null,
        warehouseAddress: isPlatformWarehouse ? warehouseAddress : null,
        pickupServices: shipmentType === "LTL" ? pickupServices : null,
        deliveryServices: shipmentType === "LTL" ? deliveryServices : null,
      };

      // 跳转到报价页面
      navigate("/dashboard/orders/quote", { state: { orderData } });
    } catch (error: any) {
      console.error("获取客户信息失败:", error);
      toast.error("获取客户信息失败: " + error.message);
    }
  };

  const weightUnit = unit === "imperial" ? "磅" : "千克";
  const dimensionUnit = unit === "imperial" ? "英寸" : "厘米";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/orders")}
          className="p-2 h-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">创建新订单</h1>
          <p className="text-sm text-muted-foreground">输入运输详情获取实时报价</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧 - 主表单区域 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 客户选择（仅管理员可见） */}
            {userRole === "admin" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">选择客户</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedCustomerId} 
                    onValueChange={setSelectedCustomerId}
                    required
                  >
                    <SelectTrigger className="h-9">
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
                </CardContent>
              </Card>
            )}

            {/* 运输路线 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  运输路线
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 运输类型选择 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={shipmentType === "LTL" ? "default" : "outline"}
                    className="h-10 text-sm"
                    onClick={() => setShipmentType("LTL")}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    零担运输 (LTL)
                  </Button>
                  <Button
                    type="button"
                    variant={shipmentType === "FTL" ? "default" : "outline"}
                    className="h-10 text-sm"
                    onClick={() => setShipmentType("FTL")}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    整车运输 (FTL)
                  </Button>
                </div>

                {/* 发货/收货邮编 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pickupZip" className="text-sm">发货邮编</Label>
                    <div className="relative">
                      <Input
                        id="pickupZip"
                        placeholder="12345 或 12345-6789"
                        value={formData.pickupZip}
                        onChange={(e) => handleZipChange("pickupZip", e.target.value)}
                        maxLength={10}
                        required
                        className="h-9"
                      />
                      {zipLoading && formData.pickupZip.length >= 5 && (
                        <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">发货城市/州</Label>
                    <Input
                      value={pickupLocation.city && pickupLocation.state ? `${pickupLocation.city}, ${pickupLocation.state}` : ""}
                      placeholder="自动填充"
                      disabled
                      className="h-9 bg-muted"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryZip" className="text-sm">收货邮编</Label>
                    <div className="relative">
                      <Input
                        id="deliveryZip"
                        placeholder="12345 或 12345-6789"
                        value={formData.deliveryZip}
                        onChange={(e) => handleZipChange("deliveryZip", e.target.value)}
                        maxLength={10}
                        required
                        className="h-9"
                      />
                      {zipLoading && formData.deliveryZip.length >= 5 && (
                        <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">收货城市/州</Label>
                    <Input
                      value={deliveryLocation.city && deliveryLocation.state ? `${deliveryLocation.city}, ${deliveryLocation.state}` : ""}
                      placeholder="自动填充"
                      disabled
                      className="h-9 bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="referenceNumber" className="text-sm">参考编号（可选）</Label>
                    <Input
                      id="referenceNumber"
                      placeholder="参考编号"
                      value={formData.referenceNumber}
                      onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cargoDescription" className="text-sm">货物描述</Label>
                    <Input
                      id="cargoDescription"
                      placeholder="货物描述"
                      value={formData.cargoDescription}
                      onChange={(e) => handleInputChange("cargoDescription", e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
                
                {/* 发货地址类型（仅零担显示） */}
                {shipmentType === "LTL" && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">发货地址类型</Label>
                    <RadioGroup
                      value={pickupAddressType}
                      onValueChange={setPickupAddressType}
                      className="grid grid-cols-3 gap-2"
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={`pickup-${type.value}`} />
                          <Label htmlFor={`pickup-${type.value}`} className="text-sm cursor-pointer">{type.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
                
                {/* 收货地址类型 */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium">收货地址类型</Label>
                  <RadioGroup
                    value={deliveryAddressType}
                    onValueChange={(value) => {
                      setDeliveryAddressType(value);
                      if (value === "residential") {
                        setIsPlatformWarehouse(false);
                        setWarehouseCode("");
                        setWarehouseAddress("");
                      }
                    }}
                    className="grid grid-cols-3 gap-2"
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} id={`delivery-${type.value}`} />
                        <Label htmlFor={`delivery-${type.value}`} className="text-sm cursor-pointer">{type.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                {/* 平台仓库确认（商业地址时显示） */}
                {isDeliveryCommercial && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Warehouse className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-medium">是否为平台仓库？</Label>
                        <RadioGroup
                          value={isPlatformWarehouse ? "yes" : "no"}
                          onValueChange={(v) => setIsPlatformWarehouse(v === "yes")}
                          className="flex gap-4 ml-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="not-platform" />
                            <Label htmlFor="not-platform" className="text-sm cursor-pointer">否</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="is-platform" />
                            <Label htmlFor="is-platform" className="text-sm cursor-pointer">是（如 Amazon FBA、Wayfair、Walmart）</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {isPlatformWarehouse && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">仓库编码 *</Label>
                            <Input
                              placeholder="例：ABE8、TEB6、CG01"
                              value={warehouseCode}
                              onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                              className="h-9"
                              required={isPlatformWarehouse}
                            />
                            <p className="text-xs text-muted-foreground">系统将优先匹配平台仓专送报价</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">仓库地址</Label>
                            <Input
                              placeholder="仓库详细地址"
                              value={warehouseAddress}
                              onChange={(e) => setWarehouseAddress(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* 发货时间与配套服务（合并） */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  发货时间{shipmentType === "LTL" && " & 配套服务"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pickupDate" className="text-sm">发货日期</Label>
                    <Input
                      id="pickupDate"
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pickupTimeSlot" className="text-sm">发货时间段</Label>
                    <Select value={formData.pickupTimeSlot} onValueChange={(value) => handleInputChange("pickupTimeSlot", value)}>
                      <SelectTrigger className="h-9">
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
                  {/* 发货配套服务（仅零担） */}
                  {shipmentType === "LTL" && (
                    <>
                      <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="doorPickup" 
                            checked={pickupServices.doorPickup}
                            onCheckedChange={(checked) => setPickupServices(prev => ({ ...prev, doorPickup: checked as boolean }))}
                          />
                          <label htmlFor="doorPickup" className="text-sm">上门取件</label>
                        </div>
                      </div>
                      <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pickupLiftgate" 
                            checked={pickupServices.liftgate}
                            disabled={pickupAddressType === "commercial_no_dock"}
                            onCheckedChange={(checked) => setPickupServices(prev => ({ ...prev, liftgate: checked as boolean }))}
                          />
                          <label htmlFor="pickupLiftgate" className="text-sm">
                            卸货装置
                            {pickupAddressType === "commercial_no_dock" && <span className="text-xs text-primary ml-1">(必选)</span>}
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 收货配套服务（仅零担时显示） */}
            {shipmentType === "LTL" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">收货配套服务</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="deliveryAppointment" 
                        checked={deliveryServices.deliveryAppointment}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, deliveryAppointment: checked as boolean }))}
                      />
                      <label htmlFor="deliveryAppointment" className="text-sm">送货预约</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="residential" 
                        checked={deliveryServices.residential}
                        disabled={deliveryAddressType === "residential"}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, residential: checked as boolean }))}
                      />
                      <label htmlFor="residential" className="text-sm">
                        住宅配送{deliveryAddressType === "residential" && <span className="text-xs text-primary ml-1">(必选)</span>}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="notifyConsignee" 
                        checked={deliveryServices.notifyConsignee}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, notifyConsignee: checked as boolean }))}
                      />
                      <label htmlFor="notifyConsignee" className="text-sm">通知收货人</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="limitedAccess" 
                        checked={deliveryServices.limitedAccess}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, limitedAccess: checked as boolean }))}
                      />
                      <label htmlFor="limitedAccess" className="text-sm">限制交付</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="deliveryLiftgate" 
                        checked={deliveryServices.liftgate}
                        disabled={deliveryAddressType === "commercial_no_dock" || deliveryAddressType === "residential"}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, liftgate: checked as boolean }))}
                      />
                      <label htmlFor="deliveryLiftgate" className="text-sm">
                        卸货装置
                        {(deliveryAddressType === "commercial_no_dock" || deliveryAddressType === "residential") && 
                          <span className="text-xs text-primary ml-1">(必选)</span>}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hazmat" 
                        checked={deliveryServices.hazmat}
                        onCheckedChange={(checked) => setDeliveryServices(prev => ({ ...prev, hazmat: checked as boolean }))}
                      />
                      <label htmlFor="hazmat" className="text-sm">危险品</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 托盘信息 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    托盘信息
                  </div>
                  <div className="flex gap-2">
                    <Select value={unit} onValueChange={(value: "imperial" | "metric") => setUnit(value)}>
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imperial">lb / in</SelectItem>
                        <SelectItem value="metric">kg / cm</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addPallet} size="sm" className="h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      添加
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pallets.map((pallet, index) => (
                  <div key={pallet.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">托盘 #{index + 1}</h4>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPallet(pallet)}
                          className="h-7 w-7 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {pallets.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePallet(pallet.id)}
                            className="h-7 w-7 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">托盘数量</Label>
                        <Input
                          type="number"
                          placeholder="数量"
                          value={pallet.count}
                          onChange={(e) => updatePallet(pallet.id, "count", parseInt(e.target.value) || 0)}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">重量 ({weightUnit})</Label>
                        <Input
                          type="number"
                          placeholder="重量"
                          value={pallet.weight}
                          onChange={(e) => updatePallet(pallet.id, "weight", parseInt(e.target.value) || 0)}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">尺寸 ({dimensionUnit})</Label>
                        <Input
                          placeholder="48x40x42"
                          value={pallet.dimensions}
                          onChange={(e) => updatePallet(pallet.id, "dimensions", e.target.value)}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">货物等级</Label>
                        <Select 
                          value={pallet.class} 
                          onValueChange={(value) => updatePallet(pallet.id, "class", value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="等级" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">Class 50</SelectItem>
                            <SelectItem value="55">Class 55</SelectItem>
                            <SelectItem value="60">Class 60</SelectItem>
                            <SelectItem value="70">Class 70</SelectItem>
                            <SelectItem value="85">Class 85</SelectItem>
                            <SelectItem value="100">Class 100</SelectItem>
                            <SelectItem value="125">Class 125</SelectItem>
                            <SelectItem value="150">Class 150</SelectItem>
                            <SelectItem value="200">Class 200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">商品总数</Label>
                        <Input
                          type="number"
                          placeholder="数量"
                          value={pallet.itemCount}
                          onChange={(e) => updatePallet(pallet.id, "itemCount", parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">总货值 ($)</Label>
                        <Input
                          type="number"
                          placeholder="货值"
                          value={pallet.value}
                          onChange={(e) => updatePallet(pallet.id, "value", parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">NMFC</Label>
                        <Input
                          placeholder="NMFC"
                          value={pallet.nmfc}
                          onChange={(e) => updatePallet(pallet.id, "nmfc", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">NMFC Sub</Label>
                        <Input
                          placeholder="Sub"
                          value={pallet.nmfcSub}
                          onChange={(e) => updatePallet(pallet.id, "nmfcSub", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/dashboard/orders")}
                disabled={loading}
                className="h-9"
              >
                取消
              </Button>
              <Button type="submit" disabled={loading} className="h-9">
                {loading ? "提交中..." : "获取报价"}
              </Button>
            </div>
          </div>

          {/* 右侧 - 路线地图 */}
          <div className="space-y-4 lg:sticky lg:top-4">
            {formData.pickupZip && formData.deliveryZip ? (
              <RouteMap 
                pickupZip={formData.pickupZip}
                deliveryZip={formData.deliveryZip}
                pickupCity={pickupLocation.city}
                pickupState={pickupLocation.state}
                deliveryCity={deliveryLocation.city}
                deliveryState={deliveryLocation.state}
              />
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    请在左侧输入发货和收货邮编
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    输入后将显示路线地图
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
