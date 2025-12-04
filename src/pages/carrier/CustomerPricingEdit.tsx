import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { PricingConfigTabs } from "@/components/carrier/PricingConfigTabs";
import { ProfitabilityAnalyzer } from "@/lib/profitabilityAnalyzer";

export default function CustomerPricingEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFrom = searchParams.get("copyFrom");
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [carrier, setCarrier] = useState("FedEx");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [customPrices, setCustomPrices] = useState<any>({});
  const [effectiveDateFrom, setEffectiveDateFrom] = useState<string>("");
  const [effectiveDateTo, setEffectiveDateTo] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchConfig(id);
    } else if (copyFrom) {
      fetchConfig(copyFrom);
    }
  }, [id, copyFrom]);

  const fetchData = async () => {
    const [customersRes, templatesRes] = await Promise.all([
      supabase.from("customers").select("id, customer_code, company_name").order("customer_code"),
      supabase.from("pricing_templates").select("*").order("template_name"),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
  };

  const fetchConfig = async (configId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_carrier_pricing")
      .select("*")
      .eq("id", configId)
      .single();

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
      navigate("/dashboard/carrier/customer-pricing");
    } else if (data) {
      if (isEditing) {
        setSelectedCustomer(data.customer_id);
      }
      // If copying, don't set customer - user should select new customer
      if (copyFrom) {
        setNotes(`复制自配置 v${data.version}`);
      } else {
        setSelectedCustomer(data.customer_id);
        setEffectiveDateFrom(data.effective_date_from || "");
        setEffectiveDateTo(data.effective_date_to || "");
        setNotes(data.notes || "");
      }
      setCarrier(data.carrier);
      setSelectedTemplate(data.template_id || "none");
      setCustomPrices(data.custom_prices || {});
    }
    setLoading(false);
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId && templateId !== "none") {
      const { data: templateData } = await supabase
        .from("pricing_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (templateData) {
        setCustomPrices({
          base_prices: templateData.base_prices,
          ahs_weight: templateData.ahs_weight,
          ahs_dim: templateData.ahs_dim,
          ahs_packing: templateData.ahs_packing,
          oversize_commercial: templateData.oversize_commercial,
          oversize_residential: templateData.oversize_residential,
          residential_fees: templateData.residential_fees,
          remote_area_fees: templateData.remote_area_fees,
          peak_surcharges: templateData.peak_surcharges,
          dim_factor: templateData.dim_factor,
          fuel_charge: templateData.fuel_charge,
          unauthorized_fee: templateData.unauthorized_fee,
          signature_services: templateData.signature_services,
          delivery_intercept_fee: templateData.delivery_intercept_fee,
          address_correction_fee: templateData.address_correction_fee,
          dangerous_goods_fee: templateData.dangerous_goods_fee,
        });
        toast({ title: "已加载账套配置" });
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!selectedCustomer || !carrier) {
        toast({ title: "请填写必填项", variant: "destructive" });
        return;
      }

      if (effectiveDateFrom && effectiveDateTo && effectiveDateFrom > effectiveDateTo) {
        toast({ title: "生效日期不能晚于失效日期", variant: "destructive" });
        return;
      }

      setSaving(true);

      // Get cost pricing for profitability analysis
      const { data: accountData } = await supabase
        .from("carrier_accounts")
        .select("id")
        .eq("carrier", carrier)
        .single();

      let profitabilityAnalysis = {};
      if (accountData) {
        const { data: costData } = await supabase
          .from("carrier_account_costs")
          .select("*")
          .eq("account_id", accountData.id)
          .order("effective_date", { ascending: false })
          .limit(1)
          .single();

        if (costData) {
          const costPricing = {
            base_prices: costData.base_prices as any,
            ahs_weight: costData.ahs_weight as any,
            ahs_dim: costData.ahs_dim as any,
            ahs_packing: costData.ahs_packing as any,
            oversize_commercial: costData.oversize_commercial as any,
            oversize_residential: costData.oversize_residential as any,
            residential_fees: costData.residential_fees as any,
            remote_area_fees: costData.remote_area_fees as any,
          };
          profitabilityAnalysis = ProfitabilityAnalyzer.analyze(customPrices, costPricing);
        }
      }

      // Deactivate old config if editing
      if (isEditing && id) {
        await supabase
          .from("customer_carrier_pricing")
          .update({ is_active: false })
          .eq("id", id);
      }

      // Get next version number
      const { data: existingConfigs } = await supabase
        .from("customer_carrier_pricing")
        .select("version")
        .eq("customer_id", selectedCustomer)
        .eq("carrier", carrier)
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = existingConfigs && existingConfigs.length > 0 
        ? existingConfigs[0].version + 1 
        : 1;

      // Insert new config
      const { data, error } = await supabase
        .from("customer_carrier_pricing")
        .insert({
          customer_id: selectedCustomer,
          carrier,
          template_id: selectedTemplate && selectedTemplate !== "none" ? selectedTemplate : null,
          custom_prices: customPrices,
          effective_date_from: effectiveDateFrom || null,
          effective_date_to: effectiveDateTo || null,
          notes,
          version: nextVersion,
          is_active: true,
          profitability_analysis: profitabilityAnalysis,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if effective date is set
      if (effectiveDateFrom && data) {
        await supabase
          .from("customer_pricing_notifications")
          .insert({
            customer_id: selectedCustomer,
            pricing_config_id: data.id,
            title: "价格配置更新通知",
            message: `您的${carrier}运费配置已更新，将于${effectiveDateFrom}生效${effectiveDateTo ? `，${effectiveDateTo}失效` : ''}。`,
            effective_date: effectiveDateFrom
          });
      }

      toast({ title: "保存成功" });
      navigate("/dashboard/carrier/customer-pricing");
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/carrier/customer-pricing")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "编辑客户报价" : copyFrom ? "复制客户报价" : "新增客户报价"}
          </h1>
          <p className="text-muted-foreground mt-1">配置客户的详细运费报价</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>客户 *</Label>
              <Select
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_code} - {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>基于账套</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择账套" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用账套</SelectItem>
                  {templates
                    .filter(t => t.carrier === carrier)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>生效日期</Label>
              <Input
                type="date"
                value={effectiveDateFrom}
                onChange={(e) => setEffectiveDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>失效日期</Label>
              <Input
                type="date"
                value={effectiveDateTo}
                onChange={(e) => setEffectiveDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <PricingConfigTabs 
          config={customPrices}
          onChange={setCustomPrices}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/carrier/customer-pricing")}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
