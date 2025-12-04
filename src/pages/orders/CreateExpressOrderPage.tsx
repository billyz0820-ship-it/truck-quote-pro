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

interface PackageInfo {
  weight: string;
  length: string;
  width: string;
  height: string;
  declaredValue: string;
}

export default function CreateExpressOrderPage() {
  const { openTab, closeTab } = useTab();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

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
    carrier: "",
    service_type: "",
    signature_service: "",
    reference_number: "",
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
    { weight: "", length: "", width: "", height: "", declaredValue: "" }
  ]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, customer_code, company_name")
      .eq("status", "active")
      .order("customer_code");
    if (data) setCustomers(data);
  };

  const addPackage = () => {
    setPackages([...packages, { weight: "", length: "", width: "", height: "", declaredValue: "" }]);
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

    if (!formData.customer_id || !formData.warehouse || !formData.carrier || !formData.service_type) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }

    if (!formData.recipient_name || !formData.zip_code || !formData.state || !formData.city || !formData.address) {
      toast({ title: "请填写完整的收件人信息", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const customer = customers.find(c => c.id === formData.customer_id);
      const orderNumber = `EXP-${Date.now()}`;

      const { data: orderData, error: orderError } = await supabase
        .from("express_orders")
        .insert({
          order_number: orderNumber,
          customer_id: formData.customer_id,
          customer_code: customer?.customer_code || "",
          warehouse: formData.warehouse,
          carrier: formData.carrier,
          service_type: formData.service_type,
          signature_service: formData.signature_service || null,
          reference_number: formData.reference_number || null,
          order_source: formData.order_source || null,
          recipient_name: formData.recipient_name,
          recipient_phone: formData.recipient_phone || null,
          recipient_email: formData.recipient_email || null,
          country: formData.country,
          zip_code: formData.zip_code,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          address_type: formData.address_type,
          notes: formData.notes || null,
          status: "pending_label",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert packages
      const packagesToInsert = packages
        .filter(p => p.weight)
        .map(p => ({
          order_id: orderData.id,
          weight: parseFloat(p.weight) || 0,
          length: parseFloat(p.length) || null,
          width: parseFloat(p.width) || null,
          height: parseFloat(p.height) || null,
          declared_value: parseFloat(p.declaredValue) || null,
          unit_system: "imperial",
        }));

      if (packagesToInsert.length > 0) {
        const { error: packageError } = await supabase
          .from("express_packages")
          .insert(packagesToInsert);

        if (packageError) throw packageError;
      }

      toast({ title: "创建成功", description: `订单 ${orderNumber} 已创建` });
      handleGoBack();
    } catch (error: any) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
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
            <div className="space-y-2">
              <Label>客户 *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.customer_code} - {c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>发货仓库 *</Label>
              <Select value={formData.warehouse} onValueChange={(v) => setFormData({ ...formData, warehouse: v })}>
                <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">CA</SelectItem>
                  <SelectItem value="NJ">NJ</SelectItem>
                  <SelectItem value="TX">TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Select value={formData.carrier} onValueChange={(v) => setFormData({ ...formData, carrier: v })}>
                <SelectTrigger><SelectValue placeholder="选择承运商" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>物流服务 *</Label>
              <Select value={formData.service_type} onValueChange={(v) => setFormData({ ...formData, service_type: v })}>
                <SelectTrigger><SelectValue placeholder="选择服务" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ground">Ground</SelectItem>
                  <SelectItem value="Home Delivery">Home Delivery</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                  <SelectItem value="Priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>签名服务</Label>
              <Select value={formData.signature_service} onValueChange={(v) => setFormData({ ...formData, signature_service: v })}>
                <SelectTrigger><SelectValue placeholder="无签名服务" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
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
              <Label>参考号</Label>
              <Input value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
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
              <div key={index} className="grid grid-cols-6 gap-4 items-end border-b pb-4">
                <div className="space-y-2">
                  <Label>重量 (lbs) *</Label>
                  <Input type="number" step="0.01" value={pkg.weight} onChange={(e) => updatePackage(index, "weight", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>长度 (in)</Label>
                  <Input type="number" step="0.1" value={pkg.length} onChange={(e) => updatePackage(index, "length", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>宽度 (in)</Label>
                  <Input type="number" step="0.1" value={pkg.width} onChange={(e) => updatePackage(index, "width", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>高度 (in)</Label>
                  <Input type="number" step="0.1" value={pkg.height} onChange={(e) => updatePackage(index, "height", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>申报价值 ($)</Label>
                  <Input type="number" step="0.01" value={pkg.declaredValue} onChange={(e) => updatePackage(index, "declaredValue", e.target.value)} />
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
