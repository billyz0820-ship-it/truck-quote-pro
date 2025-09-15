import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const orderStatuses = [
    { key: "all", label: "全部订单", count: 342 },
    { key: "pending", label: "待下单", count: 12 },
    { key: "review", label: "待审核", count: 8 },
    { key: "processing", label: "处理中", count: 23 },
    { key: "pickup-pending", label: "待提货", count: 15 },
    { key: "picked-up", label: "已提货", count: 18 },
    { key: "in-transit", label: "运输中", count: 25 },
    { key: "delivered", label: "已送达", count: 156 },
    { key: "cancelled", label: "取消", count: 5 },
  ];

  const mockOrders = [
    {
      id: "ORD-2024-001",
      pickup: "洛杉矶, CA",
      delivery: "纽约, NY",
      cargo: "电子产品",
      status: "in-transit",
      amount: "$2,450",
      date: "2024-01-15",
    },
    {
      id: "ORD-2024-002", 
      pickup: "芝加哥, IL",
      delivery: "迈阿密, FL",
      cargo: "服装",
      status: "delivered",
      amount: "$1,850",
      date: "2024-01-14",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "pending": { label: "待下单", variant: "outline" as const },
      "review": { label: "待审核", variant: "secondary" as const },
      "processing": { label: "处理中", variant: "default" as const },
      "pickup-pending": { label: "待提货", variant: "secondary" as const },
      "picked-up": { label: "已提货", variant: "default" as const },
      "in-transit": { label: "运输中", variant: "default" as const },
      "delivered": { label: "已送达", variant: "default" as const },
      "cancelled": { label: "取消", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return statusInfo ? (
      <Badge variant={statusInfo.variant} className={
        status === "delivered" ? "bg-success" : 
        status === "in-transit" ? "bg-info" : ""
      }>
        {statusInfo.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">订单列表</h1>
          <p className="text-muted-foreground">管理您的所有运输订单</p>
        </div>
        <Button onClick={() => navigate("/dashboard/orders/create")} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          创建订单
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索订单编号、起点、终点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-9 w-full">
          {orderStatuses.map((status) => (
            <TabsTrigger key={status.key} value={status.key} className="text-xs">
              {status.label}
              <Badge variant="secondary" className="ml-1">
                {status.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {orderStatuses.map((status) => (
          <TabsContent key={status.key} value={status.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {status.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单编号</TableHead>
                      <TableHead>提货地</TableHead>
                      <TableHead>送货地</TableHead>
                      <TableHead>货物</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.pickup}</TableCell>
                        <TableCell>{order.delivery}</TableCell>
                        <TableCell>{order.cargo}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="font-medium">{order.amount}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default OrderList;