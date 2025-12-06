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
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const KnowledgeBase = () => {
  const { userRole, user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "view" | "edit">("create");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "",
    status: "published"
  });

  useEffect(() => {
    fetchArticles();
  }, [userRole]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });

      if (userRole !== "admin") {
        query = query.eq("status", "published");
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      toast.error("加载文档失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) throw new Error("未登录");
      
      if (viewMode === "edit" && selectedArticle) {
        const { error } = await supabase
          .from("knowledge_base")
          .update({
            ...form,
            updated_by: user.id
          })
          .eq("id", selectedArticle.id);

        if (error) throw error;
        toast.success("文档已更新");
      } else {
        const { error } = await supabase
          .from("knowledge_base")
          .insert([{
            ...form,
            created_by: user.id
          }]);

        if (error) throw error;
        toast.success("文档已创建");
      }

      setOpenDialog(false);
      resetForm();
      fetchArticles();
    } catch (error: any) {
      toast.error("保存文档失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此文档吗？")) return;

    try {
      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("文档已删除");
      fetchArticles();
    } catch (error: any) {
      toast.error("删除文档失败: " + error.message);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      category: "",
      status: "published"
    });
    setSelectedArticle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">知识库</h1>
          <p className="text-muted-foreground">创建和管理文档</p>
        </div>
        {userRole === "admin" && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setViewMode("create"); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                创建文档
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode === "create" && "创建文档"}
                  {viewMode === "edit" && "编辑文档"}
                  {viewMode === "view" && "查看文档"}
                </DialogTitle>
              </DialogHeader>
              
              {(viewMode === "create" || viewMode === "edit") ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>标题</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="文档标题"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="例如: 操作指南, 常见问题"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="文档内容..."
                      rows={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm({ ...form, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="published">已发布</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSave}>
                      {viewMode === "edit" ? "更新" : "创建"}
                    </Button>
                  </div>
                </div>
              ) : viewMode === "view" && selectedArticle ? (
                <div className="space-y-4 py-4">
                  <div>
                    <Label>标题</Label>
                    <p className="text-xl font-semibold">{selectedArticle.title}</p>
                  </div>
                  {selectedArticle.category && (
                    <div>
                      <Label>分类</Label>
                      <Badge>{selectedArticle.category}</Badge>
                    </div>
                  )}
                  <div>
                    <Label>内容</Label>
                    <div className="prose max-w-none whitespace-pre-wrap">
                      {selectedArticle.content}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setOpenDialog(false)}>
                      关闭
                    </Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无文档
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>
                        {article.category && <Badge variant="outline">{article.category}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.status === "published" ? "default" : "secondary"}>
                          {article.status === "published" ? "已发布" : "草稿"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(article.created_at), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedArticle(article);
                              setViewMode("view");
                              setOpenDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {userRole === "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setForm({
                                    title: article.title,
                                    content: article.content,
                                    category: article.category || "",
                                    status: article.status
                                  });
                                  setViewMode("edit");
                                  setOpenDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(article.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

export default KnowledgeBase;