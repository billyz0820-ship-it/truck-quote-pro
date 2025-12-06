import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MoveUp, MoveDown, X } from "lucide-react";
import { RuleConditionBuilder } from "@/components/carrier/RuleConditionBuilder";

export default function ShippingRules() {
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleName, setRuleName] = useState("");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [primaryAccountId, setPrimaryAccountId] = useState<string>("");
  const [fallbackAccounts, setFallbackAccounts] = useState<Array<{ id: string; priority: number }>>([]);
  const [conditions, setConditions] = useState<any>({
    id: "root",
    operator: "AND",
    conditions: [],
    groups: [],
  });

  useEffect(() => {
    fetchRules();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data } = await supabase.from("carrier_accounts").select("*").eq("status", "active").order("account_name");
    if (data) setAccounts(data);
  };

  const fetchRules = async () => {
    const { data, error } = await supabase.from("shipping_rules").select("*").order("priority", { ascending: true });
    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setRules(data || []);
    }
  };

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.rule_name);
      setPriority(rule.priority);
      setIsActive(rule.is_active);
      setPrimaryAccountId(rule.primary_account_id || "");
      setFallbackAccounts(rule.fallback_accounts || []);
      setConditions(rule.conditions || { id: "root", operator: "AND", conditions: [], groups: [] });
    } else {
      setEditingRule(null);
      setRuleName("");
      setPriority(rules.length);
      setIsActive(true);
      setPrimaryAccountId("");
      setFallbackAccounts([]);
      setConditions({ id: "root", operator: "AND", conditions: [], groups: [] });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!ruleName || !primaryAccountId) {
      toast({ title: "请输入规则名称并选择主账号", variant: "destructive" });
      return;
    }

    const data = {
      rule_name: ruleName,
      priority,
      is_active: isActive,
      primary_account_id: primaryAccountId,
      fallback_accounts: fallbackAccounts,
      conditions,
    };

    let error;
    if (editingRule) {
      ({ error } = await supabase.from("shipping_rules").update(data).eq("id", editingRule.id));
    } else {
      ({ error } = await supabase.from("shipping_rules").insert(data));
    }

    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "保存成功" });
      setIsDialogOpen(false);
      fetchRules();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此规则？")) return;
    const { error } = await supabase.from("shipping_rules").delete().eq("id", id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "删除成功" });
      fetchRules();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("shipping_rules").update({ is_active: !isActive }).eq("id", id);
    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "状态已更新" });
      fetchRules();
    }
  };

  const addFallbackAccount = () => {
    setFallbackAccounts([...fallbackAccounts, { id: "", priority: fallbackAccounts.length + 1 }]);
  };

  const removeFallbackAccount = (index: number) => {
    setFallbackAccounts(fallbackAccounts.filter((_, i) => i !== index));
  };

  const updateFallbackAccount = (index: number, accountId: string) => {
    const updated = [...fallbackAccounts];
    updated[index].id = accountId;
    setFallbackAccounts(updated);
  };

  const moveFallbackAccount = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fallbackAccounts.length) return;
    const updated = [...fallbackAccounts];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated[index].priority = index + 1;
    updated[newIndex].priority = newIndex + 1;
    setFallbackAccounts(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">打单规则</h1>
          <p className="text-muted-foreground">配置自动打单规则和账号优先级</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          新增规则
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => {
          const primaryAccount = accounts.find(a => a.id === rule.primary_account_id);
          const fallbacks = (rule.fallback_accounts || []).map((fb: any) => accounts.find(a => a.id === fb.id)).filter(Boolean);
          return (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <CardTitle>{rule.rule_name}</CardTitle>
                  <Badge variant="outline">优先级 {rule.priority}</Badge>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "启用" : "禁用"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(rule.id, rule.is_active)}>{rule.is_active ? "禁用" : "启用"}</Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(rule)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">主账号：</span>
                    <Badge variant="secondary">{primaryAccount?.account_name || "未设置"}</Badge>
                  </div>
                  {fallbacks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">备用账号：</span>
                      <div className="flex gap-1">
                        {fallbacks.map((account: any, idx: number) => (
                          <Badge key={idx} variant="outline">{idx + 1}. {account.account_name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRule ? "编辑规则" : "新增规则"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>规则名称 *</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>优先级</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value))} placeholder="数字越小优先级越高" />
              </div>
              <div className="flex items-center justify-between">
                <Label>启用规则</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">账号配置</h3>
              <div className="space-y-2">
                <Label>主账号 *</Label>
                <Select value={primaryAccountId} onValueChange={setPrimaryAccountId}>
                  <SelectTrigger><SelectValue placeholder="选择主打单账号" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.account_name} ({account.carrier})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">优先使用此账号进行打单</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>备用账号</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFallbackAccount}>
                    <Plus className="h-3 w-3 mr-1" />添加备用账号
                  </Button>
                </div>
                {fallbackAccounts.length > 0 && (
                  <div className="space-y-2">
                    {fallbackAccounts.map((fallback, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-8 justify-center">{index + 1}</Badge>
                        <Select value={fallback.id} onValueChange={(val) => updateFallbackAccount(index, val)}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="选择备用账号" /></SelectTrigger>
                          <SelectContent>
                            {accounts.filter(a => a.id !== primaryAccountId).map((account) => (
                              <SelectItem key={account.id} value={account.id}>{account.account_name} ({account.carrier})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => moveFallbackAccount(index, "up")}><MoveUp className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="sm" disabled={index === fallbackAccounts.length - 1} onClick={() => moveFallbackAccount(index, "down")}><MoveDown className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFallbackAccount(index)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">主账号失败时，按顺序尝试备用账号</p>
              </div>
            </div>
            <RuleConditionBuilder value={conditions} onChange={setConditions} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存规则</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
