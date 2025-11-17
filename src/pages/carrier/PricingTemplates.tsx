import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingTemplate {
  id: string;
  template_name: string;
  carrier: string;
  description?: string;
  created_at: string;
}

export default function PricingTemplates() {
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PricingTemplate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_name: "",
    carrier: "",
    description: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("pricing_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setTemplates(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTemplate) {
      const { error } = await supabase
        .from("pricing_templates")
        .update(formData)
        .eq("id", editingTemplate.id);

      if (error) {
        toast({ title: "更新失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "更新成功" });
        setIsDialogOpen(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
      }
    } else {
      const { error } = await supabase.from("pricing_templates").insert([formData]);

      if (error) {
        toast({ title: "创建失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "创建成功" });
        setIsDialogOpen(false);
        resetForm();
        fetchTemplates();
      }
    }
  };

  const handleEdit = (template: PricingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      carrier: template.carrier,
      description: template.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此账套？")) return;

    const { error } = await supabase.from("pricing_templates").delete().eq("id", id);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "删除成功" });
      fetchTemplates();
    }
  };

  const resetForm = () => {
    setFormData({
      template_name: "",
      carrier: "",
      description: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">账套管理</h1>
          <p className="text-muted-foreground mt-1">管理不同客户的报价账套</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              新增账套
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "编辑账套" : "新增账套"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>账套名称 *</Label>
                  <Input
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    required
                  />
                </div>
                <div>
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
              </div>
              <div>
                <Label>描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Tabs defaultValue="base">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="base">基础价格</TabsTrigger>
                  <TabsTrigger value="ahs">AHS费用</TabsTrigger>
                  <TabsTrigger value="oversize">超大件</TabsTrigger>
                  <TabsTrigger value="residential">住宅费</TabsTrigger>
                  <TabsTrigger value="remote">偏远地址</TabsTrigger>
                </TabsList>
                <TabsContent value="base" className="space-y-4">
                  <p className="text-sm text-muted-foreground">配置2-8区的基础价格（1-150lbs）</p>
                  {/* 这里可以添加具体的价格配置表单 */}
                </TabsContent>
                <TabsContent value="ahs" className="space-y-4">
                  <p className="text-sm text-muted-foreground">配置AHS-Weight、AHS-Dim、AHS-Packing费用</p>
                </TabsContent>
                <TabsContent value="oversize" className="space-y-4">
                  <p className="text-sm text-muted-foreground">配置超大件商业地址和住宅地址费用</p>
                </TabsContent>
                <TabsContent value="residential" className="space-y-4">
                  <p className="text-sm text-muted-foreground">配置Residential费用（Ground和Home）</p>
                </TabsContent>
                <TabsContent value="remote" className="space-y-4">
                  <p className="text-sm text-muted-foreground">配置DAS、Extend、Remote费用</p>
                </TabsContent>
              </Tabs>

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
              <TableHead>账套名称</TableHead>
              <TableHead>承运商</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.template_name}</TableCell>
                <TableCell>{template.carrier}</TableCell>
                <TableCell>{template.description || "-"}</TableCell>
                <TableCell>{new Date(template.created_at).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
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
