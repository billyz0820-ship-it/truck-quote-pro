import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronDown, ChevronUp, DollarSign, Edit } from "lucide-react";
import { useTab } from "@/contexts/TabContext";

export default function AccountCosts() {
  const { toast } = useToast();
  const { openTab } = useTab();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<string | false>(false);

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

  const handleOpenCostEdit = (accountId: string, costId?: string) => {
    const account = accounts.find(a => a.id === accountId);
    const path = costId 
      ? `/dashboard/carrier/costs/${accountId}/${costId}`
      : `/dashboard/carrier/costs/${accountId}/new`;
    openTab({
      title: costId ? `编辑成本 - ${account?.account_name}` : `配置成本 - ${account?.account_name}`,
      path,
      icon: DollarSign,
    });
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
                  <Button variant="outline" size="sm" onClick={() => handleOpenCostEdit(account.id)}>
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
                            <Button variant="ghost" size="sm" onClick={() => handleOpenCostEdit(account.id, cost.id)}>
                              <Edit className="h-4 w-4 mr-1" />
                              查看/编辑
                            </Button>
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
    </div>
  );
}
