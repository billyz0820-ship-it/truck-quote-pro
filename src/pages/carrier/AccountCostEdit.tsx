import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, DollarSign } from "lucide-react";
import { PricingConfigTabs } from "@/components/carrier/PricingConfigTabs";
import { useTab } from "@/contexts/TabContext";

export default function AccountCostEdit() {
  const { openTab, closeTab } = useTab();
  const { accountId, costId } = useParams();
  const { toast } = useToast();
  const isEditing = !!costId;
  
  const currentTabId = `/dashboard/carrier/costs${accountId ? `/${accountId}` : '/new'}${costId ? `/${costId}` : ''}`.replace(/\//g, "-");
  
  const handleGoBack = () => {
    closeTab(currentTabId);
    openTab({
      title: "账号成本",
      path: "/dashboard/carrier/costs",
      icon: DollarSign,
    });
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState(accountId || "");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [pricingConfig, setPricingConfig] = useState<any>({});

  useEffect(() => {
    fetchAccounts();
    if (costId) {
      fetchCost();
    }
  }, [costId]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from("carrier_accounts").select("*").eq("status", "active").order("account_name");
    if (data) setAccounts(data);
  };

  const fetchCost = async () => {
    if (!costId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("carrier_account_costs")
      .select("*")
      .eq("id", costId)
      .single();

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
      handleGoBack();
    } else if (data) {
      setSelectedAccount(data.account_id);
      setEffectiveDate(data.effective_date);
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
    
    if (!selectedAccount || !effectiveDate) {
      toast({ title: "请选择账号和有效日期", variant: "destructive" });
      return;
    }

    setSaving(true);

    const dataToSubmit = {
      account_id: selectedAccount,
      effective_date: effectiveDate,
      base_prices: pricingConfig.base_prices || {},
      ahs_weight: pricingConfig.ahs_weight || {},
      ahs_dim: pricingConfig.ahs_dim || {},
      ahs_packing: pricingConfig.ahs_packing || {},
      oversize_commercial: pricingConfig.oversize_commercial || {},
      oversize_residential: pricingConfig.oversize_residential || {},
      residential_fees: pricingConfig.residential_fees || {},
      remote_area_fees: pricingConfig.remote_area_fees || {},
      dim_factor: pricingConfig.dim_factor || null,
      fuel_charge: pricingConfig.fuel_charge || null,
      unauthorized_fee: pricingConfig.unauthorized_fee || null,
      peak_surcharges: pricingConfig.peak_surcharges || {},
      signature_services: pricingConfig.signature_services || {},
      delivery_intercept_fee: pricingConfig.delivery_intercept_fee || null,
      address_correction_fee: pricingConfig.address_correction_fee || null,
      dangerous_goods_fee: pricingConfig.dangerous_goods_fee || null,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("carrier_account_costs")
          .update(dataToSubmit)
          .eq("id", costId);

        if (error) throw error;
        toast({ title: "更新成功" });
      } else {
        const { error } = await supabase
          .from("carrier_account_costs")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({ title: "创建成功" });
      }
      handleGoBack();
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

  const selectedAccountInfo = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "编辑账号成本" : "配置账号成本"}</h1>
          <p className="text-muted-foreground mt-1">配置快递账号的成本价格信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>快递账号 *</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                disabled={!!accountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择快递账号" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.carrier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>有效日期 *</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">每次价格调整都会创建新的历史版本</p>
            </div>
            {selectedAccountInfo && (
              <div className="col-span-2 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">账号名称：</span>
                    <span className="font-medium ml-2">{selectedAccountInfo.account_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">承运商：</span>
                    <span className="font-medium ml-2">{selectedAccountInfo.carrier}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">账号编号：</span>
                    <span className="font-medium ml-2">{selectedAccountInfo.account_number}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PricingConfigTabs 
          config={pricingConfig}
          onChange={setPricingConfig}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleGoBack}>
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
