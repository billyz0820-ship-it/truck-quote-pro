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
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

const TicketManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const ticketStatuses = [
    { key: "all", label: "全部", count: 156 },
    { key: "pending", label: "待处理", count: 5 },
    { key: "processing", label: "处理中", count: 12 },
    { key: "completed", label: "已完成", count: 89 },
    { key: "closed", label: "已关闭", count: 234 },
    { key: "rejected", label: "已驳回", count: 16 },
  ];

  const mockTickets = [
    {
      id: "TK-2024-001",
      title: "订单配送延迟问题",
      type: "delivery",
      priority: "high",
      status: "processing",
      submitter: "张经理",
      assignee: "客服小李",
      submitTime: "2024-01-15 10:30",
      description: "订单 ORD-2024-001 预计配送时间延迟2天"
    },
    {
      id: "TK-2024-002",
      title: "发票信息错误",
      type: "billing",
      priority: "medium", 
      status: "pending",
      submitter: "财务部",
      assignee: "未分配",
      submitTime: "2024-01-14 15:45",
      description: "客户反馈发票上的公司名称有误"
    },
    {
      id: "TK-2024-003",
      title: "货物损坏赔偿申请",
      type: "damage",
      priority: "high",
      status: "completed",
      submitter: "王总",
      assignee: "理赔专员",
      submitTime: "2024-01-10 09:15",
      description: "运输过程中货物包装损坏，需要申请理赔"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "pending": { label: "待处理", variant: "destructive" as const },
      "processing": { label: "处理中", variant: "default" as const },
      "completed": { label: "已完成", variant: "default" as const },
      "closed": { label: "已关闭", variant: "secondary" as const },
      "rejected": { label: "已驳回", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return statusInfo ? (
      <Badge variant={statusInfo.variant} className={
        status === "completed" ? "bg-success" : 
        status === "processing" ? "bg-warning" : ""
      }>
        {statusInfo.label}
      </Badge>
    ) : null;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      "low": { label: "低", className: "bg-secondary" },
      "medium": { label: "中", className: "bg-warning" },
      "high": { label: "高", className: "bg-destructive" },
    };
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap];
    return priorityInfo ? (
      <Badge className={priorityInfo.className}>
        {priorityInfo.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">工单管理</h1>
        <p className="text-muted-foreground">处理和跟踪所有工单事项</p>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索工单..."
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建工单
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Status Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          {ticketStatuses.map((status) => (
            <TabsTrigger key={status.key} value={status.key} className="text-xs">
              {status.label}
              <Badge variant="secondary" className="ml-1">
                {status.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {ticketStatuses.map((status) => (
          <TabsContent key={status.key} value={status.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {status.label}工单
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工单编号</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>提交人</TableHead>
                      <TableHead>处理人</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTickets
                      .filter(ticket => status.key === "all" || ticket.status === status.key)
                      .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {ticket.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{ticket.submitter}</TableCell>
                        <TableCell>{ticket.assignee}</TableCell>
                        <TableCell>{ticket.submitTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              查看
                            </Button>
                            {ticket.status === "pending" && (
                              <Button size="sm">
                                处理
                              </Button>
                            )}
                          </div>
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

export default TicketManagement;