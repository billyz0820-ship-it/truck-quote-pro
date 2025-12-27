import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { api } from "@/utils/api";
import { LogisticsAccountCarrierEnum } from "@/types/order";
import { currentEnv } from "@/config/api";

const LogisticsServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 20,
    totalCount: 0
  });
  const [filters, setFilters] = useState({
    carrier: undefined as LogisticsAccountCarrierEnum | undefined,
    sortField: "CreatedTime",
    sortValue: false, // false 倒叙
    sorting: undefined as string | undefined
  });
  const [formData, setFormData] = useState({
    name: "",
    serviceCode: "",
    description: "",
    country: "",
    carrier: LogisticsAccountCarrierEnum.FedEx
  });

  // 承运商选项 - 根据最新的枚举定义
  const carrierOptions = [
    { value: LogisticsAccountCarrierEnum.FedEx, label: "FedEx" },
    { value: LogisticsAccountCarrierEnum.Ups, label: "UPS" },
    { value: LogisticsAccountCarrierEnum.Amazon, label: "Amazon" },
    { value: LogisticsAccountCarrierEnum.Ontrac, label: "Ontrac" },
    { value: LogisticsAccountCarrierEnum.Usps, label: "USPS" },
    { value: LogisticsAccountCarrierEnum.GoFo, label: "GoFo" },
    { value: LogisticsAccountCarrierEnum.UniUni, label: "UniUni" }
  ];

  useEffect(() => {
    fetchServices();
  }, [pagination.pageIndex, pagination.pageSize, filters.carrier, filters.sortField, filters.sortValue]);

  const handlePageChange = (newPageIndex: number) => {
    setPagination(prev => ({
      ...prev,
      pageIndex: newPageIndex
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      pageIndex: 1 // 重置到第一页
    }));
  };

  const handleCarrierFilter = (carrierValue: string) => {
    const carrier = carrierValue === "all" ? undefined : parseInt(carrierValue) as LogisticsAccountCarrierEnum;
    setFilters(prev => ({
      ...prev,
      carrier: carrier
    }));
    setPagination(prev => ({
      ...prev,
      pageIndex: 1 // 重置到第一页
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortValue: !prev.sortValue // 切换排序方向
    }));
  };

  const fetchServices = async () => {
    try {
      console.log('=== 开始获取物流服务列表 ===');
      const requestData = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortField: filters.sortField,
        sortValue: filters.sortValue,
        sorting: filters.sorting,
        carrier: filters.carrier
      };
      
      console.log('请求参数:', requestData);
      console.log('当前环境:', currentEnv);
      console.log('API基础URL:', import.meta.env.MODE);
      
      // 使用 postRaw 获取完整响应进行调试
      const rawResponse = await api.postRaw('/api/v1/LogisticsService/GetList', requestData);
      console.log('=== RAW RESPONSE ===');
      console.log('rawResponse:', rawResponse);
      console.log('rawResponse type:', typeof rawResponse);
      
      const response = await api.post('/api/v1/LogisticsService/GetList', requestData);
      
      console.log('=== 完整的API响应 ===');
      console.log('response:', response);
      console.log('response的类型:', typeof response);
      console.log('response是否包含items:', 'items' in response);
      console.log('response是否包含totalCount:', 'totalCount' in response);
      
      if (response && typeof response === 'object') {
        console.log('items数组:', response.items);
        console.log('items数组类型:', typeof response.items);
        console.log('items数组长度:', response.items?.length);
        console.log('totalCount:', response.totalCount);
        
        const servicesData = response.items || [];
        console.log('最终设置的服务数据:', servicesData);
        console.log('服务数据长度:', servicesData.length);
        
        if (servicesData.length > 0) {
          console.log('第一个服务对象:', servicesData[0]);
          console.log('第一个服务的所有字段:', Object.keys(servicesData[0]));
        }
        
        setServices(servicesData);
        setPagination(prev => ({
          ...prev,
          totalCount: response.totalCount || 0
        }));
      } else {
        console.error('响应数据格式不正确:', response);
        throw new Error('获取物流服务失败：响应数据格式不正确');
      }
    } catch (error: any) {
      console.error('获取物流服务失败:', error);
      console.error('错误详情:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      toast.error("加载物流服务失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.serviceCode || !formData.carrier) {
      toast.error("请填写服务名称、服务编码和承运商");
      return;
    }

    try {
      console.log('=== 开始保存物流服务 ===');
      console.log('表单数据:', formData);
      
      if (editingService) {
        // 更新现有服务 - 根据API文档的参数结构
        const updateData = {
          id: editingService.id,
          name: formData.name,
          serviceCode: formData.serviceCode,
          description: formData.description || null,
          country: formData.country || null,
          carrier: formData.carrier
        };
        console.log('更新数据:', updateData);
        
        console.log('发送更新请求，数据:', updateData);
        
        // 使用 postRaw 来获取完整的原始响应
        const rawResponse = await api.postRaw('/api/v1/LogisticsService/Update', updateData);
        console.log('更新API原始响应:', rawResponse);
        
        const response = await api.post('/api/v1/LogisticsService/Update', updateData);
        console.log('更新API处理后响应:', response);
        console.log('响应类型:', typeof response);
        
        // 如果API工具已经处理了业务逻辑，response可能是成功的数据
        // 如果没有处理，response可能包含 isSuccess 字段
        if (rawResponse && rawResponse.isSuccess) {
          toast.success("更新成功");
        } else if (response) {
          // 如果没有isSuccess字段，说明API工具已经处理成功了
          toast.success("更新成功");
        } else {
          console.error('更新失败，原始响应:', rawResponse, '处理后响应:', response);
          throw new Error('更新失败');
        }
      } else {
        // 新增服务
        const insertData = {
          name: formData.name,
          serviceCode: formData.serviceCode,
          description: formData.description || null,
          country: formData.country || null,
          carrier: formData.carrier
        };
        console.log('新增数据:', insertData);
        
        console.log('发送新增请求，数据:', insertData);
        const rawResponse = await api.postRaw('/api/v1/LogisticsService/Insert', insertData);
        console.log('新增API原始响应:', rawResponse);
        
        const response = await api.post('/api/v1/LogisticsService/Insert', insertData);
        console.log('新增API处理后响应:', response);
        
        if (rawResponse && rawResponse.isSuccess) {
          toast.success("添加成功");
        } else if (response) {
          // API工具已经处理成功
          toast.success("添加成功");
        } else {
          console.error('新增失败，原始响应:', rawResponse, '处理后响应:', response);
          throw new Error('添加失败');
        }
      }
      
      setDialogOpen(false);
      setEditingService(null);
      setFormData({ 
        name: "", 
        serviceCode: "", 
        description: "", 
        country: "", 
        carrier: LogisticsAccountCarrierEnum.FedEx 
      });
      // 新增后重置到第一页
      setPagination(prev => ({
        ...prev,
        pageIndex: 1
      }));
      fetchServices();
    } catch (error: any) {
      console.error('保存物流服务失败:', error);
      toast.error("保存失败: " + error.message);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name || service.service_name || "",
      serviceCode: service.serviceCode || service.service_code || "",
      description: service.description || "",
      country: service.country || "",
      carrier: service.carrier || LogisticsAccountCarrierEnum.FedEx
    });
    setDialogOpen(true);
  };

  // 注意：根据API文档，当前没有删除功能接口
  // 可以考虑使用更新状态来实现软删除，或者隐藏删除按钮
  const handleDelete = async (id: string) => {
    // 暂时禁用删除功能，因为API文档显示没有删除接口
    toast.info("当前版本暂不支持删除物流服务，请联系管理员");
    return;
    
    /* 原删除代码，当有删除接口时可以恢复
    if (!confirm("确定要删除此物流服务吗？")) return;

    try {
      console.log('=== 开始删除物流服务 ===', { id });
      
      const response = await api.post('/api/v1/LogisticsService/Delete', { id });
      if (response && response.isSuccess) {
        toast.success("删除成功");
        // 如果当前页没有数据了，返回上一页
        if (services.length === 1 && pagination.pageIndex > 1) {
          setPagination(prev => ({
            ...prev,
            pageIndex: prev.pageIndex - 1
          }));
        } else {
          fetchServices();
        }
      } else {
        throw new Error(response?.message || '删除失败');
      }
    } catch (error: any) {
      console.error('删除物流服务失败:', error);
      toast.error("删除失败: " + error.message);
    }
    */
  };

  // 调试信息
  console.log('=== 渲染前状态 ===');
  console.log('services:', services);
  console.log('services.length:', services.length);
  console.log('pagination:', pagination);
  console.log('loading:', loading);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">物流服务</h1>
          <p className="text-muted-foreground">管理承运商的各种物流服务</p>
        </div>
        <Button onClick={() => {
          setEditingService(null);
          setFormData({ 
            name: "", 
            serviceCode: "", 
            description: "", 
            country: "", 
            carrier: LogisticsAccountCarrierEnum.FedEx 
          });
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增服务
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>承运商筛选</Label>
            <Select 
              value={filters.carrier?.toString() || "all"} 
              onValueChange={handleCarrierFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部承运商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部承运商</SelectItem>
                {carrierOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleSort("name")}
                  >
                    物流服务名称
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleSort("serviceCode")}
                  >
                    服务编码
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleSort("country")}
                  >
                    国家
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleSort("carrier")}
                  >
                    承运商
                    <ArrowUpDown className="h-4 w-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name || service.service_name}</TableCell>
                    <TableCell>{service.serviceCode || service.service_code}</TableCell>
                    <TableCell>{service.country || '-'}</TableCell>
                    <TableCell>{carrierOptions.find(c => c.value === service.carrier)?.label || service.carrier}</TableCell>
                    <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <Badge variant={(service.is_active ?? true) ? "default" : "secondary"}>
                      {(service.is_active ?? true) ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* 暂时移除删除按钮，因为API不支持删除功能 */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(service.id)}
                      disabled
                      className="opacity-50 cursor-not-allowed"
                      title="当前版本暂不支持删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无物流服务数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {services.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  显示第 {(pagination.pageIndex - 1) * pagination.pageSize + 1} - {Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount)} 条，共 {pagination.totalCount} 条
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">每页显示</Label>
                  <Select 
                    value={pagination.pageSize.toString()} 
                    onValueChange={(v) => handlePageSizeChange(parseInt(v))}
                  >
                    <SelectTrigger className="w-16 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pageIndex - 1)}
                  disabled={pagination.pageIndex <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm px-3">
                  第 {pagination.pageIndex} 页，共 {Math.ceil(pagination.totalCount / pagination.pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pageIndex + 1)}
                  disabled={pagination.pageIndex >= Math.ceil(pagination.totalCount / pagination.pageSize)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "编辑服务" : "新增服务"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>物流服务名称 *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="例: Ground Service" 
              />
            </div>
            <div className="space-y-2">
              <Label>服务编码 *</Label>
              <Input 
                value={formData.serviceCode} 
                onChange={(e) => setFormData({...formData, serviceCode: e.target.value})} 
                placeholder="例: FEDEX_GROUND" 
              />
            </div>
            <div className="space-y-2">
              <Label>承运商 *</Label>
              <Select value={formData.carrier.toString()} onValueChange={(v) => setFormData({...formData, carrier: parseInt(v)})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择承运商" />
                </SelectTrigger>
                <SelectContent>
                  {carrierOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>国家</Label>
              <Input 
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})} 
                placeholder="例: US" 
              />
            </div>
            <div className="space-y-2">
              <Label>物流描述</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="服务描述" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticsServices;
