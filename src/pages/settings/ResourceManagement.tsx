import { useState, useEffect, useMemo } from "react";
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
import { api } from "@/utils/api";
import { toast } from "sonner";

interface SysResourceTreeResponse {
  id: string | null;
  code: string | null;                                              
  title: string | null;
  titleEn: string | null;
  description: string | null;
  resourceType: number; // 1: Group, 2: Menu, 3: Func
  parentId: string | null;
  opened: boolean | null;
  path: string | null;
  viewPath: string | null;
  viewName: string | null;
  viewCache: boolean | null;
  icon: string | null;
  orderIndex: number | null;
  isHidden?: boolean | null; // 可选字段，API可能不返回
  closable: boolean | null;
  linkType?: number | null; // 1: SPA视图, 2: 外链
  openMode?: number | null; // 1: 内部窗口, 2: 外部窗口
  moduleId: string | null;
  defaultPageId: string | null;
  systemType: number; // SystemTypeEnum: 1: Management, 2: Customer
  chilelist?: SysResourceTreeResponse[];
}

interface UpdateResourceRequest {
  id?: string | null;
  code?: string | null;
  title?: string | null;
  titleEn?: string | null;
  description?: string | null;
  resourceType?: number;
  parentId?: string | null;
  opened?: boolean | null;
  path?: string | null;
  viewCache?: boolean;
  icon?: string | null;
  orderIndex?: number | null;
  closable?: boolean | null;
  linkType?: number | null;
  openMode?: number | null;
  systemType?: number;
  viewPath?: string | null;
  viewName?: string | null;
}

const RESOURCE_TYPE_LABELS: Record<number, string> = {
  1: "菜单分组",
  2: "菜单",
  3: "功能点"
};

const SYSTEM_TYPE_LABELS: Record<number, string> = {
  1: "Management (管理端)",
  2: "Customer (客户端)"
};

const LINK_TYPE_LABELS: Record<number, string> = {
  1: "SPA 视图",
  2: "外链"
};

const OPEN_MODE_LABELS: Record<number, string> = {
  1: "内部窗口打开",
  2: "外部窗口打开"
};

export default function ResourceManagement() {
  const [resources, setResources] = useState<SysResourceTreeResponse[]>([]);
  const [flatResources, setFlatResources] = useState<SysResourceTreeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<SysResourceTreeResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sysType, setSysType] = useState<number>(1); // 默认系统类型
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    id: null as string | null,
    title: "",
    titleEn: "",
    code: "",
    resourceType: 2, // 默认为菜单
    path: "",
    viewPath: "",
    viewName: "",
    orderIndex: 0,
    parentId: "",
    viewCache: true,
    closable: true,
    systemType: 1,
    description: "",
    icon: "",
    opened: null as boolean | null,
    linkType: null as number | null,
    openMode: 1, // 默认为1
    isHidden: false
  });

  useEffect(() => {
    fetchResources();
  }, [sysType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await api.postRaw('/api/v1/Resource/GetAll', {
        key: searchTerm || null,
        pageIndex: 1,
        pageSize: 1000,
        sysType: sysType
      });
      
      if (response.isSuccess) {
        const items = response.data || [];
        setFlatResources(items);
        
        // API已经返回树形结构，直接设置
        setResources(items);
        
        // 默认不展开任何资源，让用户手动控制
        setExpandedIds(new Set());
      } else {
        throw new Error(response.message || '获取资源失败');
      }
    } catch (error: any) {
      toast.error("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 由于API已经返回树形结构，不再需要手动构建树
  const flattenResources = (items: SysResourceTreeResponse[]): SysResourceTreeResponse[] => {
    const result: SysResourceTreeResponse[] = [];
    
    const flatten = (items: SysResourceTreeResponse[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.chilelist && item.chilelist.length > 0) {
          flatten(item.chilelist);
        }
      });
    };
    
    flatten(items);
    return result;
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.code) {
        toast.error("请填写标题和Code");
        return;
      }

      if (editingResource) {
        // 编辑资源
        const resourceData = {
          id: editingResource?.id || null,
          title: formData.title || null,
          titleEn: formData.titleEn || null,
          code: formData.code || null,
          resourceType: formData.resourceType,
          path: formData.path || null,
          viewPath: formData.viewPath || null,
          viewName: formData.viewName || null,
          orderIndex: formData.orderIndex,
          parentId: formData.parentId || null,
          viewCache: formData.viewCache,
          closable: formData.closable,
          systemType: formData.systemType,
          description: formData.description || null,
          icon: formData.icon || null,
          opened: formData.resourceType === 1 ? true : null, // 分组类型默认展开
          linkType: formData.linkType || (formData.path ? 1 : null), // 有path且为SPA视图时为1，外链时为2
          openMode: formData.resourceType === 2 ? 1 : null // 菜单类型时设置openMode为1
        };

        const response = await api.postRaw('/api/v1/Resource/Update', resourceData);
        
        if (response.isSuccess) {
          toast.success("资源已更新");
          setDialogOpen(false);
          resetForm();
          fetchResources();
        } else {
          throw new Error(response.message || '更新失败');
        }
      } else {
        // 创建资源
        const createResourceData = {
          title: formData.title || null,
          titleEn: formData.titleEn || null,
          resourceType: formData.resourceType,
          parentId: formData.parentId || null,
          path: formData.path || null,
          viewPath: formData.viewPath || null,
          viewName: formData.viewName || null,
          viewCache: formData.viewCache,
          icon: formData.icon || null,
          closable: formData.closable,
          linkType: formData.linkType || (formData.path ? 1 : 2), // 根据选择或默认值
          openMode: formData.resourceType === 2 ? 1 : null, // 菜单类型时设置openMode为1
          isDisabled: false, // 默认不禁用
          moduleId: null, // 可选字段，暂时为null
          systemType: formData.systemType,
          orderIndex: formData.orderIndex || null
        };

        const response = await api.postRaw('/api/v1/Resource/Create', createResourceData);
        
        if (response.isSuccess) {
          toast.success("资源已创建");
          setDialogOpen(false);
          resetForm();
          fetchResources();
        } else {
          throw new Error(response.message || '创建失败');
        }
      }
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingResourceId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingResourceId) return;
    
    try {
      const response = await api.postRaw('/api/v1/Resource/SoftDelete', {
        id: deletingResourceId
      });
      
      if (response.isSuccess) {
        toast.success("资源已删除");
        setDeleteDialogOpen(false);
        setDeletingResourceId(null);
        fetchResources();
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleToggleStatus = async (resource: SysResourceTreeResponse) => {
    try {
      // TODO: 实现切换状态API
      toast.success(resource.isHidden ? "已启用" : "已禁用");
      fetchResources();
    } catch (error: any) {
      toast.error("操作失败: " + error.message);
    }
  };

  const handleEdit = (resource: SysResourceTreeResponse) => {
    setEditingResource(resource);
    setFormData({
      id: resource.id || null,
      title: resource.title || "",
      titleEn: resource.titleEn || "",
      code: resource.code || "",
      resourceType: resource.resourceType || 2,
      path: resource.path || "",
      viewPath: resource.viewPath || "",
      viewName: resource.viewName || "",
      orderIndex: resource.orderIndex || 0,
      parentId: resource.parentId || "",
      viewCache: resource.viewCache !== undefined ? resource.viewCache : false,
      closable: resource.closable !== undefined ? resource.closable : false,
      systemType: resource.systemType || 1,
      description: resource.description || "",
      icon: resource.icon || "",
      opened: resource.opened !== undefined ? resource.opened : null,
      linkType: resource.linkType !== undefined ? resource.linkType : null,
      openMode: resource.openMode // 直接使用API返回的值，可能为null
    });
    setDialogOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    resetForm();
    setFormData(prev => ({ 
      ...prev, 
      parentId: parentId,
      systemType: sysType // 使用当前筛选的系统类型
    }));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setParentSearchTerm(""); // 重置父级搜索词
    setFormData({
      id: null,
      title: "",
      titleEn: "",
      code: "",
      resourceType: 2,
      path: "",
      viewPath: "",
      viewName: "",
      orderIndex: 0,
      parentId: "",
      viewCache: true,
      closable: true,
      systemType: sysType,
      description: "",
      icon: "",
      opened: null,
      linkType: null,
      openMode: 1,
      isHidden: false
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

  // 过滤父级选项
  const filteredParentOptions = useMemo(() => {
    const allResources = flattenResources(resources);
    return allResources.filter(r => {
      // 排除当前编辑的资源（避免自己选择自己作为父级）
      if (editingResource && r.id === editingResource.id) {
        return false;
      }
      
      // 搜索过滤
      if (!parentSearchTerm) {
        return true;
      }
      
      return (
        (r.title && r.title.toLowerCase().includes(parentSearchTerm.toLowerCase())) ||
        (r.code && r.code.toLowerCase().includes(parentSearchTerm.toLowerCase()))
      );
    });
  }, [resources, editingResource, parentSearchTerm]);

  const renderRow = (resource: SysResourceTreeResponse, level: number = 0): React.ReactNode[] => {
    const hasChildren = resource.chilelist && resource.chilelist.length > 0;
    const isExpanded = expandedIds.has(resource.id || '');
    const matchesSearch = searchTerm === "" || 
      (resource.title && resource.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (resource.code && resource.code.toLowerCase().includes(searchTerm.toLowerCase()));

    // 如果没有搜索条件，始终显示
    // 如果有搜索条件，只有匹配的项或其父项匹配的项才显示
    // 对于菜单分组，如果它有子项且没有匹配搜索，但它的子项可能匹配，所以需要特殊处理
    if (searchTerm !== "" && !matchesSearch && !hasChildren) return [];
    
    // 如果有搜索条件但当前项不匹配，检查是否有子项匹配
    if (searchTerm !== "" && !matchesSearch && hasChildren) {
      const hasMatchingChildren = resource.chilelist!.some(child => 
        (child.title && child.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (child.code && child.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (!hasMatchingChildren) return [];
    }

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
                onClick={() => toggleExpand(resource.id || '')}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <span className="w-8" />
            )}
            <span>{resource.title || ''}</span>
          </div>
        </TableCell>
        <TableCell>{RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType}</TableCell>
        <TableCell>{SYSTEM_TYPE_LABELS[resource.systemType] || resource.systemType}</TableCell>
        <TableCell>{resource.orderIndex || 0}</TableCell>
        <TableCell>
          <Badge 
            variant={resource.isHidden ? "secondary" : "default"}
            className="cursor-pointer"
            onClick={() => handleToggleStatus(resource)}
          >
            {resource.isHidden ? "隐藏" : "显示"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleAddChild(resource.id || '')}>
              添加
            </Button>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleEdit(resource)}>
              编辑
            </Button>
            <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={() => handleDelete(resource.id || '')}>
              删除
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );

    // 显示子项的逻辑：
    // 1. 无搜索条件：只有展开状态时才显示子项
    // 2. 有搜索条件：如果父项匹配搜索，显示所有子项；如果父项不匹配，只显示匹配的子项
    const shouldShowAllChildren = hasChildren && (
      (searchTerm === "" && isExpanded) || // 无搜索条件时根据展开状态
      (searchTerm !== "" && matchesSearch) // 有搜索条件且父项匹配时显示所有子项
    );
    
    if (hasChildren && resource.chilelist) {
      resource.chilelist.forEach(child => {
        // 如果要显示所有子项，或者子项本身匹配搜索条件
        const childMatchesSearch = searchTerm === "" || 
          (child.title && child.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (child.code && child.code.toLowerCase().includes(searchTerm.toLowerCase()));
          
        if (shouldShowAllChildren || childMatchesSearch) {
          rows.push(...renderRow(child, level + 1));
        }
      });
    }

    return rows;
  };

  const filteredResources = searchTerm 
    ? flattenResources(resources).filter(r => 
        (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
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
          添加资源
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchResources();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Select value={sysType.toString()} onValueChange={(v) => setSysType(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="系统类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Management (管理端)</SelectItem>
                <SelectItem value="2">Customer (客户端)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchResources} variant="default">
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
                  <TableHead>系统类型</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>显示状态</TableHead>
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
                        <TableCell>{RESOURCE_TYPE_LABELS[r.resourceType]}</TableCell>
                        <TableCell>{SYSTEM_TYPE_LABELS[r.systemType]}</TableCell>
                        <TableCell>{r.orderIndex || 0}</TableCell>
                        <TableCell>
                          <Badge variant={r.isHidden ? "secondary" : "default"} onClick={() => handleToggleStatus(r)} className="cursor-pointer">
                            {r.isHidden ? "隐藏" : "显示"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleAddChild(r.id || '')}>添加</Button>
                            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => handleEdit(r)}>编辑</Button>
                            <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={() => handleDelete(r.id || '')}>删除</Button>
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
              <Label>英文标题</Label>
              <Input value={formData.titleEn} onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>* Code</Label>
              <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>资源描述</Label>
              <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="资源描述信息" />
            </div>
            <div className="space-y-2">
              <Label>* 资源类型</Label>
              <Select value={formData.resourceType.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, resourceType: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择资源类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">菜单分组</SelectItem>
                  <SelectItem value="2">菜单</SelectItem>
                  <SelectItem value="3">功能点</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>* 系统类型</Label>
              <Select value={formData.systemType.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, systemType: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择系统类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Management (管理端)</SelectItem>
                  <SelectItem value="2">Customer (客户端)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Path (SPA视图组件name或外部链接)</Label>
              <Input value={formData.path} onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))} placeholder="/dashboard 或 https://example.com" />
            </div>
            
            {/* 链接类型选择 - 有path或已有linkType时显示 */}
            {(formData.path || formData.linkType) && (
              <div className="space-y-2">
                <Label>* 链接类型</Label>
                <Select value={formData.linkType?.toString() || "1"} onValueChange={(v) => setFormData(prev => ({ ...prev, linkType: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择链接类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">SPA 视图</SelectItem>
                    <SelectItem value="2">外链</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* 外链打开方式提示 - 仅在外链类型时显示 */}
            {(formData.path || formData.linkType) && formData.linkType === 2 && (
              <div className="space-y-2">
                <Label>外链打开方式</Label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  默认使用内部窗口打开
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>视图路径</Label>
              <Input value={formData.viewPath} onChange={(e) => setFormData(prev => ({ ...prev, viewPath: e.target.value }))} placeholder="/dashboard/index" />
            </div>
            <div className="space-y-2">
              <Label>视图名称</Label>
              <Input value={formData.viewName} onChange={(e) => setFormData(prev => ({ ...prev, viewName: e.target.value }))} placeholder="dashboard" />
            </div>
            <div className="space-y-2">
              <Label>图标</Label>
              <Input value={formData.icon} onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))} placeholder="Settings" />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, orderIndex: Math.max(0, prev.orderIndex - 1) }))}>-</Button>
                <Input type="number" value={formData.orderIndex} onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))} className="w-20 text-center" />
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, orderIndex: prev.orderIndex + 1 }))}>+</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>父级</Label>
              <div className="relative">
                <Select 
                  value={formData.parentId || "none"} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, parentId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择或搜索父级资源" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div className="sticky top-0 z-10 p-2 bg-background border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索资源..."
                          value={parentSearchTerm}
                          onChange={(e) => setParentSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <SelectItem value="none">无</SelectItem>
                      {filteredParentOptions.map(r => (
                        <SelectItem key={r.id} value={r.id || ''}>
                          <div className="flex flex-col items-start">
                            <span>{r.title}</span>
                            {r.code && (
                              <span className="text-xs text-muted-foreground">Code: {r.code}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {filteredParentOptions.length === 0 && (
                        <div className="px-2 py-1 text-sm text-muted-foreground text-center">
                          未找到匹配的资源
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>视图是否启用缓存</Label>
              <Switch checked={formData.viewCache} onCheckedChange={(v) => setFormData(prev => ({ ...prev, viewCache: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>是否可关闭</Label>
              <Switch checked={formData.closable} onCheckedChange={(v) => setFormData(prev => ({ ...prev, closable: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>是否隐藏</Label>
              <Switch checked={formData.isHidden} onCheckedChange={(v) => setFormData(prev => ({ ...prev, isHidden: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              确定要删除此资源吗？子资源也会被删除。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
