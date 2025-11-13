import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SubAccountManagement = () => {
  const { userRole } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [subAccounts, setSubAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [filterCustomer, setFilterCustomer] = useState("all");

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    status: "active",
    customer_permissions: [] as string[],
    feature_permissions: [] as string[]
  });

  const featureOptions = [
    { id: "dashboard", label: "首页" },
    { id: "orders", label: "订单管理" },
    { id: "finance", label: "财务" },
    { id: "coupons", label: "优惠券" },
    { id: "settings", label: "配置" },
    { id: "tickets", label: "工单" },
    { id: "products", label: "产品" }
  ];

  useEffect(() => {
    if (userRole === "admin") {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, accountsRes] = await Promise.all([
        supabase.from("customers").select("*").order("company_name"),
        supabase.from("sub_accounts").select("*").order("created_at", { ascending: false })
      ]);

      if (customersRes.error) throw customersRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setCustomers(customersRes.data || []);
      setSubAccounts(accountsRes.data || []);
    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.username || !form.email) {
        toast.error("请填写必填项");
        return;
      }

      const accountData = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        customer_permissions: form.customer_permissions,
        feature_permissions: form.feature_permissions
      };

      if (editingAccount) {
        const { error } = await supabase
          .from("sub_accounts")
          .update(accountData)
          .eq("id", editingAccount.id);

        if (error) throw error;
        toast.success("子账号已更新");
      } else {
        if (!form.password || form.password.length < 6) {
          toast.error("密码至少需要6个字符");
          return;
        }

        const { error } = await supabase
          .from("sub_accounts")
          .insert([accountData]);

        if (error) throw error;
        toast.success("子账号已创建");
      }

      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此子账号吗？")) return;

    try {
      const { error } = await supabase
        .from("sub_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("子账号已删除");
      fetchData();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      phone: "",
      role: "",
      password: "",
      status: "active",
      customer_permissions: [],
      feature_permissions: []
    });
    setEditingAccount(null);
  };

  const getCustomerNames = (customerIds: string[]) => {
    if (!customerIds || customerIds.length === 0) return "无";
    return customers
      .filter(c => customerIds.includes(c.id))
      .map(c => c.company_name)
      .join(", ");
  };

  const filteredAccounts = subAccounts.filter(account => {
    if (filterCustomer === "all") return true;
    return account.customer_permissions?.includes(filterCustomer);
  });

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">您没有权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">子账号配置</h1>
          <p className="text-muted-foreground">管理客户下的子账号</p>
        </div>
        <Button onClick={() => { resetForm(); setOpenDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          添加子账号
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              子账号列表
            </span>
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="筛选客户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部客户</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>登录名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>岗位</TableHead>
                  <TableHead>客户权限</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无子账号
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.phone || "-"}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getCustomerNames(account.customer_permissions)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === "active" ? "default" : "secondary"}>
                          {account.status === "active" ? "活跃" : "冻结"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAccount(account);
                              setForm({
                                username: account.username,
                                email: account.email,
                                phone: account.phone || "",
                                role: account.role,
                                password: "",
                                status: account.status,
                                customer_permissions: account.customer_permissions || [],
                                feature_permissions: account.feature_permissions || []
                              });
                              setOpenDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "编辑子账号" : "添加子账号"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>登录名 *</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>邮箱 *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>岗位 *</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="如：客服、销售等"
                />
              </div>
              {!editingAccount && (
                <div className="space-y-2">
                  <Label>密码 *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="frozen">冻结</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">客户权限</h3>
              <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                {customers.map(customer => (
                  <div key={customer.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`customer-${customer.id}`}
                      checked={form.customer_permissions.includes(customer.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm({
                            ...form,
                            customer_permissions: [...form.customer_permissions, customer.id]
                          });
                        } else {
                          setForm({
                            ...form,
                            customer_permissions: form.customer_permissions.filter(id => id !== customer.id)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`customer-${customer.id}`} className="text-sm">
                      {customer.company_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">功能权限</h3>
              <div className="grid grid-cols-2 gap-4">
                {featureOptions.map(feature => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={form.feature_permissions.includes(feature.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm({
                            ...form,
                            feature_permissions: [...form.feature_permissions, feature.id]
                          });
                        } else {
                          setForm({
                            ...form,
                            feature_permissions: form.feature_permissions.filter(id => id !== feature.id)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`feature-${feature.id}`} className="text-sm">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingAccount ? "更新" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubAccountManagement;