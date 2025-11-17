import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { PricingConfigTabs } from "@/components/carrier/PricingConfigTabs";

export default function AccountCosts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedCostId, setSelectedCostId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState<string | false>(false);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [prices, setPrices] = useState<any>({});

  useEffect(() => {
    fetchAccounts();
    fetchCosts();
  }, []);

  const fetchAccounts = async () => {
    const { data } = await supabase.from("carrier_accounts").select("*").eq("status", "active").order("account_name");
    if (data) setAccounts(data);
  };

  const fetchCosts = async () => {
    const { data } = await supabase.from("carrier_account_costs").select("*").order("effective_date", { ascending: false });
    if (data) setCosts(data);
  };

  const handleOpenDialog = (accountId?: string, costId?: string) => {
    if (accountId) {
      setSelectedAccount(accountId);
      setSelectedCostId(costId || null);
      const existingCost = costId ? costs.find((c) => c.id === costId) : costs.find((c) => c.account_id === accountId);
      if (existingCost) {
        setEffectiveDate(existingCost.effective_date);
        setPrices(existingCost);
      }
    } else {
      setSelectedAccount("");
      setSelectedCostId(null);
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      setPrices({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedAccount || !effectiveDate) {
      toast({ title: "请选择账号和有效日期", variant: "destructive" });
      return;
    }

    const data = {
      account_id: selectedAccount,
      effective_date: effectiveDate,
      base_prices: prices.base_prices || {},
      ahs_weight: prices.ahs_weight || {},
      ahs_dim: prices.ahs_dim || {},
      ahs_packing: prices.ahs_packing || {},
      oversize_commercial: prices.oversize_commercial || {},
      oversize_residential: prices.oversize_residential || {},
      residential_fees: prices.residential_fees || {},
      remote_area_fees: prices.remote_area_fees || {},
      dim_factor: prices.dim_factor || null,
      fuel_charge: prices.fuel_charge || null,
      unauthorized_fee: prices.unauthorized_fee || null,
      peak_surcharges: prices.peak_surcharges || {},
    };

    let error;
    if (selectedCostId) {
      ({ error } = await supabase.from("carrier_account_costs").update(data).eq("id", selectedCostId));
    } else {
      ({ error } = await supabase.from("carrier_account_costs").insert(data));
    }

    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "保存成功" });
      setIsDialogOpen(false);
      fetchCosts();
    }
  };

  const getAccountCostHistory = (accountId: string) => {
    return costs.filter(c => c.account_id === accountId).sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">账号成本维护</h1>
        <p className="text-muted-foreground">配置快递账号的成本价格，支持历史版本管理</p>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => {
          const accountCosts = getAccountCostHistory(account.id);
          const latestCost = accountCosts[0];
          return (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{account.account_name} ({account.carrier})</CardTitle>
                <div className="flex gap-2">
                  {accountCosts.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setShowHistory(showHistory === account.id ? false : account.id)}>
                      {showHistory === account.id ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      历史版本 ({accountCosts.length})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(account.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {latestCost ? "新增版本" : "配置成本"}
                  </Button>
                </div>
              </CardHeader>
              {latestCost && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">有效日期：</span><span className="font-medium ml-2">{latestCost.effective_date}</span></div>
                    <div><span className="text-muted-foreground">体积除数：</span><span className="font-medium ml-2">{latestCost.dim_factor}</span></div>
                    <div><span className="text-muted-foreground">燃油附加费：</span><span className="font-medium ml-2">{latestCost.fuel_charge}%</span></div>
                    <div><span className="text-muted-foreground">更新时间：</span><span className="font-medium ml-2">{new Date(latestCost.updated_at).toLocaleDateString()}</span></div>
                  </div>
                  {showHistory === account.id && accountCosts.length > 1 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">历史版本</h4>
                      <div className="space-y-2">
                        {accountCosts.slice(1).map((cost) => (
                          <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="grid grid-cols-4 gap-4 text-sm flex-1">
                              <div><span className="text-muted-foreground">有效日期：</span><span className="ml-2">{cost.effective_date}</span></div>
                              <div><span className="text-muted-foreground">体积除数：</span><span className="ml-2">{cost.dim_factor}</span></div>
                              <div><span className="text-muted-foreground">燃油附加费：</span><span className="ml-2">{cost.fuel_charge}%</span></div>
                              <div><span className="text-muted-foreground">更新时间：</span><span className="ml-2">{new Date(cost.updated_at).toLocaleDateString()}</span></div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(account.id, cost.id)}>查看/编辑</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>配置账号成本</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>有效日期 *</Label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
              <p className="text-sm text-muted-foreground">每次价格调整都会创建新的历史版本</p>
            </div>
            <PricingConfigTabs config={prices} onChange={setPrices} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存配置</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
