import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  Download,
  Calendar,
  CreditCard,
  FileText
} from "lucide-react";

const Finance = () => {
  const transactions = [
    {
      id: "TXN-001",
      type: "payment",
      description: "订单 ORD-2024-001 付款",
      amount: "-$2,450.00",
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "TXN-002",
      type: "credit",
      description: "信用额度调整",
      amount: "+$10,000.00",
      date: "2024-01-10",
      status: "completed"
    },
  ];

  const monthlyBills = [
    {
      month: "2024年1月",
      totalOrders: 45,
      totalAmount: "$125,450.00",
      status: "paid",
      dueDate: "2024-02-15"
    },
    {
      month: "2023年12月",
      totalOrders: 52,
      totalAmount: "$143,200.00",
      status: "paid",
      dueDate: "2024-01-15"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">财务管理</h1>
        <p className="text-muted-foreground">查看流水记录和月度账单</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月支出</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$23,450</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">-5%</span> 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付账单</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,300</div>
            <p className="text-xs text-muted-foreground">
              2张账单待付
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">信用余额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$76,550</div>
            <p className="text-xs text-muted-foreground">
              可用额度
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transactions and Bills */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">流水记录</TabsTrigger>
          <TabsTrigger value="bills">月度账单</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  流水记录
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易编号</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={
                        transaction.amount.startsWith('-') ? 'text-destructive' : 'text-success'
                      }>
                        {transaction.amount}
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge className="bg-success">已完成</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  月度账单
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出账单
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账单月份</TableHead>
                    <TableHead>订单数量</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead>到期日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBills.map((bill, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{bill.month}</TableCell>
                      <TableCell>{bill.totalOrders}</TableCell>
                      <TableCell className="font-medium">{bill.totalAmount}</TableCell>
                      <TableCell>{bill.dueDate}</TableCell>
                      <TableCell>
                        <Badge className="bg-success">已付</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          下载
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;