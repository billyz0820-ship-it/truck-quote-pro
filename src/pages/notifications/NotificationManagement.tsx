import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const NotificationManagement = () => {
  const { userRole, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    notification_type: "announcement",
    start_time: "",
    end_time: ""
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("加载通知失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) throw new Error("未登录");
      
      if (editingNotification) {
        const { error } = await supabase
          .from("notifications")
          .update(form)
          .eq("id", editingNotification.id);

        if (error) throw error;
        toast.success("通知已更新");
      } else {
        const { error } = await supabase
          .from("notifications")
          .insert([{
            ...form,
            created_by: user.id
          }]);

        if (error) throw error;
        toast.success("通知已创建");
      }

      setOpenDialog(false);
      resetForm();
      fetchNotifications();
    } catch (error: any) {
      toast.error("保存通知失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此通知吗？")) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("通知已删除");
      fetchNotifications();
    } catch (error: any) {
      toast.error("删除通知失败: " + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      notification_type: "announcement",
      start_time: "",
      end_time: ""
    });
    setEditingNotification(null);
  };

  const isActive = (notification: any) => {
    const now = new Date();
    const start = new Date(notification.start_time);
    const end = notification.end_time ? new Date(notification.end_time) : null;
    
    return now >= start && (!end || now <= end);
  };

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">您没有权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">通知管理</h1>
          <p className="text-muted-foreground">发布和管理系统通知</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              新增通知
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNotification ? "编辑通知" : "新增通知"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="通知标题"
                />
              </div>
              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="通知内容..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={form.notification_type}
                  onValueChange={(value) => setForm({ ...form, notification_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">公告通知</SelectItem>
                    <SelectItem value="update">更新通知</SelectItem>
                    <SelectItem value="maintenance">维护通知</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始时间</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束时间(可选)</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleSave}>
                  {editingNotification ? "更新" : "创建"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>结束时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无通知
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.notification_type}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(notification.start_time), "yyyy-MM-dd HH:mm")}</TableCell>
                      <TableCell>
                        {notification.end_time ? format(new Date(notification.end_time), "yyyy-MM-dd HH:mm") : "无限期"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive(notification) ? "default" : "secondary"}>
                          {isActive(notification) ? "进行中" : "已结束"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingNotification(notification);
                              setForm({
                                title: notification.title,
                                content: notification.content,
                                notification_type: notification.notification_type,
                                start_time: notification.start_time.slice(0, 16),
                                end_time: notification.end_time ? notification.end_time.slice(0, 16) : ""
                              });
                              setOpenDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;