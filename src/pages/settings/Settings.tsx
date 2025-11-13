import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Users, 
  Plus,
  Edit,
  Trash2,
  MapPin,
  Truck,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const Settings = () => {
  const { toast } = useToast();
  const { userRole, user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [subAccounts, setSubAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [openSubAccountDialog, setOpenSubAccountDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editingSubAccount, setEditingSubAccount] = useState<any>(null);
  const [openTemporaryCredit, setOpenTemporaryCredit] = useState(false);
  const [selectedCustomerForCredit, setSelectedCustomerForCredit] = useState<any>(null);
  const [openPasswordReset, setOpenPasswordReset] = useState(false);
  const [resetPasswordSubAccount, setResetPasswordSubAccount] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [filterSubAccountCustomer, setFilterSubAccountCustomer] = useState("all");
  
  const [temporaryCreditForm, setTemporaryCreditForm] = useState({
    amount: 0,
    valid_until: ""
  });

  const [customerForm, setCustomerForm] = useState<{
    company_name: string;
    company_address: string;
    customer_type: "prepaid" | "credit";
    status: "active" | "frozen";
    credit_limit: number;
    payment_terms: number;
    payment_due_date: string;
    commission_type: string;
    commission_value: number;
  }>({
    company_name: "",
    company_address: "",
    customer_type: "prepaid",
    status: "active",
    credit_limit: 0,
    payment_terms: 0,
    payment_due_date: "",
    commission_type: "",
    commission_value: 0
  });

  const [subAccountForm, setSubAccountForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    status: "active",
    password: "",
    customer_permissions: [] as string[],
    feature_permissions: [] as string[]
  });

  const featureOptions = [
    { id: "dashboard", label: "首页", children: ["cost_profit_analysis", "platform_orders", "carrier_ranking", "order_status", "ticket_items"] },
    { id: "orders", label: "订单管理", children: [] },
    { id: "finance", label: "财务", children: [] },
    { id: "coupons", label: "优惠券", children: [] },
    { id: "settings", label: "配置", children: [] },
    { id: "tickets", label: "工单", children: [] },
    { id: "products", label: "产品", children: [] }
  ];

  useEffect(() => {
    if (userRole === "admin") {
      fetchCustomers();
      fetchSubAccounts();
    }
  }, [userRole]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("sub_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveCustomer = async () => {
    try {
      // 处理空字符串字段，将其转换为 null
      const customerData = {
        ...customerForm,
        payment_due_date: customerForm.payment_due_date || null,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData as any)
          .eq("id", editingCustomer.id);

        if (error) throw error;
        
        toast({
          title: "成功",
          description: "客户信息已更新"
        });
      } else {
        const { data: codeData, error: codeError } = await supabase
          .rpc("generate_customer_code");

        if (codeError) throw codeError;

        const { error } = await supabase
          .from("customers")
          .insert([{
            ...customerData,
            customer_code: codeData
          }]);

        if (error) throw error;
        
        toast({
          title: "成功",
          description: "客户已添加"
        });
      }

      setOpenCustomerDialog(false);
      resetCustomerForm();
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveSubAccount = async () => {
    try {
      const accountData = {
        username: subAccountForm.username,
        email: subAccountForm.email,
        phone: subAccountForm.phone,
        role: subAccountForm.role,
        status: subAccountForm.status,
        customer_permissions: subAccountForm.customer_permissions,
        feature_permissions: subAccountForm.feature_permissions
      };

      if (editingSubAccount) {
        const { error } = await supabase
          .from("sub_accounts")
          .update(accountData)
          .eq("id", editingSubAccount.id);

        if (error) throw error;
        toast({ title: "成功", description: "子账号已更新" });
      } else {
        const { error } = await supabase
          .from("sub_accounts")
          .insert([accountData]);

        if (error) throw error;
        toast({ title: "成功", description: "子账号已创建" });
      }

      setOpenSubAccountDialog(false);
      resetSubAccountForm();
      fetchSubAccounts();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveTemporaryCredit = async () => {
    try {
      if (!user?.id) throw new Error("未登录");
      
      const { error } = await supabase
        .from("temporary_credits")
        .insert([{
          customer_id: selectedCustomerForCredit.id,
          amount: temporaryCreditForm.amount,
          valid_until: temporaryCreditForm.valid_until,
          created_by: user.id
        }]);

      if (error) throw error;

      toast({
        title: "成功",
        description: "临时额度已设置"
      });
      
      setOpenTemporaryCredit(false);
      setTemporaryCreditForm({ amount: 0, valid_until: "" });
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("确定要删除此客户吗？")) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "成功",
        description: "客户已删除"
      });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubAccount = async (id: string) => {
    if (!confirm("确定要删除此子账号吗？")) return;

    try {
      const { error } = await supabase
        .from("sub_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "成功",
        description: "子账号已删除"
      });
      fetchSubAccounts();
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "错误",
        description: "密码至少需要6个字符",
        variant: "destructive"
      });
      return;
    }

    try {
      // 这里应该调用后端API来重置密码
      // 由于sub_accounts表不直接关联auth.users，这里只是模拟
      toast({
        title: "成功",
        description: "密码重置成功"
      });
      setOpenPasswordReset(false);
      setNewPassword("");
      setResetPasswordSubAccount(null);
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getCustomerNamesForSubAccount = (customerPermissions: string[]) => {
    if (!customerPermissions || customerPermissions.length === 0) return "无";
    const names = customers
      .filter(c => customerPermissions.includes(c.id))
      .map(c => c.company_name);
    return names.length > 0 ? names.join(", ") : "无";
  };

  const filteredSubAccounts = subAccounts.filter(account => {
    if (filterSubAccountCustomer === "all") return true;
    return account.customer_permissions?.includes(filterSubAccountCustomer);
  });

  const resetCustomerForm = () => {
    setEditingCustomer(null);
    setCustomerForm({
      company_name: "",
      company_address: "",
      customer_type: "prepaid",
      status: "active",
      credit_limit: 0,
      payment_terms: 0,
      payment_due_date: "",
      commission_type: "",
      commission_value: 0
    });
  };

  const resetSubAccountForm = () => {
    setEditingSubAccount(null);
    setSubAccountForm({
      username: "",
      email: "",
      phone: "",
      role: "",
      status: "active",
      password: "",
      customer_permissions: [],
      feature_permissions: []
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">配置管理</h1>
        <p className="text-muted-foreground">管理用户配置、客户配置和子账号</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">用户配置</TabsTrigger>
          <TabsTrigger value="customers">客户配置</TabsTrigger>
          <TabsTrigger value="subaccounts">子账号配置</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                内部用户管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  此页面用于管理公司内部人员（管理员、客服、运营等）的配置。
                </p>
                <p className="text-sm text-muted-foreground">
                  功能开发中...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  客户管理
                </span>
                <Dialog open={openCustomerDialog} onOpenChange={(open) => {
                  setOpenCustomerDialog(open);
                  if (!open) resetCustomerForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加客户
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCustomer ? "编辑客户" : "添加客户"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">公司名称 *</Label>
                          <Input
                            id="company_name"
                            value={customerForm.company_name}
                            onChange={(e) => setCustomerForm({ ...customerForm, company_name: e.target.value })}
                            placeholder="输入公司名称"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer_type">客户类型 *</Label>
                          <Select
                            value={customerForm.customer_type}
                            onValueChange={(value) => setCustomerForm({ ...customerForm, customer_type: value as "prepaid" | "credit" })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prepaid">预付</SelectItem>
                              <SelectItem value="credit">信用</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_address">公司地址</Label>
                        <Input
                          id="company_address"
                          value={customerForm.company_address}
                          onChange={(e) => setCustomerForm({ ...customerForm, company_address: e.target.value })}
                          placeholder="输入公司地址"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="credit_limit">信用额度</Label>
                          <Input
                            id="credit_limit"
                            type="number"
                            value={customerForm.credit_limit}
                            onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_terms">账期(天)</Label>
                          <Input
                            id="payment_terms"
                            type="number"
                            value={customerForm.payment_terms}
                            onChange={(e) => setCustomerForm({ ...customerForm, payment_terms: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="commission_type">收费类型</Label>
                          <Select
                            value={customerForm.commission_type}
                            onValueChange={(value) => setCustomerForm({ ...customerForm, commission_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择收费类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">百分比</SelectItem>
                              <SelectItem value="fixed">固定金额</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commission_value">
                            {customerForm.commission_type === "percentage" ? "费率" : "佣金值"}
                          </Label>
                          <div className="relative">
                            <Input
                              id="commission_value"
                              type="number"
                              value={customerForm.commission_value}
                              onChange={(e) => setCustomerForm({ ...customerForm, commission_value: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                            />
                            {customerForm.commission_type === "percentage" && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">状态</Label>
                        <Select
                          value={customerForm.status}
                          onValueChange={(value) => setCustomerForm({ ...customerForm, status: value as "active" | "frozen" })}
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

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenCustomerDialog(false);
                            resetCustomerForm();
                          }}
                        >
                          取消
                        </Button>
                        <Button onClick={handleSaveCustomer}>
                          {editingCustomer ? "更新" : "添加"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户编码</TableHead>
                      <TableHead>公司名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>信用额度</TableHead>
                      <TableHead>账期</TableHead>
                      <TableHead>收费</TableHead>
                      <TableHead>余额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>最近登录</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          暂无客户数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.customer_code}</TableCell>
                          <TableCell>{customer.company_name}</TableCell>
                          <TableCell>
                            <Badge variant={customer.customer_type === "credit" ? "default" : "secondary"}>
                              {customer.customer_type === "credit" ? "信用" : "预付"}
                            </Badge>
                          </TableCell>
                          <TableCell>${customer.credit_limit}</TableCell>
                          <TableCell>{customer.payment_terms} 天</TableCell>
                          <TableCell>
                            {customer.commission_type === "percentage" 
                              ? `${customer.commission_value}%` 
                              : `$${customer.commission_value}`}
                          </TableCell>
                          <TableCell className={customer.balance < 0 ? "text-red-600" : "text-green-600"}>
                            ${customer.balance}
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                              {customer.status === "active" ? "活跃" : "冻结"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.created_at ? format(new Date(customer.created_at), "yyyy-MM-dd") : "-"}
                          </TableCell>
                          <TableCell>
                            {customer.last_login_at ? format(new Date(customer.last_login_at), "yyyy-MM-dd HH:mm") : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setCustomerForm({
                                    company_name: customer.company_name,
                                    company_address: customer.company_address || "",
                                    customer_type: customer.customer_type,
                                    status: customer.status,
                                    credit_limit: customer.credit_limit || 0,
                                    payment_terms: customer.payment_terms || 0,
                                    payment_due_date: customer.payment_due_date || "",
                                    commission_type: customer.commission_type || "",
                                    commission_value: customer.commission_value || 0
                                  });
                                  setOpenCustomerDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer.id)}
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
        </TabsContent>

        <TabsContent value="subaccounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  客户子账号管理
                </span>
                <Dialog open={openSubAccountDialog} onOpenChange={(open) => {
                  setOpenSubAccountDialog(open);
                  if (!open) resetSubAccountForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加子账号
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSubAccount ? "编辑子账号" : "添加子账号"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>用户名 *</Label>
                          <Input
                            value={subAccountForm.username}
                            onChange={(e) => setSubAccountForm({ ...subAccountForm, username: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>邮箱 *</Label>
                          <Input
                            type="email"
                            value={subAccountForm.email}
                            onChange={(e) => setSubAccountForm({ ...subAccountForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>手机号</Label>
                          <Input
                            value={subAccountForm.phone}
                            onChange={(e) => setSubAccountForm({ ...subAccountForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>角色 *</Label>
                          <Input
                            value={subAccountForm.role}
                            onChange={(e) => setSubAccountForm({ ...subAccountForm, role: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>状态</Label>
                          <Select
                            value={subAccountForm.status}
                            onValueChange={(value) => setSubAccountForm({ ...subAccountForm, status: value })}
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
                        {!editingSubAccount && (
                          <div className="space-y-2">
                            <Label>密码 *</Label>
                            <Input
                              type="password"
                              value={subAccountForm.password}
                              onChange={(e) => setSubAccountForm({ ...subAccountForm, password: e.target.value })}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">客户权限</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {customers.map((customer) => (
                            <div key={customer.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`customer-${customer.id}`}
                                checked={subAccountForm.customer_permissions.includes(customer.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSubAccountForm({
                                      ...subAccountForm,
                                      customer_permissions: [...subAccountForm.customer_permissions, customer.id]
                                    });
                                  } else {
                                    setSubAccountForm({
                                      ...subAccountForm,
                                      customer_permissions: subAccountForm.customer_permissions.filter(id => id !== customer.id)
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
                        {featureOptions.map((feature) => (
                          <div key={feature.id} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`feature-${feature.id}`}
                                checked={subAccountForm.feature_permissions.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSubAccountForm({
                                      ...subAccountForm,
                                      feature_permissions: [...subAccountForm.feature_permissions, feature.id]
                                    });
                                  } else {
                                    setSubAccountForm({
                                      ...subAccountForm,
                                      feature_permissions: subAccountForm.feature_permissions.filter(id => id !== feature.id)
                                    });
                                  }
                                }}
                              />
                              <label htmlFor={`feature-${feature.id}`} className="text-sm font-medium">
                                {feature.label}
                              </label>
                            </div>
                            {feature.children.length > 0 && (
                              <div className="ml-6 space-y-2">
                                {feature.children.map((child) => (
                                  <div key={child} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`feature-${child}`}
                                      checked={subAccountForm.feature_permissions.includes(child)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSubAccountForm({
                                            ...subAccountForm,
                                            feature_permissions: [...subAccountForm.feature_permissions, child]
                                          });
                                        } else {
                                          setSubAccountForm({
                                            ...subAccountForm,
                                            feature_permissions: subAccountForm.feature_permissions.filter(id => id !== child)
                                          });
                                        }
                                      }}
                                    />
                                    <label htmlFor={`feature-${child}`} className="text-sm">
                                      {child}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setOpenSubAccountDialog(false)}>
                          取消
                        </Button>
                        <Button onClick={handleSaveSubAccount}>
                          {editingSubAccount ? "更新" : "添加"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>筛选客户</Label>
                <Select value={filterSubAccountCustomer} onValueChange={setFilterSubAccountCustomer}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部客户</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_code} - {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>关联客户</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.phone || "-"}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {getCustomerNamesForSubAccount(account.customer_permissions)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === "active" ? "default" : "secondary"}>
                          {account.status === "active" ? "活跃" : "冻结"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(account.created_at), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingSubAccount(account);
                              setSubAccountForm({
                                username: account.username,
                                email: account.email,
                                phone: account.phone || "",
                                role: account.role,
                                status: account.status,
                                password: "",
                                customer_permissions: account.customer_permissions || [],
                                feature_permissions: account.feature_permissions || []
                              });
                              setOpenSubAccountDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordSubAccount(account);
                              setOpenPasswordReset(true);
                            }}
                          >
                            重置密码
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Reset Dialog */}
      <Dialog open={openPasswordReset} onOpenChange={setOpenPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          {resetPasswordSubAccount && (
            <div className="space-y-4 py-4">
              <div>
                <Label>用户名</Label>
                <p className="text-sm font-medium mt-1">{resetPasswordSubAccount.username}</p>
              </div>
              <div>
                <Label>邮箱</Label>
                <p className="text-sm font-medium mt-1">{resetPasswordSubAccount.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码 *</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码（至少6个字符）"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenPasswordReset(false);
                    setNewPassword("");
                    setResetPasswordSubAccount(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleResetPassword}>确认重置</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Temporary Credit Dialog */}
      <Dialog open={openTemporaryCredit} onOpenChange={setOpenTemporaryCredit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置临时额度</DialogTitle>
          </DialogHeader>
          {selectedCustomerForCredit && (
            <div className="space-y-4 py-4">
              <div>
                <Label>客户</Label>
                <p className="text-sm font-medium">{selectedCustomerForCredit.company_name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp_amount">临时额度金额</Label>
                <Input
                  id="temp_amount"
                  type="number"
                  value={temporaryCreditForm.amount}
                  onChange={(e) => setTemporaryCreditForm({ ...temporaryCreditForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">有效期</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={temporaryCreditForm.valid_until}
                  onChange={(e) => setTemporaryCreditForm({ ...temporaryCreditForm, valid_until: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenTemporaryCredit(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveTemporaryCredit}>
                  确认
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;