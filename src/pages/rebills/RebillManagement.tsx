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
  const { userRole } = useAuth();
  const [rebills, setRebills] = useState<Rebill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [rebillForm, setRebillForm] = useState({
    order_id: "",
    base_fee: "",
    fuel_surcharge: "",
    long_haul_fee: "",
    other_fees: "",
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

      // Fetch rebills
      const { data: rebillsData, error: rebillsError } = await supabase
        .from('rebills')
        .select('*, customers(customer_code, company_name)')
        .order('created_at', { ascending: false });

      if (rebillsError) throw rebillsError;
      setRebills(rebillsData || []);

      // Fetch orders that might need rebills
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

  const calculateActualAmount = () => {
    const base = Number(rebillForm.base_fee) || 0;
    const fuel = Number(rebillForm.fuel_surcharge) || 0;
    const longHaul = Number(rebillForm.long_haul_fee) || 0;
    const other = Number(rebillForm.other_fees) || 0;
    return base + fuel + longHaul + other;
  };

  const calculateDifference = () => {
    if (!selectedOrder) return 0;
    const actualAmount = calculateActualAmount();
    return actualAmount - Number(selectedOrder.quoted_amount);
  };

  const handleCreateRebill = async () => {
    if (!rebillForm.order_id || !selectedOrder) {
      toast.error("请选择订单");
      return;
    }

    const actualAmount = calculateActualAmount();
    if (actualAmount <= 0) {
      toast.error("请至少填写一项费用");
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const difference = calculateDifference();

      const insertData = {
        order_id: rebillForm.order_id,
        customer_id: selectedOrder.customer_id,
        original_amount: Number(selectedOrder.quoted_amount),
        actual_amount: actualAmount,
        difference: difference,
        base_fee: Number(rebillForm.base_fee) || null,
        fuel_surcharge: Number(rebillForm.fuel_surcharge) || null,
        long_haul_fee: Number(rebillForm.long_haul_fee) || null,
        other_fees: Number(rebillForm.other_fees) || null,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('rebills')
        .insert([insertData]);

      if (error) throw error;

      toast.success("补费记录创建成功！");
      setDialogOpen(false);
      setRebillForm({
        order_id: "",
        base_fee: "",
        fuel_surcharge: "",
        long_haul_fee: "",
        other_fees: "",
      });
      setSelectedOrder(null);
      fetchData();

    } catch (error: any) {
      toast.error("创建补费记录失败: " + error.message);
    } finally {
      setCreating(false);
    }
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

  const totalDifference = rebills.reduce((sum, r) => sum + Number(r.difference), 0);
  const avgDifference = rebills.length > 0 ? totalDifference / rebills.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">补费管理</h1>
          <p className="text-muted-foreground">记录和管理订单额外费用</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>基础价 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.base_fee}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, base_fee: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>燃油附加费 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.fuel_surcharge}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, fuel_surcharge: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>长途附加费 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.long_haul_fee}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, long_haul_fee: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>其他费用 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rebillForm.other_fees}
                    onChange={(e) => setRebillForm(prev => ({ ...prev, other_fees: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">实际费用:</span>
                      <p className="text-lg font-bold text-red-600">
                        ${calculateActualAmount().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">差额:</span>
                      <p className={`text-lg font-bold ${calculateDifference() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {calculateDifference() >= 0 ? '+' : ''}${calculateDifference().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">差额比例:</span>
                      <p className={`text-lg font-bold ${calculateDifference() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedOrder.quoted_amount > 0 
                          ? `${((calculateDifference() / Number(selectedOrder.quoted_amount)) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                  取消
                </Button>
                <Button onClick={handleCreateRebill} disabled={creating || !selectedOrder}>
                  {creating ? "创建中..." : "创建补费记录"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">补费记录总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rebills.length}</div>
            <p className="text-xs text-muted-foreground">历史记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总差额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">累计额外费用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均差额</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {avgDifference >= 0 ? '+' : ''}${avgDifference.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">每单平均</p>
          </CardContent>
        </Card>
      </div>

      {/* Rebills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            补费记录列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单编号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>原报价</TableHead>
                <TableHead>费用明细</TableHead>
                <TableHead>实际费用</TableHead>
                <TableHead>差额</TableHead>
                <TableHead>差额比例</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rebills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无补费记录
                  </TableCell>
                </TableRow>
              ) : (
                rebills.map((rebill) => {
                  const diffPercentage = rebill.original_amount > 0 
                    ? ((Number(rebill.difference) / Number(rebill.original_amount)) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <TableRow key={rebill.id}>
                      <TableCell className="font-medium">{rebill.order_id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{rebill.customers.customer_code}</div>
                          <div className="text-muted-foreground">{rebill.customers.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${Number(rebill.original_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {rebill.base_fee && <div>基础价: ${Number(rebill.base_fee).toFixed(2)}</div>}
                          {rebill.fuel_surcharge && <div>燃油费: ${Number(rebill.fuel_surcharge).toFixed(2)}</div>}
                          {rebill.long_haul_fee && <div>长途费: ${Number(rebill.long_haul_fee).toFixed(2)}</div>}
                          {rebill.other_fees && <div>其他: ${Number(rebill.other_fees).toFixed(2)}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        ${Number(rebill.actual_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(rebill.difference) >= 0 ? 'destructive' : 'default'}>
                          {Number(rebill.difference) >= 0 ? '+' : ''}${Number(rebill.difference).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(rebill.difference) >= 0 ? 'destructive' : 'default'}>
                          {Number(rebill.difference) >= 0 ? '+' : ''}{diffPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(rebill.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RebillManagement;
