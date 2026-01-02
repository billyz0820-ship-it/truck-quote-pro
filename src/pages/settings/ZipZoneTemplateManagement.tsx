import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zipZoneTemplateApi } from "@/utils/api";
import { Pagination } from "@/components/ui/pagination";

interface ZipZoneTemplate {
  id: string;
  name: string;
  remark: string;
  isRelevance: boolean;
  customerId: string;
  customerName: string;
}

interface TemplateListResponse {
  items: ZipZoneTemplate[];
  totalCount: number;
}

interface FilterParams {
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortValue: boolean;
  sorting: string;
  name: string[];
  customerId: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function ZipZoneTemplateManagement() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ZipZoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchName, setSearchName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 模拟客户数据 - 实际应用中应该从API获取
  const [customers] = useState([
    { id: "customer1", name: "客户A" },
    { id: "customer2", name: "客户B" },
    { id: "customer3", name: "客户C" },
  ]);

  const filterParams: FilterParams = {
    pageIndex: currentPage,
    pageSize: pageSize,
    sortField: "",
    sortValue: true,
    sorting: "",
    name: searchName ? searchName.split(',').map(n => n.trim()).filter(n => n) : [],
    customerId: selectedCustomer,
  };

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, searchName, selectedCustomer]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      console.log('=== 获取邮编分区模板列表 ===');
      console.log('请求参数:', filterParams);
      
      const response = await zipZoneTemplateApi.getTemplateList(filterParams);
      console.log('API响应:', response);

      if (response && response.items) {
        setTemplates(response.items);
        setTotalCount(response.totalCount || 0);
        console.log('模板数据:', response.items);
      } else {
        setTemplates([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('获取模板列表失败:', error);
      toast({
        title: "获取数据失败",
        description: error.message || "无法获取邮编分区模板列表",
        variant: "destructive",
      });
      setTemplates([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // 搜索时重置到第一页
  };

  const handleReset = () => {
    setSearchName("");
    setSelectedCustomer("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 改变每页数量时重置到第一页
  };

  const handleEdit = (template: ZipZoneTemplate) => {
    console.log('编辑模板:', template);
    // TODO: 实现编辑功能
  };

  const handleDelete = (template: ZipZoneTemplate) => {
    console.log('删除模板:', template);
    // TODO: 实现删除功能
  };

  const handleView = (template: ZipZoneTemplate) => {
    console.log('查看模板:', template);
    // TODO: 实现查看功能
  };

  const handleCreate = () => {
    console.log('创建新模板');
    // TODO: 实现创建功能
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">邮编分区模板管理</h1>
          <p className="text-muted-foreground mt-2">管理邮编分区模板配置，支持客户关联</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增模板
        </Button>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">模板名称（多选用逗号隔开）</label>
              <Input
                placeholder="输入模板名称，多个用逗号隔开"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">客户筛选</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部客户</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">操作</label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
                <Button onClick={handleReset} variant="ghost">
                  重置
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>模板列表</span>
            <Badge variant="secondary">共 {totalCount} 条记录</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">暂无数据</div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>模板名称</TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>关联状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.customerName || '无'}</TableCell>
                        <TableCell className="max-w-xs truncate">{template.remark || '无'}</TableCell>
                        <TableCell>
                          <Badge variant={template.isRelevance ? "default" : "secondary"}>
                            {template.isRelevance ? "已关联" : "未关联"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(template)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(template)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">每页显示</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">条</span>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / pageSize)}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}