import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Agreement {
  id: string;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AgreementManagement = () => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    version: "1.0",
    is_active: true
  });

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("获取协议列表失败");
    } else {
      setAgreements(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("请填写必填字段");
      return;
    }

    if (editingAgreement) {
      const { error } = await supabase
        .from("agreements")
        .update({
          title: formData.title,
          content: formData.content,
          version: formData.version,
          is_active: formData.is_active
        })
        .eq("id", editingAgreement.id);

      if (error) {
        toast.error("更新协议失败");
      } else {
        toast.success("协议已更新");
        fetchAgreements();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("agreements")
        .insert({
          ...formData,
          created_by: user?.id
        });

      if (error) {
        toast.error("创建协议失败: " + error.message);
      } else {
        toast.success("协议已创建");
        fetchAgreements();
        setDialogOpen(false);
      }
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此协议吗？")) return;
    
    const { error } = await supabase
      .from("agreements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("删除失败");
    } else {
      toast.success("协议已删除");
      fetchAgreements();
    }
  };

  const toggleActive = async (agreement: Agreement) => {
    const { error } = await supabase
      .from("agreements")
      .update({ is_active: !agreement.is_active })
      .eq("id", agreement.id);

    if (error) {
      toast.error("更新状态失败");
    } else {
      fetchAgreements();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      version: "1.0",
      is_active: true
    });
    setEditingAgreement(null);
  };

  const openEditDialog = (agreement: Agreement) => {
    setEditingAgreement(agreement);
    setFormData({
      title: agreement.title,
      content: agreement.content,
      version: agreement.version,
      is_active: agreement.is_active
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">协议管理</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新增协议
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAgreement ? "编辑协议" : "新增协议"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>协议标题 *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="如：服务协议、隐私政策"
                  />
                </div>
                <div className="space-y-2">
                  <Label>版本号</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>协议内容 *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="输入协议内容..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>启用此协议</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit}>保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">协议列表</CardTitle>
          <p className="text-sm text-muted-foreground">客户在首次下单时需要同意启用的协议</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>协议标题</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">加载中...</TableCell>
                </TableRow>
              ) : agreements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无协议，请点击"新增协议"创建
                  </TableCell>
                </TableRow>
              ) : (
                agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.title}</TableCell>
                    <TableCell>v{agreement.version}</TableCell>
                    <TableCell>
                      <Badge variant={agreement.is_active ? "default" : "secondary"}>
                        {agreement.is_active ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(agreement.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(agreement.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setViewingAgreement(agreement);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(agreement)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>编辑</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(agreement.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Agreement Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingAgreement?.title} (v{viewingAgreement?.version})</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {viewingAgreement?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgreementManagement;