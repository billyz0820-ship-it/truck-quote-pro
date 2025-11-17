import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ShippingRule {
  id: string;
  rule_name: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export default function ShippingRules() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    rule_name: "",
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from("shipping_rules")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setRules(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRule) {
      const { error } = await supabase
        .from("shipping_rules")
        .update(formData)
        .eq("id", editingRule.id);

      if (error) {
        toast({ title: "更新失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "更新成功" });
        setIsDialogOpen(false);
        setEditingRule(null);
        resetForm();
        fetchRules();
      }
    } else {
      const { error } = await supabase.from("shipping_rules").insert([formData]);

      if (error) {
        toast({ title: "创建失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "创建成功" });
        setIsDialogOpen(false);
        resetForm();
        fetchRules();
      }
    }
  };

  const handleEdit = (rule: ShippingRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      priority: rule.priority,
      is_active: rule.is_active,
    });
    setIsDialogOpen(true);
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
    const { error } = await supabase
      .from("shipping_rules")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "状态已更新" });
      fetchRules();
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: "",
      priority: 0,
      is_active: true,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">打单规则</h1>
          <p className="text-muted-foreground mt-1">配置自动打单规则和账号优先级</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRule(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              新增规则
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "编辑规则" : "新增规则"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>规则名称 *</Label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>优先级</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>启用规则</Label>
              </div>
              <div className="space-y-2">
                <Label>规则条件</Label>
                <p className="text-sm text-muted-foreground">
                  配置规则条件：客户、仓库、服务类型等，支持使用与、或、包含、不包含等逻辑
                </p>
                {/* 这里可以添加更复杂的条件配置界面 */}
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>优先级</TableHead>
              <TableHead>规则名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.priority}</TableCell>
                <TableCell className="font-medium">{rule.rule_name}</TableCell>
                <TableCell>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "启用" : "禁用"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(rule.created_at).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule.id, rule.is_active)}
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
