import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ChannelConfigs = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    warehouse: "",
    carrier: "",
    logistics_service: "",
    platform: "",
    channel_code: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configsRes, customersRes] = await Promise.all([
        supabase.from("channel_configs").select("*, customers(company_name)").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, company_name, customer_code")
      ]);

      if (configsRes.error) throw configsRes.error;
      if (customersRes.error) throw customersRes.error;

      setConfigs(configsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.customer_id || !formData.warehouse || !formData.carrier || !formData.logistics_service || !formData.platform || !formData.channel_code) {
      toast.error("请填写所有必填项");
      return;
    }

    try {
      if (editingConfig) {
        const { error } = await supabase
          .from("channel_configs")
          .update(formData)
          .eq("id", editingConfig.id);
        if (error) throw error;
        toast.success("更新成功");
      } else {
        const { error } = await supabase
          .from("channel_configs")
          .insert(formData);
        if (error) throw error;
        toast.success("添加成功");
      }
      setDialogOpen(false);
      setEditingConfig(null);
      setFormData({ customer_id: "", warehouse: "", carrier: "", logistics_service: "", platform: "", channel_code: "" });
      fetchData();
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      customer_id: config.customer_id,
      warehouse: config.warehouse,
      carrier: config.carrier,
      logistics_service: config.logistics_service,
      platform: config.platform,
      channel_code: config.channel_code
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此渠道配置吗？")) return;

    try {
      const { error } = await supabase
        .from("channel_configs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("删除成功");
      fetchData();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">渠道配置</h1>
          <p className="text-muted-foreground">管理三方渠道编码配置</p>
        </div>
        <Button onClick={() => {
          setEditingConfig(null);
          setFormData({ customer_id: "", warehouse: "", carrier: "", logistics_service: "", platform: "", channel_code: "" });
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增配置
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户</TableHead>
                <TableHead>仓库</TableHead>
                <TableHead>承运商</TableHead>
                <TableHead>物流服务</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>三方渠道编码</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>{config.customers?.company_name}</TableCell>
                  <TableCell>{config.warehouse}</TableCell>
                  <TableCell>{config.carrier}</TableCell>
                  <TableCell>{config.logistics_service}</TableCell>
                  <TableCell>{config.platform}</TableCell>
                  <TableCell className="font-mono">{config.channel_code}</TableCell>
                  <TableCell>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? "编辑配置" : "新增配置"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>客户 *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name} ({c.customer_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>仓库 *</Label>
              <Input value={formData.warehouse} onChange={(e) => setFormData({...formData, warehouse: e.target.value})} placeholder="例: 西仓" />
            </div>
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Input value={formData.carrier} onChange={(e) => setFormData({...formData, carrier: e.target.value})} placeholder="例: FedEx" />
            </div>
            <div className="space-y-2">
              <Label>物流服务 *</Label>
              <Input value={formData.logistics_service} onChange={(e) => setFormData({...formData, logistics_service: e.target.value})} placeholder="例: Ground" />
            </div>
            <div className="space-y-2">
              <Label>平台 *</Label>
              <Input value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} placeholder="例: Amazon" />
            </div>
            <div className="space-y-2">
              <Label>三方渠道编码 *</Label>
              <Input value={formData.channel_code} onChange={(e) => setFormData({...formData, channel_code: e.target.value})} placeholder="例: FX_GND_US" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelConfigs;
