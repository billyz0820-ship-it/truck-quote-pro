import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MessageSquare, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";

const TicketManagement = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error("加载工单失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTicketStatuses = () => {
    const allCount = tickets.length;
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { value: "all", label: "全部工单", count: allCount },
      { value: "open", label: "待处理", count: statusCounts.open || 0 },
      { value: "in_progress", label: "处理中", count: statusCounts.in_progress || 0 },
      { value: "resolved", label: "已完成", count: statusCounts.resolved || 0 },
    ];
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab !== "all" && ticket.status !== activeTab) return false;
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(term) ||
      ticket.ticket_number.toLowerCase().includes(term) ||
      ticket.order_number?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      open: { label: "待处理", variant: "default" },
      in_progress: { label: "处理中", variant: "secondary" },
      resolved: { label: "已完成", variant: "outline" }
    };
    const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      high: { label: "高", variant: "destructive" },
      medium: { label: "中", variant: "default" },
      low: { label: "低", variant: "secondary" }
    };
    const { label, variant } = config[priority] || { label: priority, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">工单管理</h1>
          <p className="text-muted-foreground">处理和跟踪所有工单事项</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建工单
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工单标题、编号、订单号..."
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

      {/* 工单状态标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {getTicketStatuses().map((status) => (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label} ({status.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>工单列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无工单</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工单号</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>承运商</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>{ticket.order_number || "-"}</TableCell>
                      <TableCell>{ticket.carrier_name || "-"}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          处理
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      <CreateTicketDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchTickets}
      />
    </div>
  );
};

export default TicketManagement;