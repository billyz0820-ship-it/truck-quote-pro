import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const LogisticsServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    carrier: "",
    service_name: "",
    service_code: "",
    description: ""
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("logistics_services")
        .select("*")
        .order("carrier", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error("加载物流服务失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.carrier || !formData.service_name || !formData.service_code) {
      toast.error("请填写所有必填项");
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from("logistics_services")
          .update(formData)
          .eq("id", editingService.id);
        if (error) throw error;
        toast.success("更新成功");
      } else {
        const { error } = await supabase
          .from("logistics_services")
          .insert(formData);
        if (error) throw error;
        toast.success("添加成功");
      }
      setDialogOpen(false);
      setEditingService(null);
      setFormData({ carrier: "", service_name: "", service_code: "", description: "" });
      fetchServices();
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      carrier: service.carrier,
      service_name: service.service_name,
      service_code: service.service_code,
      description: service.description || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此物流服务吗？")) return;

    try {
      const { error } = await supabase
        .from("logistics_services")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("删除成功");
      fetchServices();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">物流服务</h1>
          <p className="text-muted-foreground">管理承运商的各种物流服务</p>
        </div>
        <Button onClick={() => {
          setEditingService(null);
          setFormData({ carrier: "", service_name: "", service_code: "", description: "" });
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增服务
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>承运商</TableHead>
                <TableHead>服务名称</TableHead>
                <TableHead>服务编码</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.carrier}</TableCell>
                  <TableCell>{service.service_name}</TableCell>
                  <TableCell>{service.service_code}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
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
            <DialogTitle>{editingService ? "编辑服务" : "新增服务"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Select value={formData.carrier} onValueChange={(v) => setFormData({...formData, carrier: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择承运商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="Amazon Shipping">Amazon Shipping</SelectItem>
                  <SelectItem value="OnTrac">OnTrac</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>服务名称 *</Label>
              <Input value={formData.service_name} onChange={(e) => setFormData({...formData, service_name: e.target.value})} placeholder="例: Ground" />
            </div>
            <div className="space-y-2">
              <Label>服务编码 *</Label>
              <Input value={formData.service_code} onChange={(e) => setFormData({...formData, service_code: e.target.value})} placeholder="例: FEDEX_GROUND" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="服务描述" />
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

export default LogisticsServices;
