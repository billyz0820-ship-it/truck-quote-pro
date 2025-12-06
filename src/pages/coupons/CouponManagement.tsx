import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, Plus, RefreshCw, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CouponSettings from "@/components/coupons/CouponSettings";

interface Coupon {
  id: string;
  coupon_code: string;
  amount: number;
  customer_id: string | null;
  status: string;
  created_at: string;
  used_at: string | null;
  voided_at: string | null;
  expire_at: string | null;
  customers: {
    customer_code: string;
    company_name: string;
  } | null;
}

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
}

const CouponManagement = () => {
  const { userRole } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [couponForm, setCouponForm] = useState({
    coupon_code: "",
    amount: "",
    customer_id: "",
    expire_at: "",
  });

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*, customers(customer_code, company_name)')
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;
      setCoupons(couponsData || []);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, customer_code, company_name')
        .eq('status', 'active')
        .order('company_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCode = () => {
    setCouponForm(prev => ({
      ...prev,
      coupon_code: generateCouponCode()
    }));
  };

  const handleCreateCoupon = async () => {
    if (!couponForm.coupon_code || !couponForm.amount) {
      toast.error("请填写优惠券码和金额");
      return;
    }

    if (Number(couponForm.amount) <= 0) {
      toast.error("金额必须大于0");
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const insertData: any = {
        coupon_code: couponForm.coupon_code,
        amount: Number(couponForm.amount),
        created_by: user.id,
        status: 'active'
      };

      if (couponForm.customer_id) {
        insertData.customer_id = couponForm.customer_id;
      }

      if (couponForm.expire_at) {
        // 确保日期格式正确
        const expireDate = new Date(couponForm.expire_at);
        if (!isNaN(expireDate.getTime())) {
          insertData.expire_at = expireDate.toISOString();
        }
      }

      const { error } = await supabase
        .from('coupons')
        .insert([insertData]);

      if (error) throw error;

      toast.success("优惠券创建成功！");
      setDialogOpen(false);
      setCouponForm({
        coupon_code: "",
        amount: "",
        customer_id: "",
        expire_at: "",
      });
      fetchData();

    } catch (error: any) {
      toast.error("创建优惠券失败: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleVoidCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          status: 'voided',
          voided_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) throw error;

      toast.success("优惠券已作废");
      fetchData();

    } catch (error: any) {
      toast.error("作废失败: " + error.message);
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.status === 'voided') {
      return <Badge variant="destructive">已作废</Badge>;
    }
    if (coupon.used_at) {
      return <Badge variant="secondary">已使用</Badge>;
    }
    if (coupon.expire_at && new Date(coupon.expire_at) < new Date()) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">已过期</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">可用</Badge>;
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">您没有权限访问此页面</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const activeCoupons = coupons.filter(c => 
    c.status === 'active' && 
    !c.used_at && 
    (!c.expire_at || new Date(c.expire_at) >= new Date())
  );

  const usedCoupons = coupons.filter(c => c.used_at);
  const expiredCoupons = coupons.filter(c => 
    c.expire_at && 
    new Date(c.expire_at) < new Date() && 
    !c.used_at && 
    c.status === 'active'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">优惠券管理</h1>
          <p className="text-muted-foreground">生成和管理客户优惠券</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建优惠券
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新优惠券</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>优惠券码</Label>
                <div className="flex gap-2">
                  <Input
                    value={couponForm.coupon_code}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, coupon_code: e.target.value }))}
                    placeholder="优惠券码"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCode}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>金额 ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={couponForm.amount}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="金额"
                />
              </div>

              <div className="space-y-2">
                <Label>分配给客户（可选）</Label>
                <Select
                  value={couponForm.customer_id || "none"}
                  onValueChange={(value) => setCouponForm(prev => ({ ...prev, customer_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户或留空" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不分配</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_code} - {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>有效期（可选）</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.expire_at}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, expire_at: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                  取消
                </Button>
                <Button onClick={handleCreateCoupon} disabled={creating}>
                  {creating ? "创建中..." : "创建优惠券"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupon Settings */}
      <CouponSettings />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总优惠券</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用</CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCoupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已使用</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usedCoupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已过期</CardTitle>
            <Ticket className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiredCoupons.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            优惠券列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优惠券码</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>分配客户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>使用时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无优惠券
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">{coupon.coupon_code}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${Number(coupon.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {coupon.customers ? (
                        <div className="text-sm">
                          <div className="font-medium">{coupon.customers.customer_code}</div>
                          <div className="text-muted-foreground">{coupon.customers.company_name}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                    <TableCell>{new Date(coupon.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>
                      {coupon.expire_at ? (
                        <span className={new Date(coupon.expire_at) < new Date() ? 'text-orange-500' : ''}>
                          {new Date(coupon.expire_at).toLocaleDateString('zh-CN')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">无限期</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.used_at ? (
                        new Date(coupon.used_at).toLocaleDateString('zh-CN')
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.status === 'active' && !coupon.used_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVoidCoupon(coupon.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          作废
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponManagement;
