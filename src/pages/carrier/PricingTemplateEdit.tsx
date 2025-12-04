import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function PricingTemplateEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    template_name: "",
    carrier: "",
    description: "",
  });
  const [pricingConfig, setPricingConfig] = useState<any>({});

  useEffect(() => {
    if (isEditing) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
      navigate("/dashboard/carrier/templates");
    } else if (data) {
      setFormData({
        template_name: data.template_name,
        carrier: data.carrier,
        description: data.description || "",
      });
      setPricingConfig({
        base_prices: data.base_prices,
        ahs_weight: data.ahs_weight,
        ahs_dim: data.ahs_dim,
        ahs_packing: data.ahs_packing,
        oversize_commercial: data.oversize_commercial,
        oversize_residential: data.oversize_residential,
        residential_fees: data.residential_fees,
        remote_area_fees: data.remote_area_fees,
        peak_surcharges: data.peak_surcharges,
        dim_factor: data.dim_factor,
        fuel_charge: data.fuel_charge,
        unauthorized_fee: data.unauthorized_fee,
        signature_services: data.signature_services,
        delivery_intercept_fee: data.delivery_intercept_fee,
        address_correction_fee: data.address_correction_fee,
        dangerous_goods_fee: data.dangerous_goods_fee,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSubmit = {
      ...formData,
      ...pricingConfig,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("pricing_templates")
          .update(dataToSubmit)
          .eq("id", id);

        if (error) throw error;
        toast({ title: "更新成功" });
      } else {
        const { error } = await supabase
          .from("pricing_templates")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({ title: "创建成功" });
      }
      navigate("/dashboard/carrier/templates");
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
        <Button variant="ghost" onClick={() => navigate("/dashboard/carrier/templates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "编辑账套" : "新增账套"}</h1>
          <p className="text-muted-foreground mt-1">配置账套的详细报价信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>账套名称 *</Label>
              <Input
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Select
                value={formData.carrier}
                onValueChange={(value) => setFormData({ ...formData, carrier: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择承运商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <PricingConfigTabs 
          config={pricingConfig}
          onChange={setPricingConfig}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/carrier/templates")}>
            取消
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
