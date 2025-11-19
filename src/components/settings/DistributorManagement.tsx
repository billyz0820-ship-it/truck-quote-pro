import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Snowflake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Distributor {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  invitation_code: string;
  status: string;
  created_at: string;
}

export default function DistributorManagement() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDistributors(data || []);
    } catch (error: any) {
      toast.error("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationCode = async () => {
    const { data, error } = await supabase.rpc('generate_invitation_code');
    if (error) throw error;
    return data;
  };

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.contact_name || !formData.phone || !formData.email) {
      toast.error("请填写所有必填字段");
      return;
    }

    try {
      if (editingId) {
        // Update existing distributor
        const { error } = await supabase
          .from('distributors')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success("更新成功");
      } else {
        // Create new distributor with auto-generated invitation code
        const invitationCode = await generateInvitationCode();
        const { error } = await supabase
          .from('distributors')
          .insert({
            ...formData,
            invitation_code: invitationCode
          });

        if (error) throw error;
        toast.success("添加成功");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({ company_name: "", contact_name: "", phone: "", email: "" });
      fetchDistributors();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
  };

  const handleEdit = (distributor: Distributor) => {
    setEditingId(distributor.id);
    setFormData({
      company_name: distributor.company_name,
      contact_name: distributor.contact_name,
      phone: distributor.phone,
      email: distributor.email
    });
    setDialogOpen(true);
  };

  const handleFreeze = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
      const { error } = await supabase
        .from('distributors')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(newStatus === 'frozen' ? '已冻结' : '已激活');
      fetchDistributors();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>分销商配置</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ company_name: "", contact_name: "", phone: "", email: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加分销商
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? '编辑分销商' : '添加分销商'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>公司名称 *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label>联系人 *</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>电话 *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>邮箱 *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? '更新' : '添加'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>公司名称</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>邀请码</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">加载中...</TableCell>
              </TableRow>
            ) : distributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">暂无数据</TableCell>
              </TableRow>
            ) : (
              distributors.map((distributor) => (
                <TableRow key={distributor.id}>
                  <TableCell>{distributor.company_name}</TableCell>
                  <TableCell>{distributor.contact_name}</TableCell>
                  <TableCell>{distributor.phone}</TableCell>
                  <TableCell>{distributor.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{distributor.invitation_code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={distributor.status === 'active' ? 'default' : 'secondary'}>
                      {distributor.status === 'active' ? '正常' : '冻结'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(distributor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={distributor.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleFreeze(distributor.id, distributor.status)}
                      >
                        <Snowflake className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}