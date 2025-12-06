import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Rebill {
  id: string;
  order_id: string;
  customer_id: string;
  original_amount: number;
  actual_amount: number;
  difference: number;
  base_fee: number | null;
  fuel_surcharge: number | null;
  long_haul_fee: number | null;
  other_fees: number | null;
  created_at: string;
  customers: {
    customer_code: string;
    company_name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  quoted_amount: number;
  customer_id: string;
  customers: {
    customer_code: string;
    company_name: string;
  };
}

const RebillManagement = () => {
  const { userRole, user } = useAuth();
  const [rebills, setRebills] = useState<Rebill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [rebillForm, setRebillForm] = useState({
    order_id: "",
    base_fee_diff: "",
    fuel_surcharge_diff: "",
    long_haul_fee_diff: "",
    other_fees_diff: "",
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: rebillsData, error: rebillsError } = await supabase
        .from('rebills')
        .select('*, customers(customer_code, company_name)')
        .order('created_at', { ascending: false });

      if (rebillsError) throw rebillsError;
      setRebills(rebillsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, quoted_amount, customer_id, customers(customer_code, company_name)')
        .in('status', ['picked-up', 'in-transit', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setRebillForm(prev => ({ ...prev, order_id: orderId }));
  };

  // 计算差异金额总和
  const calculateTotalDifference = () => {
    const baseDiff = Number(rebillForm.base_fee_diff) || 0;
    const fuelDiff = Number(rebillForm.fuel_surcharge_diff) || 0;
    const longHaulDiff = Number(rebillForm.long_haul_fee_diff) || 0;
    const otherDiff = Number(rebillForm.other_fees_diff) || 0;
    return baseDiff + fuelDiff + longHaulDiff + otherDiff;
  };

  const handleCreateRebill = async () => {
    if (!rebillForm.order_id || !selectedOrder) {
      toast.error("请选择订单");
      return;
    }

    const totalDifference = calculateTotalDifference();
    if (totalDifference === 0) {
      toast.error("请输入至少一项差异金额");
      return;
    }

    try {
      setCreating(true);
      
      // 实际金额 = 原报价 + 差异金额
      const actualAmount = Number(selectedOrder.quoted_amount) + totalDifference;

      const { error } = await supabase
        .from('rebills')
        .insert({
          order_id: rebillForm.order_id,
          customer_id: selectedOrder.customer_id,
          original_amount: Number(selectedOrder.quoted_amount),
          actual_amount: actualAmount,
          difference: totalDifference,
          base_fee: Number(rebillForm.base_fee_diff) || null,
          fuel_surcharge: Number(rebillForm.fuel_surcharge_diff) || null,
          long_haul_fee: Number(rebillForm.long_haul_fee_diff) || null,
          other_fees: Number(rebillForm.other_fees_diff) || null,
          created_by: user?.id || '',
        });

      if (error) throw error;

      toast.success("补费记录创建成功");
      setDialogOpen(false);
      setRebillForm({
        order_id: "",
        base_fee_diff: "",
        fuel_surcharge_diff: "",
        long_haul_fee_diff: "",
        other_fees_diff: "",
      });
      setSelectedOrder(null);
      fetchData();
    } catch (error: any) {
      toast.error("创建失败: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getTotalStats = () => {
    const totalRebills = rebills.length;
    const totalDifference = rebills.reduce((sum, rebill) => sum + Number(rebill.difference), 0);
    const avgDifference = totalRebills > 0 ? totalDifference / totalRebills : 0;

    return { totalRebills, totalDifference, avgDifference };
  };

  const stats = getTotalStats();

  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">反弹账单</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">反弹账单</h1>
          <p className="text-muted-foreground">管理订单额外费用补收</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建补费记录
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建补费记录</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>选择订单</Label>
                <Select
                  value={rebillForm.order_id}
                  onValueChange={handleOrderSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择订单" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.customers.company_name} (原报价: ${Number(order.quoted_amount).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">订单编号:</span>
                      <p className="font-medium">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">客户:</span>
                      <p className="font-medium">{selectedOrder.customers.company_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">原报价:</span>
                      <p className="font-medium text-green-600">${Number(selectedOrder.quoted_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">差异金额（正数为补收，负数为退费）</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>基础价差异 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.base_fee_diff}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, base_fee_diff: e.target.value }))}
                    placeholder="例：10 表示补收10元"
                  />
                </div>

                <div className="space-y-2">
                  <Label>燃油附加费差异 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.fuel_surcharge_diff}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, fuel_surcharge_diff: e.target.value }))}
                    placeholder="例：5 表示补收5元"
                  />
                </div>

                <div className="space-y-2">
                  <Label>长途附加费差异 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.long_haul_fee_diff}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, long_haul_fee_diff: e.target.value }))}
                    placeholder="例：-5 表示退费5元"
                  />
                </div>

                <div className="space-y-2">
                  <Label>其他费用差异 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.other_fees_diff}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, other_fees_diff: e.target.value }))}
                    placeholder="例：8 表示补收8元"
                  />
                </div>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">原报价:</span>
                    <span className="font-medium">${Number(selectedOrder.quoted_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">差异金额合计:</span>
                    <span className={`font-medium ${calculateTotalDifference() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {calculateTotalDifference() >= 0 ? '+' : ''}{calculateTotalDifference().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">
                      {calculateTotalDifference() >= 0 ? '需补收:' : '需退费:'}
                    </span>
                    <span className={`font-bold text-lg ${calculateTotalDifference() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(calculateTotalDifference()).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreateRebill}
                  disabled={creating || !rebillForm.order_id}
                >
                  {creating ? "创建中..." : "创建补费记录"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总补费记录</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRebills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总差异金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.totalDifference >= 0 ? '+' : ''}${stats.totalDifference.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均差异</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgDifference.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>补费记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单编号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>原报价</TableHead>
                <TableHead>基础价差异</TableHead>
                <TableHead>燃油费差异</TableHead>
                <TableHead>长途费差异</TableHead>
                <TableHead>其他差异</TableHead>
                <TableHead>总差异</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rebills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    暂无补费记录
                  </TableCell>
                </TableRow>
              ) : (
                rebills.map((rebill) => (
                  <TableRow key={rebill.id}>
                    <TableCell className="font-medium">{rebill.order_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rebill.customers.company_name}</div>
                        <div className="text-sm text-muted-foreground">{rebill.customers.customer_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>${Number(rebill.original_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      {rebill.base_fee ? (
                        <span className={Number(rebill.base_fee) >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {Number(rebill.base_fee) >= 0 ? '+' : ''}${Number(rebill.base_fee).toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {rebill.fuel_surcharge ? (
                        <span className={Number(rebill.fuel_surcharge) >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {Number(rebill.fuel_surcharge) >= 0 ? '+' : ''}${Number(rebill.fuel_surcharge).toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {rebill.long_haul_fee ? (
                        <span className={Number(rebill.long_haul_fee) >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {Number(rebill.long_haul_fee) >= 0 ? '+' : ''}${Number(rebill.long_haul_fee).toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {rebill.other_fees ? (
                        <span className={Number(rebill.other_fees) >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {Number(rebill.other_fees) >= 0 ? '+' : ''}${Number(rebill.other_fees).toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={Number(rebill.difference) >= 0 ? "destructive" : "default"}>
                        {Number(rebill.difference) >= 0 ? '+' : ''}{Number(rebill.difference).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(rebill.created_at).toLocaleDateString('zh-CN')}</TableCell>
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

export default RebillManagement;
