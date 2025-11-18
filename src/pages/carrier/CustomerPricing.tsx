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
  const [effectiveDateFrom, setEffectiveDateFrom] = useState<string>("");
  const [effectiveDateTo, setEffectiveDateTo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyConfigs, setHistoryConfigs] = useState<any[]>([]);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [customersRes, templatesRes, pricingRes] = await Promise.all([
      supabase.from("customers").select("*").order("customer_code"),
      supabase.from("pricing_templates").select("*").order("template_name"),
      supabase.from("customer_carrier_pricing")
        .select("*, customers(customer_code, company_name)")
        .eq("is_active", true)
        .order("effective_date_from", { ascending: false }),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (pricingRes.data) setPricingConfigs(pricingRes.data);
  };

  const handleOpenDialog = (config?: any) => {
    if (config) {
      setEditingConfig(config);
      setSelectedCustomer(config.customer_id);
      setCarrier(config.carrier);
      setSelectedTemplate(config.template_id || "");
      setCustomPrices(config.custom_prices || {});
      setEffectiveDateFrom(config.effective_date_from || "");
      setEffectiveDateTo(config.effective_date_to || "");
      setNotes(config.notes || "");
    } else {
      setEditingConfig(null);
      setSelectedCustomer(null);
      setCarrier("FedEx");
      setSelectedTemplate("");
      setCustomPrices({});
      setEffectiveDateFrom("");
      setEffectiveDateTo("");
      setNotes("");
    }
    setIsDialogOpen(true);
  };

  const handleCopyConfig = async (config: any) => {
    setSelectedCustomer(null);
    setCarrier(config.carrier);
    setSelectedTemplate(config.template_id || "");
    setCustomPrices(config.custom_prices || {});
    setEffectiveDateFrom("");
    setEffectiveDateTo("");
    setNotes(`复制自: ${config.customers?.company_name}`);
    setEditingConfig(null);
    setIsDialogOpen(true);
    toast({ title: "已复制配置，请选择客户并设置时间段" });
  };

  const handleViewHistory = async (customerId: string, carrier: string) => {
    const { data, error } = await supabase
      .from("customer_carrier_pricing")
      .select("*")
      .eq("customer_id", customerId)
      .eq("carrier", carrier)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "获取历史失败", description: error.message, variant: "destructive" });
    } else {
      setHistoryConfigs(data || []);
      setShowHistory(true);
    }
  };

  const handleRestoreVersion = async (config: any) => {
    setSelectedCustomer(config.customer_id);
    setCarrier(config.carrier);
    setSelectedTemplate(config.template_id || "");
    setCustomPrices(config.custom_prices || {});
    setEffectiveDateFrom("");
    setEffectiveDateTo("");
    setNotes(`恢复自版本 ${config.version}`);
    setEditingConfig(null);
    setShowHistory(false);
    setIsDialogOpen(true);
    toast({ title: "已加载历史版本，请设置时间段后保存" });
  };

  const handleSave = async () => {
    if (!selectedCustomer || !carrier) {
      toast({ title: "请选择客户和承运商", variant: "destructive" });
      return;
    }

    if (!effectiveDateFrom || !effectiveDateTo) {
      toast({ title: "请设置有效时间段", variant: "destructive" });
      return;
    }

    if (new Date(effectiveDateFrom) >= new Date(effectiveDateTo)) {
      toast({ title: "结束时间必须大于开始时间", variant: "destructive" });
      return;
    }

    // 如果是编辑现有配置，先将其设为非活动
    if (editingConfig) {
      await supabase
        .from("customer_carrier_pricing")
        .update({ is_active: false })
        .eq("id", editingConfig.id);
    }

    // 获取最新版本号
    const { data: latestVersion } = await supabase
      .from("customer_carrier_pricing")
      .select("version")
      .eq("customer_id", selectedCustomer)
      .eq("carrier", carrier)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const data: any = {
      customer_id: selectedCustomer,
      carrier,
      template_id: selectedTemplate || null,
      custom_prices: customPrices,
      effective_date_from: effectiveDateFrom,
      effective_date_to: effectiveDateTo,
      notes,
      version: (latestVersion?.version || 0) + 1,
      is_active: true,
    };

    const { error } = await supabase
      .from("customer_carrier_pricing")
      .insert(data);

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
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleViewHistory(config.customer_id, config.carrier)}>
                  历史版本
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCopyConfig(config)}>
                  复制
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(config)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
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
                  <span className="text-muted-foreground">有效期：</span>
                  <span className="font-medium ml-2">
                    {config.effective_date_from ? `${new Date(config.effective_date_from).toLocaleDateString()} - ${new Date(config.effective_date_to).toLocaleDateString()}` : "永久"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">版本：</span>
                  <span className="font-medium ml-2">V{config.version}</span>
                </div>
              </div>
              {config.notes && (
                <div className="mt-2 text-sm text-muted-foreground">
                  备注：{config.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? "编辑客户报价" : "新增客户报价"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>客户 *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer} disabled={!!editingConfig}>
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
                <Label>承运商 *</Label>
                <Select value={carrier} onValueChange={setCarrier} disabled={!!editingConfig}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间 *</Label>
                <Input
                  type="date"
                  value={effectiveDateFrom}
                  onChange={(e) => setEffectiveDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间 *</Label>
                <Input
                  type="date"
                  value={effectiveDateTo}
                  onChange={(e) => setEffectiveDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>选择账套（可选）</Label>
              <Select 
                value={selectedTemplate || "none"} 
                onValueChange={(val) => {
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
                        peak_surcharge_periods: template.peak_surcharge_periods,
                      });
                      toast({ title: "已加载账套价格" });
                    }
                  }
                }}
              >
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

            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="选填"
              />
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

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>历史版本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {historyConfigs.map((config) => (
              <Card key={config.id} className={config.is_active ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        版本 {config.version} {config.is_active && <span className="text-primary">(当前版本)</span>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        有效期：{config.effective_date_from ? `${new Date(config.effective_date_from).toLocaleDateString()} - ${new Date(config.effective_date_to).toLocaleDateString()}` : "永久"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        创建时间：{new Date(config.created_at).toLocaleString()}
                      </p>
                      {config.notes && (
                        <p className="text-sm text-muted-foreground">备注：{config.notes}</p>
                      )}
                    </div>
                    {!config.is_active && (
                      <Button size="sm" onClick={() => handleRestoreVersion(config)}>
                        恢复此版本
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
