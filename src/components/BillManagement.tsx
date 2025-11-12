import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Bill {
  id: string;
  customer_id: string;
  bill_number: string;
  bill_month: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: {
    customer_code: string;
    company_name: string;
  };
}

export const BillManagement = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取账单列表
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*, customers(customer_code, company_name)')
        .order('bill_month', { ascending: false });

      if (billsError) throw billsError;
      setBills(billsData || []);

      // 获取客户列表用于筛选
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, customer_code, company_name')
        .order('company_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "pending": { label: "待付款", className: "bg-yellow-500" },
      "paid": { label: "已付款", className: "bg-green-500" },
      "overdue": { label: "逾期", className: "bg-red-500" },
      "cancelled": { label: "已取消", className: "bg-gray-500" }
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleExport = async (billId?: string) => {
    try {
      let dataToExport = bills;
      
      if (billId) {
        dataToExport = bills.filter(b => b.id === billId);
      } else {
        // 应用筛选
        dataToExport = filteredBills;
      }

      // 创建 CSV 内容
      const headers = ["账单编号", "客户代码", "客户名称", "账单月份", "账单金额", "状态", "创建日期"];
      const rows = dataToExport.map(bill => [
        bill.bill_number,
        bill.customers.customer_code,
        bill.customers.company_name,
        bill.bill_month,
        `$${Number(bill.total_amount).toFixed(2)}`,
        bill.status,
        new Date(bill.created_at).toLocaleDateString('zh-CN')
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // 下载文件
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `账单导出_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("导出成功！");
    } catch (error: any) {
      toast.error("导出失败: " + error.message);
    }
  };

  // 筛选账单
  const filteredBills = bills.filter(bill => {
    if (filterCustomer && bill.customer_id !== filterCustomer) return false;
    if (filterMonth && bill.bill_month !== filterMonth) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        bill.bill_number.toLowerCase().includes(term) ||
        bill.customers.customer_code.toLowerCase().includes(term) ||
        bill.customers.company_name.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // 统计数据
  const stats = {
    total: filteredBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0),
    pending: filteredBills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + Number(bill.total_amount), 0),
    paid: filteredBills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + Number(bill.total_amount), 0),
    count: filteredBills.length
  };

  // 获取唯一的账单月份列表
  const uniqueMonths = [...new Set(bills.map(bill => bill.bill_month))].sort().reverse();

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">账单管理</h2>
          <p className="text-muted-foreground">查看和管理客户账单</p>
        </div>

        <Button onClick={() => handleExport()}>
          <Download className="h-4 w-4 mr-2" />
          导出全部
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账单总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账单总额</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${stats.pending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.paid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索账单编号或客户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="筛选客户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部客户</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.customer_code} - {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="筛选月份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部月份</SelectItem>
                {uniqueMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 账单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            账单列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账单编号</TableHead>
                <TableHead>客户代码</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>账单月份</TableHead>
                <TableHead>账单金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无账单数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.bill_number}</TableCell>
                    <TableCell>{bill.customers.customer_code}</TableCell>
                    <TableCell>{bill.customers.company_name}</TableCell>
                    <TableCell>{bill.bill_month}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${Number(bill.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>{new Date(bill.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(bill.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
