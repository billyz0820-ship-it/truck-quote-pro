import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");

  const orderStatuses = [
    { value: "all", label: "全部订单", count: 128 },
    { value: "quoted", label: "已报价", count: 15 },
    { value: "confirmed", label: "已确认", count: 23 },
    { value: "picked-up", label: "已提货", count: 35 },
    { value: "in-transit", label: "运输中", count: 42 },
    { value: "delivered", label: "已送达", count: 13 },
  ];

  // 模拟订单数据 - 增加了参考编号、PRO号、BOL号、SKU
  const mockOrders = [
    {
      id: "ORD-2024-001",
      referenceNumber: "REF-ABC-123",
      proNumber: "PRO-456789",
      bolNumber: "BOL-987654",
      sku: "SKU-ELEC-001",
      pickup: "90001",
      delivery: "10001",
      cargo: "电子产品",
      status: "in-transit",
      amount: "$2,450.00",
      date: "2024-01-15"
    },
    {
      id: "ORD-2024-002",
      referenceNumber: "REF-XYZ-456",
      proNumber: "PRO-789012",
      bolNumber: "BOL-321098",
      sku: "SKU-FURN-002",
      pickup: "60601",
      delivery: "33101",
      cargo: "家具",
      status: "picked-up",
      amount: "$3,200.00",
      date: "2024-01-14"
    },
    {
      id: "ORD-2024-003",
      referenceNumber: "REF-DEF-789",
      proNumber: "",
      bolNumber: "",
      sku: "SKU-FOOD-003",
      pickup: "94102",
      delivery: "98101",
      cargo: "食品",
      status: "confirmed",
      amount: "$1,800.00",
      date: "2024-01-13"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "quoted": { label: "已报价", className: "bg-blue-500" },
      "confirmed": { label: "已确认", className: "bg-purple-500" },
      "picked-up": { label: "已提货", className: "bg-yellow-500" },
      "in-transit": { label: "运输中", className: "bg-orange-500" },
      "delivered": { label: "已送达", className: "bg-green-500" }
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredOrders = mockOrders.filter(order => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    switch (searchType) {
      case "order":
        return order.id.toLowerCase().includes(term);
      case "reference":
        return order.referenceNumber.toLowerCase().includes(term);
      case "pro":
        return order.proNumber.toLowerCase().includes(term);
      case "bol":
        return order.bolNumber.toLowerCase().includes(term);
      case "sku":
        return order.sku.toLowerCase().includes(term);
      case "pickup":
        return order.pickup.includes(term);
      case "delivery":
        return order.delivery.includes(term);
      default:
        return (
          order.id.toLowerCase().includes(term) ||
          order.referenceNumber.toLowerCase().includes(term) ||
          order.proNumber.toLowerCase().includes(term) ||
          order.bolNumber.toLowerCase().includes(term) ||
          order.sku.toLowerCase().includes(term) ||
          order.pickup.includes(term) ||
          order.delivery.includes(term)
        );
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">订单管理</h1>
          <p className="text-muted-foreground">查看和管理所有运输订单</p>
        </div>
        <Button onClick={() => navigate("/dashboard/orders/create")}>
          <Plus className="h-4 w-4 mr-2" />
          创建订单
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="搜索类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="order">订单编号</SelectItem>
                  <SelectItem value="reference">参考编号</SelectItem>
                  <SelectItem value="pro">PRO号</SelectItem>
                  <SelectItem value="bol">BOL号</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="pickup">起点邮编</SelectItem>
                  <SelectItem value="delivery">终点邮编</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 订单状态标签页 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          {orderStatuses.map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label} ({status.count})
            </TabsTrigger>
          ))}
        </TabsList>

        {orderStatuses.map((status) => (
          <TabsContent key={status.value} value={status.value}>
            <Card>
              <CardHeader>
                <CardTitle>{status.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单编号</TableHead>
                      <TableHead>参考编号</TableHead>
                      <TableHead>起点</TableHead>
                      <TableHead>终点</TableHead>
                      <TableHead>货物</TableHead>
                      <TableHead>PRO号</TableHead>
                      <TableHead>BOL号</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.referenceNumber}</TableCell>
                        <TableCell>{order.pickup}</TableCell>
                        <TableCell>{order.delivery}</TableCell>
                        <TableCell>{order.cargo}</TableCell>
                        <TableCell>{order.proNumber || "-"}</TableCell>
                        <TableCell>{order.bolNumber || "-"}</TableCell>
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
