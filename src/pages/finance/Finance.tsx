import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  Download,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BillManagement } from "@/components/BillManagement";

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  balance: number;
  credit_limit: number;
  customer_type: string;
}

interface PaymentVoucher {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  status: string;
  voucher_url: string;
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
  actual_cost: number | null;
  profit: number | null;
  status: string;
  created_at: string;
  customers: {
    customer_code: string;
    company_name: string;
  };
}

const Finance = () => {
  const { userRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    pendingVouchers: 0
  });

  useEffect(() => {
    if (userRole === 'admin') {
      fetchFinanceData();
    }
  }, [userRole]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('company_name');
      
      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Fetch pending vouchers
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('payment_vouchers')
        .select('*, customers(customer_code, company_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (vouchersError) throw vouchersError;
      setVouchers(vouchersData || []);

      // Fetch orders with costs
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, customers(customer_code, company_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculate stats
      const revenue = ordersData?.reduce((sum, order) => sum + Number(order.quoted_amount), 0) || 0;
      const cost = ordersData?.reduce((sum, order) => sum + (Number(order.actual_cost) || 0), 0) || 0;
      const profit = ordersData?.reduce((sum, order) => sum + (Number(order.profit) || 0), 0) || 0;
      const pending = vouchersData?.length || 0;

      setStats({
        totalRevenue: revenue,
        totalCost: cost,
        totalProfit: profit,
        pendingVouchers: pending
      });

    } catch (error: any) {
      toast.error("加载财务数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherAction = async (voucherId: string, action: 'approved' | 'rejected') => {
    try {
      const voucher = vouchers.find(v => v.id === voucherId);
      if (!voucher) return;

      const { error } = await supabase
        .from('payment_vouchers')
        .update({ 
          status: action,
          processed_at: new Date().toISOString()
        })
        .eq('id', voucherId);

      if (error) throw error;

      // If approved, update customer balance
      if (action === 'approved') {
        const customer = customers.find(c => c.id === voucher.customer_id);
        if (customer) {
          const newBalance = Number(customer.balance) + Number(voucher.amount);
          const { error: balanceError } = await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', voucher.customer_id);

          if (balanceError) {
            console.error('Balance update error:', balanceError);
          }
        }
      }

      toast.success(action === 'approved' ? "付款凭证已批准" : "付款凭证已拒绝");
      setVoucherDialogOpen(false);
      fetchFinanceData();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">财务管理</h1>
        <p className="text-muted-foreground">查看客户余额、处理付款凭证和分析利润</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">订单报价总额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成本</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">实际成本总额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总利润</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              利润率: {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理凭证</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVouchers}</div>
            <p className="text-xs text-muted-foreground">需要审核</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList>
          <TabsTrigger value="customers">客户余额</TabsTrigger>
          <TabsTrigger value="vouchers">付款凭证</TabsTrigger>
          <TabsTrigger value="profit">利润分析</TabsTrigger>
          <TabsTrigger value="bills">账单管理</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                客户余额管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户编码</TableHead>
                    <TableHead>公司名称</TableHead>
                    <TableHead>客户类型</TableHead>
                    <TableHead>当前余额</TableHead>
                    <TableHead>信用额度</TableHead>
                    <TableHead>可用额度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const available = Number(customer.credit_limit) - Number(customer.balance);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customer_code}</TableCell>
                        <TableCell>{customer.company_name}</TableCell>
                        <TableCell>
                          <Badge variant={customer.customer_type === 'credit' ? 'default' : 'secondary'}>
                            {customer.customer_type === 'credit' ? '信用' : '预付'}
                          </Badge>
                        </TableCell>
                        <TableCell className={Number(customer.balance) > 0 ? 'text-red-600' : ''}>
                          ${Number(customer.balance).toFixed(2)}
                        </TableCell>
                        <TableCell>${Number(customer.credit_limit).toFixed(2)}</TableCell>
                        <TableCell className={available < 0 ? 'text-red-600' : 'text-green-600'}>
                          ${available.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                待处理付款凭证
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户编码</TableHead>
                    <TableHead>公司名称</TableHead>
                    <TableHead>付款金额</TableHead>
                    <TableHead>付款方式</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        暂无待处理凭证
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="font-medium">{voucher.customers.customer_code}</TableCell>
                        <TableCell>{voucher.customers.company_name}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${Number(voucher.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {voucher.payment_method === 'zelle' ? 'Zelle' : 
                             voucher.payment_method === 'check' ? '支票' : 
                             voucher.payment_method === 'wire' ? '电汇' : '其他'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(voucher.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVoucher(voucher);
                                setVoucherDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              查看
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
        </TabsContent>

        <TabsContent value="profit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  订单利润分析
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出报表
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单编号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>报价金额</TableHead>
                    <TableHead>实际成本</TableHead>
                    <TableHead>利润</TableHead>
                    <TableHead>利润率</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const quotedAmount = Number(order.quoted_amount);
                    const actualCost = Number(order.actual_cost) || 0;
                    const profit = Number(order.profit) || 0;
                    const profitMargin = actualCost > 0 ? ((profit / quotedAmount) * 100) : 0;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customers.company_name}</TableCell>
                        <TableCell>${quotedAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          {actualCost > 0 ? `$${actualCost.toFixed(2)}` : <span className="text-muted-foreground">未录入</span>}
                        </TableCell>
                        <TableCell className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {actualCost > 0 ? `$${profit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className={profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {actualCost > 0 ? `${profitMargin.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString('zh-CN')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <BillManagement />
        </TabsContent>
      </Tabs>

      {/* Voucher Review Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审核付款凭证</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>客户编码</Label>
                  <p className="text-sm font-medium">{selectedVoucher.customers.customer_code}</p>
                </div>
                <div>
                  <Label>公司名称</Label>
                  <p className="text-sm font-medium">{selectedVoucher.customers.company_name}</p>
                </div>
                <div>
                  <Label>付款金额</Label>
                  <p className="text-sm font-medium text-green-600">${Number(selectedVoucher.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label>付款方式</Label>
                  <p className="text-sm font-medium">
                    {selectedVoucher.payment_method === 'zelle' ? 'Zelle' : 
                     selectedVoucher.payment_method === 'check' ? '支票' : 
                     selectedVoucher.payment_method === 'wire' ? '电汇' : '其他'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label>提交时间</Label>
                  <p className="text-sm">{new Date(selectedVoucher.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              <div>
                <Label>付款凭证</Label>
                <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                  <a 
                    href={selectedVoucher.voucher_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    查看凭证文件
                  </a>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setVoucherDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVoucherAction(selectedVoucher.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  拒绝
                </Button>
                <Button
                  onClick={() => handleVoucherAction(selectedVoucher.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  批准
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
