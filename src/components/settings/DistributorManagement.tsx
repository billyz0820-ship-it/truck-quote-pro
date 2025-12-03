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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Distributor {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  invitation_code: string;
  status: string;
  truck_commission_rate: number | null;
  express_commission_rate: number | null;
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
    email: "",
    truck_commission_rate: 0,
    express_commission_rate: 0
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
        const { error } = await supabase
          .from('distributors')
          .update({
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            phone: formData.phone,
            email: formData.email,
            truck_commission_rate: formData.truck_commission_rate,
            express_commission_rate: formData.express_commission_rate
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success("更新成功");
      } else {
        const invitationCode = await generateInvitationCode();
        const { error } = await supabase
          .from('distributors')
          .insert({
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            phone: formData.phone,
            email: formData.email,
            truck_commission_rate: formData.truck_commission_rate,
            express_commission_rate: formData.express_commission_rate,
            invitation_code: invitationCode
          });

        if (error) throw error;
        toast.success("添加成功");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({ company_name: "", contact_name: "", phone: "", email: "", truck_commission_rate: 0, express_commission_rate: 0 });
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
      email: distributor.email,
      truck_commission_rate: distributor.truck_commission_rate || 0,
      express_commission_rate: distributor.express_commission_rate || 0
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
            setFormData({ company_name: "", contact_name: "", phone: "", email: "", truck_commission_rate: 0, express_commission_rate: 0 });
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>卡车订单提成比例 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.truck_commission_rate}
                    onChange={(e) => setFormData({ ...formData, truck_commission_rate: Number(e.target.value) })}
                    placeholder="按利润百分比"
                  />
                  <p className="text-xs text-muted-foreground mt-1">按每单利润计算</p>
                </div>
                <div>
                  <Label>快递订单提成比例 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.express_commission_rate}
                    onChange={(e) => setFormData({ ...formData, express_commission_rate: Number(e.target.value) })}
                    placeholder="按利润百分比"
                  />
                  <p className="text-xs text-muted-foreground mt-1">按每单利润计算</p>
                </div>
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
              <TableHead>卡车提成</TableHead>
              <TableHead>快递提成</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">加载中...</TableCell>
              </TableRow>
            ) : distributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">暂无数据</TableCell>
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
                  <TableCell>{distributor.truck_commission_rate || 0}%</TableCell>
                  <TableCell>{distributor.express_commission_rate || 0}%</TableCell>
                  <TableCell>
                    <Badge variant={distributor.status === 'active' ? 'default' : 'secondary'}>
                      {distributor.status === 'active' ? '正常' : '冻结'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(distributor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={distributor.status === 'active' ? 'destructive' : 'default'}
                            onClick={() => handleFreeze(distributor.id, distributor.status)}
                          >
                            <Snowflake className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{distributor.status === 'active' ? '冻结' : '激活'}</TooltipContent>
                      </Tooltip>
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
