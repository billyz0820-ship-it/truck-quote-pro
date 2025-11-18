import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [statusChanges, setStatusChanges] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      
      const [ticketRes, commsRes, statusRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("*")
          .eq("id", id)
          .single(),
        supabase
          .from("ticket_communications")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("ticket_status_changes")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true })
      ]);

      if (ticketRes.error) throw ticketRes.error;
      if (commsRes.error) throw commsRes.error;
      if (statusRes.error) throw statusRes.error;

      setTicket(ticketRes.data);
      setCommunications(commsRes.data || []);
      setStatusChanges(statusRes.data || []);
    } catch (error: any) {
      toast.error("加载工单详情失败: " + error.message);
      navigate("/dashboard/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from("ticket_communications")
        .insert([{
          ticket_id: id,
          user_id: user.id,
          user_name: user.email || "用户",
          message: newMessage
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchTicketDetails();
      toast.success("消息已发送");
    } catch (error: any) {
      toast.error("发送消息失败: " + error.message);
    }
  };

  const handleStatusChange = async (newStatus: string, statusLabel: string) => {
    if (!confirm(`确定要将工单状态更改为"${statusLabel}"吗？`)) return;
    if (!user) return;

    try {
      const oldStatus = ticket.status;
      
      // 更新工单状态
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
          assigned_to: newStatus === "in_progress" && !ticket.assigned_to ? user.id : ticket.assigned_to
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 记录状态变更
      const { error: historyError } = await supabase
        .from("ticket_status_changes")
        .insert({
          ticket_id: id,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: user.id,
          changed_by_name: user.email || "管理员"
        });

      if (historyError) throw historyError;

      toast.success("状态已更新");
      fetchTicketDetails();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      open: { label: "待处理", variant: "default" },
      in_progress: { label: "处理中", variant: "secondary" },
      resolved: { label: "已完成", variant: "outline" }
    };
    const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">工单不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/tickets")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">工单详情</h1>
          <p className="text-muted-foreground">工单编号: {ticket.ticket_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 订单信息 */}
          <Card>
            <CardHeader>
              <CardTitle>订单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">工单标题</p>
                  <p className="font-medium">{ticket.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">工单编号</p>
                  <p className="font-medium">{ticket.ticket_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">订单号</p>
                  <p className="font-medium">{ticket.order_number || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">承运商</p>
                  <p className="font-medium">{ticket.carrier_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">优先级</p>
                  {getPriorityBadge(ticket.priority)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">问题描述</p>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* 沟通记录 */}
          <Card>
            <CardHeader>
              <CardTitle>沟通记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {communications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无沟通记录</p>
                ) : (
                  communications.map(comm => (
                    <div key={comm.id} className="border-l-2 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{comm.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comm.created_at), "yyyy-MM-dd HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comm.message}</p>
                    </div>
                  ))
                )}
              </div>

              {ticket.status !== "resolved" && (
                <div className="space-y-2 border-t pt-4">
                  <Textarea
                    placeholder="输入回复内容..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendMessage}>
                      发送消息
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧栏 */}
        <div className="space-y-6">
          {/* 附件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                客户提交的图片
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {ticket.attachments.map((url: string, index: number) => (
                    <a 
                      key={index}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      <img 
                        src={url} 
                        alt={`附件 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无附件</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;