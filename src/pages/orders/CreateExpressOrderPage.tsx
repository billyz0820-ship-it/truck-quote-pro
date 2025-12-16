import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Save, Package, Plus, Trash2 } from "lucide-react";
import { useTab } from "@/contexts/TabContext";
import { api } from "@/utils/api";

interface PackageInfo {
  weight: string;
  length: string;
  width: string;
  height: string;
  quantity: string;
  sku: string;
  declaredValue: string;
}

export default function CreateExpressOrderPage() {
  const { openTab, closeTab } = useTab();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [logisticsServices, setLogisticsServices] = useState<any[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const currentTabId = "/dashboard/orders/express/new".replace(/\//g, "-");

  const handleGoBack = () => {
    closeTab(currentTabId);
    openTab({
      title: "快递订单",
      path: "/dashboard/orders/express",
      icon: Package,
    });
  };

  const [formData, setFormData] = useState({
    customer_id: "",
    warehouse: "",
    carrier: "0",
    service_type: "",
    signature_service: "",
    order_number: "",
    order_source: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_email: "",
    country: "US",
    zip_code: "",
    state: "",
    city: "",
    address: "",
    address_type: "residential",
    notes: "",
  });

  const [packages, setPackages] = useState<PackageInfo[]>([
    { weight: "", length: "", width: "", height: "", quantity: "1", sku: "", declaredValue: "" }
  ]);

  useEffect(() => {
    // 检查用户是否有systemType=1权限
    if (user?.systemType === '1' || user?.systemType === 1) {
      setShowCustomerSelector(true);
      // 使用登录时获取的customerList
      if (user?.customerList && user.customerList.length > 0) {
        setCustomers(user.customerList);
      } else {
        fetchCustomers();
      }
    } else {
      setShowCustomerSelector(false);
    }
  }, [user]);

  // 获取物流服务列表
  useEffect(() => {
    const fetchLogisticsServices = async () => {
      try {
        const result = await api.get('/api/v1/LogisticsService/GetAllList');
        
        if (result && result.allListItems) {
          setLogisticsServices(result.allListItems);
        }
      } catch (error: any) {
        toast({ 
          title: "获取物流服务失败", 
          description: error.message, 
          variant: "destructive" 
        });
      }
    };

    fetchLogisticsServices();
  }, []);

  // 根据服务key获取对应的承运商
  const getServiceCarrier = (serviceKey: string): string => {
    // 遍历所有物流服务
    for (const service of logisticsServices) {
      // 在每个服务的dropDownList中查找匹配的服务项
      const found = service.dropDownList.find((item: any) => item.key === serviceKey);
      if (found) {
        // 优先使用carrierId，其次是carrierStr，最后使用carrier
        const carrierId = service.carrierId || service.carrier || service.carrierStr;
        console.log('找到匹配的服务:', {
          serviceKey,
          carrierId,
          carrierStr: service.carrierStr,
          carrier: service.carrier,
          finalValue: carrierId?.toString() || '0'
        });
        return carrierId?.toString() || '0';
      }
    }
    console.warn('未找到服务对应的承运商:', serviceKey);
    return '0'; // 默认值，避免undefined
  };

  // 获取仓库列表
  const fetchWarehouses = async (customerId: string) => {
    try {
      const result = await api.post('/api/v1/Warehouse/GetAllList', {
        customerId: customerId,
        isReturn: false
      });
      
      // result 应该已经是 data 字段的内容
      setWarehouses(result || []);
    } catch (error: any) {
      toast({ 
        title: "获取仓库列表失败", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  // 处理客户选择变化
  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId });
    
    // 当选择客户后，获取对应的仓库列表
    if (customerId) {
      fetchWarehouses(customerId);
      // 清空仓库选择
      setFormData(prev => ({ ...prev, warehouse: '' }));
    } else {
      setWarehouses([]);
    }
  };



  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_code, company_name")
        .eq("status", "active")
        .order("customer_code");
      
      if (error) {
        toast({ 
          title: "获取客户列表失败", 
          description: error.message, 
          variant: "destructive" 
        });
        return;
      }
      
      if (data) {
        // 将数据库记录转换为与customerList相同的格式
        const convertedData = data.map(item => ({
          customerId: item.id,
          customerName: item.company_name || item.customer_code,
        }));
        setCustomers(convertedData);
      }
    } catch (error: any) {
      toast({ 
        title: "获取客户列表异常", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const addPackage = () => {
    setPackages([...packages, { weight: "", length: "", width: "", height: "", quantity: "1", sku: "", declaredValue: "" }]);
  };

  const removePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index));
    }
  };

  const updatePackage = (index: number, field: keyof PackageInfo, value: string) => {
    const newPackages = [...packages];
    newPackages[index][field] = value;
    setPackages(newPackages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 只有在显示客户选择器时才验证customer_id
    if (showCustomerSelector && !formData.customer_id) {
      toast({ title: "请选择客户", variant: "destructive" });
      return;
    }

      if (!formData.warehouse || !formData.service_type || !formData.order_number) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }

    // 检查是否选择了物流服务，如果没有选择carrier会是默认值"0"
    if (formData.carrier === "0" || !formData.carrier) {
      toast({ title: "请选择物流服务", variant: "destructive" });
      return;
    }

    if (formData.order_number.length > 50) {
      toast({ title: "订单号不能超过50个字符", variant: "destructive" });
      return;
    }

    if (!formData.recipient_name || !formData.zip_code || !formData.state || !formData.city || !formData.address) {
      toast({ title: "请填写完整的收件人信息", variant: "destructive" });
      return;
    }

    // 验证包裹信息
    const packageValidation = packages.some((pkg, index) => {
      if (!pkg.weight || parseFloat(pkg.weight) <= 0) {
        toast({ title: `包裹 ${index + 1} 重量必须大于0`, variant: "destructive" });
        return true;
      }
      if (!pkg.length || parseFloat(pkg.length) <= 0) {
        toast({ title: `包裹 ${index + 1} 长度必须大于0`, variant: "destructive" });
        return true;
      }
      if (!pkg.width || parseFloat(pkg.width) <= 0) {
        toast({ title: `包裹 ${index + 1} 宽度必须大于0`, variant: "destructive" });
        return true;
      }
      if (!pkg.height || parseFloat(pkg.height) <= 0) {
        toast({ title: `包裹 ${index + 1} 高度必须大于0`, variant: "destructive" });
        return true;
      }
      if (pkg.quantity && (parseInt(pkg.quantity) <= 0 || parseInt(pkg.quantity) > 100)) {
        toast({ title: `包裹 ${index + 1} 数量必须在1-100之间`, variant: "destructive" });
        return true;
      }
      if (pkg.sku && pkg.sku.length > 50) {
        toast({ title: `包裹 ${index + 1} SKU不能超过50个字符`, variant: "destructive" });
        return true;
      }
      return false;
    });

    if (packageValidation) {
      return;
    }

    setSaving(true);

    try {
      const customer = showCustomerSelector ? customers.find(c => (c.customerId || c.id) === formData.customer_id) : null;
      const warehouse = warehouses.find(w => w.key === formData.warehouse);
      
      // 构建订单请求数据
      const orderRequest = {
        customerId: showCustomerSelector ? formData.customer_id : null,
        customerName: customer?.customerName || customer?.company_name || null,
        carrier: parseInt(formData.carrier) || 0, // 转换为数字枚举，确保有默认值
        wareHouseId: formData.warehouse,
        wareHouseName: warehouse?.value || formData.warehouse,
        signTypePrint: formData.signature_service || null,
        logisticsidPrintId: formData.service_type, // 与logisticsidService相同
        addresserStreet: "", // 发件人街道，暂时为空
        addresserCountry: "US", // 发件人国家
        addresserCityName: "", // 发件人城市
        addresserStateorProvince: "", // 发件人州
        addresserAddress1: "", // 发件人地址1
        addresserAddress2: "", // 发件人地址2
        addresserPhone: "", // 发件人电话
        addresserPostalCode: "", // 发件人邮编
        addresserEmail: "", // 发件人邮箱
        addresser: "", // 发件人
        orderNo: formData.order_number, // 订单号
        logisticsidService: formData.service_type, // 物流服务
        recipientStreet: formData.address,
        recipientCountry: formData.country,
        recipientCityName: formData.city,
        recipientStateorProvince: formData.state,
        recipientAddress1: formData.address,
        recipientAddress2: "",
        recipientPhone: formData.recipient_phone,
        recipientPostalCode: formData.zip_code,
        recipientEmail: formData.recipient_email,
        recipient: formData.recipient_name,
        addressType: formData.address_type === "residential" ? 1 : 2, // 地址类型枚举
        orderType: 1, // 常规订单
        packageList: packages
          .filter(p => p.weight)
          .map(p => ({
            packageWeight: parseFloat(p.weight) || 0,
            packageWeightUnits: "lbs", // 重量单位，默认lbs
            packageLength: parseFloat(p.length) || null,
            packageWidth: parseFloat(p.width) || null,
            packageHeight: parseFloat(p.height) || null,
            dimensionsUnits: "in", // 规格单位，默认in
            declaredValue: parseFloat(p.declaredValue) || null,
            countryOfOrigin: "US", // 原产国，默认美国
            productNo: p.sku || "", // 产品编号
            quantity: parseInt(p.quantity) || 1,
            customerReference: formData.order_number, // 客户参考号，使用订单号
            customerReferenceTwo: formData.order_source || "", // 客户参考号2，使用订单来源
          })),
        remark: formData.notes || "",
      };

      // 调用订单创建API
      const result = await api.post('/api/v1/Order/Create', orderRequest);

      if (result) {
        toast({ title: "创建成功", description: `订单 ${orderRequest.orderNo} 已创建` });
        handleGoBack();
      } else {
        throw new Error('订单创建失败');
      }
    } catch (error: any) {
      toast({ title: "创建失败", description: error.message || "订单创建失败，请重试", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">新增快递订单</h1>
          <p className="text-muted-foreground mt-1">填写快递订单信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {showCustomerSelector && (
              <div className="space-y-2">
                <Label>客户 *</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.customerId || c.id} value={c.customerId || c.id}>
                        {c.customerName || c.company_name || c.customer_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>发货仓库 *</Label>
              <Select value={formData.warehouse} onValueChange={(v) => setFormData({ ...formData, warehouse: v })}>
                <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                <SelectContent>
                  {showCustomerSelector && warehouses.length > 0 ? (
                    warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.key} value={warehouse.key}>
                        {warehouse.value}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="CA">CA</SelectItem>
                      <SelectItem value="NJ">NJ</SelectItem>
                      <SelectItem value="TX">TX</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>物流服务 *</Label>
              <Select value={formData.service_type} onValueChange={(v) => {
                console.log('选择物流服务:', v);
                const carrierValue = getServiceCarrier(v);
                console.log('获取到的承运商:', carrierValue);
                setFormData(prev => ({ 
                  ...prev, 
                  service_type: v, 
                  carrier: carrierValue 
                }));
              }}>
                <SelectTrigger><SelectValue placeholder="选择服务" /></SelectTrigger>
                <SelectContent>
                  {logisticsServices.flatMap((service) => 
                    service.dropDownList.map((item: any) => (
                      <SelectItem key={item.key} value={item.key}>
                        {service.carrierStr} - {item.value}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>签名服务</Label>
              <Select value={formData.signature_service || "none"} onValueChange={(v) => setFormData({ ...formData, signature_service: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="无签名服务" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  <SelectItem value="direct">直接签名</SelectItem>
                  <SelectItem value="indirect">间接签名</SelectItem>
                  <SelectItem value="adult">成人签名</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>订单来源</Label>
              <Input value={formData.order_source} onChange={(e) => setFormData({ ...formData, order_source: e.target.value })} placeholder="例：Amazon、eBay" />
            </div>
            <div className="space-y-2">
              <Label>订单号 *</Label>
              <Input value={formData.order_number} onChange={(e) => setFormData({ ...formData, order_number: e.target.value })} maxLength={50} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>收件人信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>收件人 *</Label>
              <Input value={formData.recipient_name} onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>电话</Label>
              <Input value={formData.recipient_phone} onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={formData.recipient_email} onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>国家</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">美国</SelectItem>
                  <SelectItem value="CA">加拿大</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>邮编 *</Label>
              <Input value={formData.zip_code} onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>州 *</Label>
              <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>城市 *</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>地址 *</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>地址类型</Label>
              <Select value={formData.address_type} onValueChange={(v) => setFormData({ ...formData, address_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">住宅</SelectItem>
                  <SelectItem value="commercial">商业</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>包裹信息</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addPackage}>
              <Plus className="h-4 w-4 mr-1" /> 添加包裹
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {packages.map((pkg, index) => (
              <div key={index} className="grid grid-cols-8 gap-4 items-end border-b pb-4">
                <div className="space-y-2">
                  <Label>重量 (lbs) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={pkg.weight} 
                    onChange={(e) => updatePackage(index, "weight", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>长度 (in) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={pkg.length} 
                    onChange={(e) => updatePackage(index, "length", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>宽度 (in) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={pkg.width} 
                    onChange={(e) => updatePackage(index, "width", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>高度 (in) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={pkg.height} 
                    onChange={(e) => updatePackage(index, "height", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>数量</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={pkg.quantity} 
                    onChange={(e) => updatePackage(index, "quantity", e.target.value)} 
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    type="text" 
                    maxLength={50}
                    value={pkg.sku} 
                    onChange={(e) => updatePackage(index, "sku", e.target.value)} 
                    placeholder="SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label>申报价值 ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={pkg.declaredValue} 
                    onChange={(e) => updatePackage(index, "declaredValue", e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  {packages.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="订单备注信息..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleGoBack}>取消</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "创建中..." : "创建订单"}
          </Button>
        </div>
      </form>
    </div>
  );
}
