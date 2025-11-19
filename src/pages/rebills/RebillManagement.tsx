import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, DollarSign, TrendingUp, Upload } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("truck-rebills");

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
      toast.error("请输入实际费用");
      return;
    }

    try {
      setCreating(true);
      
      const difference = calculateDifference();

      const { error } = await supabase
        .from('rebills')
        .insert({
          order_id: rebillForm.order_id,
          customer_id: selectedOrder.customer_id,
          original_amount: Number(selectedOrder.quoted_amount),
          actual_amount: actualAmount,
          difference: difference,
          base_fee: Number(rebillForm.base_fee) || null,
          fuel_surcharge: Number(rebillForm.fuel_surcharge) || null,
          long_haul_fee: Number(rebillForm.long_haul_fee) || null,
          other_fees: Number(rebillForm.other_fees) || null,
          created_by: user?.id || '',
        });

      if (error) throw error;

      toast.success("补费记录创建成功");
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
          <p className="text-muted-foreground">管理订单额外费用和运费差异</p>
        </div>
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
            <div className="text-2xl font-bold">${stats.totalDifference.toFixed(2)}</div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="truck-rebills">卡车补费</TabsTrigger>
          <TabsTrigger value="freight-difference">运费差异</TabsTrigger>
        </TabsList>

        <TabsContent value="truck-rebills" className="space-y-4">
          <div className="flex justify-end">
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
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">实际总金额:</span>
                        <span className="font-medium text-lg">${calculateActualAmount().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">原报价:</span>
                        <span className="font-medium">${Number(selectedOrder.quoted_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">
                          {calculateDifference() >= 0 ? '需补收:' : '需退费:'}
                        </span>
                        <span className={`font-bold text-lg ${calculateDifference() >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(calculateDifference()).toFixed(2)}
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

          <Card>
            <CardHeader>
              <CardTitle>卡车补费记录</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单编号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>原报价</TableHead>
                    <TableHead>实际金额</TableHead>
                    <TableHead>差异</TableHead>
                    <TableHead>基础价</TableHead>
                    <TableHead>燃油费</TableHead>
                    <TableHead>长途费</TableHead>
                    <TableHead>其他费用</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        暂无补费记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    rebills.map((rebill) => (
                      <TableRow key={rebill.id}>
                        <TableCell className="font-medium">{rebill.order_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rebill.customers.company_name}</div>
                            <div className="text-sm text-muted-foreground">{rebill.customers.customer_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>${Number(rebill.original_amount).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${Number(rebill.actual_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={Number(rebill.difference) >= 0 ? "destructive" : "default"}>
                            {Number(rebill.difference) >= 0 ? '+' : ''}{Number(rebill.difference).toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>{rebill.base_fee ? `$${Number(rebill.base_fee).toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{rebill.fuel_surcharge ? `$${Number(rebill.fuel_surcharge).toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{rebill.long_haul_fee ? `$${Number(rebill.long_haul_fee).toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{rebill.other_fees ? `$${Number(rebill.other_fees).toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{new Date(rebill.created_at).toLocaleDateString('zh-CN')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="freight-difference" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>运费差异管理</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">导入承运商账单，对比系统订单，发现并处理运费差异</p>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  导入账单
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>请导入承运商账单表格以开始对比</p>
                <p className="text-sm mt-2">支持 Excel、CSV 格式文件</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RebillManagement;
