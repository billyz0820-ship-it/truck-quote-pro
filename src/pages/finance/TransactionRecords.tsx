import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: 'recharge' | 'deduction' | 'refund';
  customer_id: string;
  customer_code: string;
  company_name: string;
  amount: number;
  order_number?: string;
  fee_details?: string;
  created_at: string;
}

export default function TransactionRecords() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch recharges from payment_vouchers
      const { data: voucherData, error: voucherError } = await supabase
        .from('payment_vouchers')
        .select('*, customers(customer_code, company_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (voucherError) throw voucherError;

      const recharges: Transaction[] = (voucherData || []).map(v => ({
        id: v.id,
        type: 'recharge',
        customer_id: v.customer_id,
        customer_code: v.customers.customer_code,
        company_name: v.customers.company_name,
        amount: v.amount,
        created_at: v.created_at,
      }));

      // Fetch deductions from orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, customers(customer_code, company_name)')
        .not('quoted_amount', 'is', null)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      const deductions: Transaction[] = (orderData || []).map(o => ({
        id: o.id,
        type: 'deduction',
        customer_id: o.customer_id,
        customer_code: o.customers.customer_code,
        company_name: o.customers.company_name,
        amount: o.quoted_amount,
        order_number: o.order_number,
        fee_details: `订单费用: $${o.quoted_amount}`,
        created_at: o.created_at,
      }));

      // Fetch deductions from express_orders
      const { data: expressData, error: expressError } = await supabase
        .from('express_orders')
        .select('*')
        .not('shipping_fee', 'is', null)
        .order('created_at', { ascending: false });

      if (expressError) throw expressError;

      const expressDeductions: Transaction[] = (expressData || []).map(e => ({
        id: e.id,
        type: 'deduction',
        customer_id: e.customer_id,
        customer_code: e.customer_code,
        company_name: e.customer_code, // We don't have company_name in express_orders
        amount: e.shipping_fee,
        order_number: e.order_number,
        fee_details: `快递费用: $${e.shipping_fee}`,
        created_at: e.created_at,
      }));

      // Fetch refunds from rebills
      const { data: rebillData, error: rebillError } = await supabase
        .from('rebills')
        .select('*, customers(customer_code, company_name)')
        .order('created_at', { ascending: false });

      if (rebillError) throw rebillError;

      const refunds: Transaction[] = (rebillData || []).map(r => ({
        id: r.id,
        type: 'refund',
        customer_id: r.customer_id,
        customer_code: r.customers.customer_code,
        company_name: r.customers.company_name,
        amount: r.difference,
        order_number: r.order_id,
        fee_details: `差额退款: $${r.difference}`,
        created_at: r.created_at,
      }));

      // Combine all transactions and sort by date
      const allTransactions = [...recharges, ...deductions, ...expressDeductions, ...refunds]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || t.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'deduction':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'recharge':
        return <Badge className="bg-green-500">充值</Badge>;
      case 'deduction':
        return <Badge variant="destructive">扣费</Badge>;
      case 'refund':
        return <Badge className="bg-blue-500">退款</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    totalRecharge: transactions.filter(t => t.type === 'recharge').reduce((sum, t) => sum + t.amount, 0),
    totalDeduction: transactions.filter(t => t.type === 'deduction').reduce((sum, t) => sum + t.amount, 0),
    totalRefund: transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">流水记录</h1>
        <p className="text-sm text-muted-foreground">查看所有客户的充值、扣费和退款记录</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总充值金额</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.totalRecharge.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总扣费金额</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${stats.totalDeduction.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总退款金额</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">${stats.totalRefund.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>流水记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索客户代码、公司名称或订单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button size="sm" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="recharge">充值</SelectItem>
                <SelectItem value="deduction">扣费</SelectItem>
                <SelectItem value="refund">退款</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>客户代码</TableHead>
                  <TableHead>公司名称</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>费用详情</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">加载中...</TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无流水记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          {getTypeBadge(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.customer_code}</TableCell>
                      <TableCell>{transaction.company_name}</TableCell>
                      <TableCell>
                        <span className={
                          transaction.type === 'recharge' ? 'text-green-500 font-semibold' :
                          transaction.type === 'deduction' ? 'text-red-500 font-semibold' :
                          'text-blue-500 font-semibold'
                        }>
                          {transaction.type === 'recharge' ? '+' : transaction.type === 'deduction' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.order_number || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.fee_details || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
