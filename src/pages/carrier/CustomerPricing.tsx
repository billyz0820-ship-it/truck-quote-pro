import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Search } from "lucide-react";
import { PricingConfigTabs } from "@/components/carrier/PricingConfigTabs";

export default function CustomerPricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [carrier, setCarrier] = useState("FedEx");
  const [customPrices, setCustomPrices] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [customersRes, templatesRes, pricingRes] = await Promise.all([
      supabase.from("customers").select("*").order("customer_code"),
      supabase.from("pricing_templates").select("*").order("template_name"),
      supabase.from("customer_carrier_pricing").select("*, customers(customer_code, company_name)"),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (pricingRes.data) setPricingConfigs(pricingRes.data);
  };

  const handleOpenDialog = (config?: any) => {
    if (config) {
      setSelectedCustomer(config.customer_id);
      setCarrier(config.carrier);
      setSelectedTemplate(config.template_id || "");
      setCustomPrices(config.custom_prices || {});
    } else {
      setSelectedCustomer(null);
      setCarrier("FedEx");
      setSelectedTemplate("");
      setCustomPrices({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCustomer || !carrier) {
      toast({ title: "请选择客户和承运商", variant: "destructive" });
      return;
    }

    const data: any = {
      customer_id: selectedCustomer,
      carrier,
      template_id: selectedTemplate || null,
      custom_prices: customPrices,
    };

    const { error } = await supabase
      .from("customer_carrier_pricing")
      .upsert(data, { onConflict: "customer_id,carrier" });

    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "保存成功" });
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const filteredConfigs = pricingConfigs.filter((config) =>
    config.customers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.customers?.customer_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客户报价配置</h1>
          <p className="text-muted-foreground">为每个客户配置专属的快递报价</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          新增配置
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户名称或编码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">
                {config.customers?.company_name} ({config.customers?.customer_code})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(config)}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">承运商：</span>
                  <span className="font-medium ml-2">{config.carrier}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">账套：</span>
                  <span className="font-medium ml-2">
                    {config.template_id ? templates.find(t => t.id === config.template_id)?.template_name : "自定义"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间：</span>
                  <span className="font-medium ml-2">
                    {new Date(config.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置客户报价</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>客户</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name} ({customer.customer_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>承运商</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>选择账套（可选）</Label>
              <Select value={selectedTemplate || "none"} onValueChange={(val) => {
                const actualValue = val === "none" ? "" : val;
                setSelectedTemplate(actualValue);
                if (actualValue) {
                  const template = templates.find(t => t.id === actualValue);
                  if (template) {
                    setCustomPrices({
                      base_prices: template.base_prices,
                      ahs_weight: template.ahs_weight,
                      ahs_dim: template.ahs_dim,
                      ahs_packing: template.ahs_packing,
                      oversize_commercial: template.oversize_commercial,
                      oversize_residential: template.oversize_residential,
                      residential_fees: template.residential_fees,
                      remote_area_fees: template.remote_area_fees,
                      dim_factor: template.dim_factor,
                      fuel_charge: template.fuel_charge,
                      unauthorized_fee: template.unauthorized_fee,
                      peak_surcharges: template.peak_surcharges,
                    });
                  }
                } else {
                  setCustomPrices({});
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="不使用账套，自定义配置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用账套</SelectItem>
                  {templates.filter(t => t.carrier === carrier).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                选择账套后，价格将自动填充，您可以在下方进行修改
              </p>
            </div>

            <PricingConfigTabs config={customPrices} onChange={setCustomPrices} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存配置</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
