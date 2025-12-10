import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MenuResource {
  id: string;
  title: string;
  title_en: string | null;
  code: string;
  resource_type: string;
  menu_type: string | null;
  menu_ownership: string;
  path: string | null;
  view_path: string | null;
  view_name: string | null;
  sort_order: number;
  parent_id: string | null;
  is_cacheable: boolean;
  is_closable: boolean;
  is_disabled: boolean;
  children?: MenuResource[];
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  menu: "资源菜单",
  group: "资源分组",
  function: "功能点"
};

const MENU_OWNERSHIP_LABELS: Record<string, string> = {
  system: "系统菜单",
  customer: "客户菜单"
};

export default function ResourceManagement() {
  const [resources, setResources] = useState<MenuResource[]>([]);
  const [flatResources, setFlatResources] = useState<MenuResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<MenuResource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    title_en: "",
    code: "",
    resource_type: "menu",
    menu_type: "view",
    menu_ownership: "customer",
    path: "",
    view_path: "",
    view_name: "",
    sort_order: 0,
    parent_id: "",
    is_cacheable: true,
    is_closable: true,
    is_disabled: false
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_resources')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      
      const items = (data || []) as MenuResource[];
      setFlatResources(items);
      
      // Build tree structure
      const tree = buildTree(items);
      setResources(tree);
    } catch (error: any) {
      toast.error("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (items: MenuResource[]): MenuResource[] => {
    const map = new Map<string, MenuResource>();
    const roots: MenuResource[] = [];

    items.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.code) {
        toast.error("请填写标题和Code");
        return;
      }

      const resourceData = {
        title: formData.title,
        title_en: formData.title_en || null,
        code: formData.code,
        resource_type: formData.resource_type,
        menu_type: formData.menu_type,
        menu_ownership: formData.menu_ownership,
        path: formData.path || null,
        view_path: formData.view_path || null,
        view_name: formData.view_name || null,
        sort_order: formData.sort_order,
        parent_id: formData.parent_id || null,
        is_cacheable: formData.is_cacheable,
        is_closable: formData.is_closable,
        is_disabled: formData.is_disabled
      };

      if (editingResource) {
        const { error } = await supabase
          .from('menu_resources')
          .update(resourceData)
          .eq('id', editingResource.id);
        if (error) throw error;
        toast.success("资源已更新");
      } else {
        const { error } = await supabase
          .from('menu_resources')
          .insert(resourceData);
        if (error) throw error;
        toast.success("资源已添加");
      }

      setDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此资源吗？子资源也会被删除。")) return;
    try {
      const { error } = await supabase
        .from('menu_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("资源已删除");
      fetchResources();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleToggleStatus = async (resource: MenuResource) => {
    try {
      const { error } = await supabase
        .from('menu_resources')
        .update({ is_disabled: !resource.is_disabled })
        .eq('id', resource.id);
      if (error) throw error;
      toast.success(resource.is_disabled ? "已启用" : "已禁用");
      fetchResources();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
  };

  const handleEdit = (resource: MenuResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      title_en: resource.title_en || "",
      code: resource.code,
      resource_type: resource.resource_type,
      menu_type: resource.menu_type || "view",
      menu_ownership: resource.menu_ownership,
      path: resource.path || "",
      view_path: resource.view_path || "",
      view_name: resource.view_name || "",
      sort_order: resource.sort_order,
      parent_id: resource.parent_id || "",
      is_cacheable: resource.is_cacheable,
      is_closable: resource.is_closable,
      is_disabled: resource.is_disabled
    });
    setDialogOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    resetForm();
    setFormData(prev => ({ ...prev, parent_id: parentId }));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      title: "",
      title_en: "",
      code: "",
      resource_type: "menu",
      menu_type: "view",
      menu_ownership: "customer",
      path: "",
      view_path: "",
      view_name: "",
      sort_order: 0,
      parent_id: "",
      is_cacheable: true,
      is_closable: true,
      is_disabled: false
    });
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderRow = (resource: MenuResource, level: number = 0): React.ReactNode[] => {
    const hasChildren = resource.children && resource.children.length > 0;
    const isExpanded = expandedIds.has(resource.id);
    const matchesSearch = searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch && !hasChildren) return [];

    const rows: React.ReactNode[] = [];

    rows.push(
      <TableRow key={resource.id}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-6 w-6 mr-2"
                onClick={() => toggleExpand(resource.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <span className="w-8" />
            )}
            <span>{resource.title}</span>
          </div>
        </TableCell>
        <TableCell>{RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type}</TableCell>
        <TableCell>{MENU_OWNERSHIP_LABELS[resource.menu_ownership] || resource.menu_ownership}</TableCell>
        <TableCell>{resource.sort_order}</TableCell>
        <TableCell>
          <Badge 
            variant={resource.is_disabled ? "secondary" : "default"}
            className="cursor-pointer"
            onClick={() => handleToggleStatus(resource)}
          >
            {resource.is_disabled ? "禁用" : "启用"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleAddChild(resource.id)}>
              添加
            </Button>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleEdit(resource)}>
              编辑
            </Button>
            <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={() => handleDelete(resource.id)}>
              删除
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );

    if (hasChildren && isExpanded) {
      resource.children!.forEach(child => {
        rows.push(...renderRow(child, level + 1));
      });
    }

    return rows;
  };

  const filteredResources = searchTerm 
    ? flatResources.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">资源管理</h1>
          <p className="text-sm text-muted-foreground">管理系统菜单和功能资源</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          添加菜单
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="请输入关键字"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setSearchTerm("")} variant="default">
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>资源类型</TableHead>
                  <TableHead>菜单归属</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>启用状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources ? (
                  filteredResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResources.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{RESOURCE_TYPE_LABELS[r.resource_type]}</TableCell>
                        <TableCell>{MENU_OWNERSHIP_LABELS[r.menu_ownership]}</TableCell>
                        <TableCell>{r.sort_order}</TableCell>
                        <TableCell>
                          <Badge variant={r.is_disabled ? "secondary" : "default"} onClick={() => handleToggleStatus(r)} className="cursor-pointer">
                            {r.is_disabled ? "禁用" : "启用"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleAddChild(r.id)}>添加</Button>
                            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleEdit(r)}>编辑</Button>
                            <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={() => handleDelete(r.id)}>删除</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : resources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.flatMap(r => renderRow(r))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResource ? "编辑资源" : "添加菜单"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>* 标题</Label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>* 英文标题</Label>
              <Input value={formData.title_en} onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>* Code</Label>
              <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Code别名"SuperRole"表示权限管理员角色可看，别名"Alternative"表示系统菜单则客户菜单只做分别查看。且只能标识在资源类型为"资源分组"上。</p>
            </div>
            <div className="space-y-2">
              <Label>* 菜单归属</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.menu_ownership === "system"} onChange={() => setFormData(prev => ({ ...prev, menu_ownership: "system" }))} />
                  系统菜单
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.menu_ownership === "customer"} onChange={() => setFormData(prev => ({ ...prev, menu_ownership: "customer" }))} />
                  客户菜单
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>* 资源类型</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.resource_type === "group"} onChange={() => setFormData(prev => ({ ...prev, resource_type: "group" }))} />
                  资源分组
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.resource_type === "menu"} onChange={() => setFormData(prev => ({ ...prev, resource_type: "menu" }))} />
                  资源菜单
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.resource_type === "function"} onChange={() => setFormData(prev => ({ ...prev, resource_type: "function" }))} />
                  功能点
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>* 菜单类型</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.menu_type === "view"} onChange={() => setFormData(prev => ({ ...prev, menu_type: "view" }))} />
                  视图组件
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.menu_type === "external_link"} onChange={() => setFormData(prev => ({ ...prev, menu_type: "external_link" }))} />
                  外部链接
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>* Path</Label>
              <Input value={formData.path} onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))} placeholder="/dashboard" />
            </div>
            <div className="space-y-2">
              <Label>* 视图路径</Label>
              <Input value={formData.view_path} onChange={(e) => setFormData(prev => ({ ...prev, view_path: e.target.value }))} placeholder="/dashboard/index" />
            </div>
            <div className="space-y-2">
              <Label>* 视图名称</Label>
              <Input value={formData.view_name} onChange={(e) => setFormData(prev => ({ ...prev, view_name: e.target.value }))} placeholder="dashboard" />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, sort_order: Math.max(0, prev.sort_order - 1) }))}>-</Button>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} className="w-20 text-center" />
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, sort_order: prev.sort_order + 1 }))}>+</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>父级</Label>
              <Select value={formData.parent_id || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, parent_id: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {flatResources.filter(r => r.id !== editingResource?.id).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>* 可否缓存</Label>
              <Switch checked={formData.is_cacheable} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_cacheable: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>* 可否关闭</Label>
              <Switch checked={formData.is_closable} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_closable: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>* 是否禁用</Label>
              <Switch checked={formData.is_disabled} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_disabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
