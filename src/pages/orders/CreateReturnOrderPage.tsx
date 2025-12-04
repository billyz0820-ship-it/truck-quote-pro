import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, CornerUpLeft } from "lucide-react";
import { useTab } from "@/contexts/TabContext";

export default function CreateReturnOrderPage() {
  const { openTab, closeTab } = useTab();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const currentTabId = "/dashboard/orders/return/new".replace(/\//g, "-");

  const handleGoBack = () => {
    closeTab(currentTabId);
    openTab({
      title: "退货订单",
      path: "/dashboard/orders/return",
      icon: CornerUpLeft,
    });
  };

  const [formData, setFormData] = useState({
    customer_id: "",
    return_person: "",
    carrier: "",
    service_type: "",
    order_source: "",
    warehouse: "",
    zip_code: "",
    state: "",
    city: "",
    address: "",
    address_type: "residential",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.return_person || !formData.carrier || !formData.service_type) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }

    if (!formData.warehouse || !formData.zip_code || !formData.state || !formData.city || !formData.address) {
      toast({ title: "请填写完整的地址信息", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const customer = customers.find(c => c.id === formData.customer_id);
      const orderNumber = `RET-${Date.now()}`;

      const { error } = await supabase
        .from("return_orders")
        .insert({
          order_number: orderNumber,
          customer_id: formData.customer_id,
          customer_code: customer?.customer_code || "",
          return_person: formData.return_person,
          carrier: formData.carrier,
          service_type: formData.service_type,
          order_source: formData.order_source || null,
          warehouse: formData.warehouse,
          zip_code: formData.zip_code,
          state: formData.state,
          city: formData.city,
          address: formData.address,
          address_type: formData.address_type,
          status: "pending_label",
        });

      if (error) throw error;

      toast({ title: "创建成功", description: `退货订单 ${orderNumber} 已创建` });
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
          <h1 className="text-3xl font-bold">新增退货订单</h1>
          <p className="text-muted-foreground mt-1">填写退货订单信息</p>
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
              <Label>退货人 *</Label>
              <Input value={formData.return_person} onChange={(e) => setFormData({ ...formData, return_person: e.target.value })} required />
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>订单来源</Label>
              <Input value={formData.order_source} onChange={(e) => setFormData({ ...formData, order_source: e.target.value })} placeholder="例：Amazon、eBay" />
            </div>
            <div className="space-y-2">
              <Label>收货仓库 *</Label>
              <Select value={formData.warehouse} onValueChange={(v) => setFormData({ ...formData, warehouse: v })}>
                <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">CA</SelectItem>
                  <SelectItem value="NJ">NJ</SelectItem>
                  <SelectItem value="TX">TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>寄件地址</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
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
