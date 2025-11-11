import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EmailManagement = () => {
  const { userRole, customerId } = useAuth();
  const [emailBindings, setEmailBindings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  
  const [form, setForm] = useState({
    customer_id: "",
    email: "",
    email_type: "primary"
  });

  useEffect(() => {
    fetchEmailBindings();
    if (userRole === "admin") {
      fetchCustomers();
    }
  }, [userRole]);

  const fetchEmailBindings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("email_bindings")
        .select("*, customers(company_name)")
        .order("created_at", { ascending: false });

      if (userRole !== "admin" && customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEmailBindings(data || []);
    } catch (error: any) {
      toast.error("加载邮件绑定失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error("加载客户失败: " + error.message);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from("email_bindings")
        .insert([{
          customer_id: userRole === "admin" ? form.customer_id : customerId,
          email: form.email,
          email_type: form.email_type,
          enabled: true
        }]);

      if (error) throw error;

      toast.success("邮件已绑定");
      setOpenDialog(false);
      resetForm();
      fetchEmailBindings();
    } catch (error: any) {
      toast.error("绑定邮件失败: " + error.message);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("email_bindings")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;

      toast.success(enabled ? "邮件通知已启用" : "邮件通知已禁用");
      fetchEmailBindings();
    } catch (error: any) {
      toast.error("更新失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此邮件绑定吗？")) return;

    try {
      const { error } = await supabase
        .from("email_bindings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("邮件绑定已删除");
      fetchEmailBindings();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      email: "",
      email_type: "primary"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">邮件管理</h1>
          <p className="text-muted-foreground">管理邮件通知绑定</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              绑定邮箱
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定邮箱</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label>客户</Label>
                  <Select
                    value={form.customer_id}
                    onValueChange={(value) => setForm({ ...form, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>邮箱地址</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>邮件类型</Label>
                <Select
                  value={form.email_type}
                  onValueChange={(value) => setForm({ ...form, email_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">主邮箱</SelectItem>
                    <SelectItem value="shipping">发货通知</SelectItem>
                    <SelectItem value="billing">账单通知</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAdd}>
                  绑定
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>邮件绑定列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole === "admin" && <TableHead>客户</TableHead>}
                  <TableHead>邮箱地址</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailBindings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无邮件绑定
                    </TableCell>
                  </TableRow>
                ) : (
                  emailBindings.map((binding) => (
                    <TableRow key={binding.id}>
                      {userRole === "admin" && <TableCell>{binding.customers?.company_name}</TableCell>}
                      <TableCell className="font-medium">{binding.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {binding.email_type === "primary" ? "主邮箱" : 
                           binding.email_type === "shipping" ? "发货通知" : "账单通知"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={binding.enabled}
                            onCheckedChange={(checked) => handleToggle(binding.id, checked)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {binding.enabled ? "已启用" : "已禁用"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(binding.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>邮件通知说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <h4 className="font-medium">发货通知</h4>
            <p className="text-sm text-muted-foreground">当订单状态变为"已发货"时，实时发送邮件通知</p>
          </div>
          <div>
            <h4 className="font-medium">账单通知</h4>
            <p className="text-sm text-muted-foreground">每天早上9点发送前一天创建的补费记录</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailManagement;