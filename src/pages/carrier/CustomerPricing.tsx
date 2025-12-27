import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Search, AlertTriangle, ChevronDown, Copy, History, Eye, FileText } from "lucide-react";
import { PriceHistoryDialog } from "@/components/carrier/PriceHistoryDialog";
import { useTab } from "@/contexts/TabContext";
import { useNavigate } from "react-router-dom";

interface CustomerGroup {
  customerId: string;
  customerCode: string;
  companyName: string;
  configs: PricingConfig[];
}

interface PricingConfig {
  id: string;
  customer_id: string;
  carrier: string;
  effective_date_from: string | null;
  effective_date_to: string | null;
  notes: string | null;
  version: number;
  is_active: boolean;
  template_id: string | null;
  custom_prices: any;
  profitability_analysis: any;
  created_at: string;
}

export default function CustomerPricing() {
  const { openTab } = useTab();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; config: any }>({ 
    open: false, config: null 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('=== CustomerPricing 状态更新 ===');
    console.log('客户分组数量:', customerGroups.length);
    console.log('搜索词:', searchTerm);
    console.log('过滤后分组数量:', filteredGroups.length);
    console.log('加载状态:', loading);
  }, [customerGroups, searchTerm, loading]);

  const fetchData = async () => {
    try {
      console.log('=== 开始获取客户报价数据 ===');
      const { data: pricingRes, error } = await supabase
        .from("customer_carrier_pricing")
        .select("*, customers(customer_code, company_name)")
        .order("created_at", { ascending: false });
      
      console.log('客户报价查询结果:', { data: pricingRes, error });

      if (error) {
        console.error('查询客户报价失败:', error);
        toast({
          title: "获取数据失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!pricingRes || pricingRes.length === 0) {
        console.log('没有找到客户报价数据');
        setCustomerGroups([]);
        return;
      }

      const groups = pricingRes.reduce((acc: any[], config: any) => {
        const existingGroup = acc.find(g => g.customerId === config.customer_id);
        if (existingGroup) {
          existingGroup.configs.push(config);
        } else {
          acc.push({
            customerId: config.customer_id,
            customerCode: config.customers?.customer_code || 'Unknown',
            companyName: config.customers?.company_name || 'Unknown',
            configs: [config]
          });
        }
        return acc;
      }, []);

      console.log('处理后的客户分组:', groups);
      setCustomerGroups(groups);
    } catch (error: any) {
      console.error('获取客户报价异常:', error);
      toast({
        title: "获取数据异常",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (customerId: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(customerId)) {
      newSet.delete(customerId);
    } else {
      newSet.add(customerId);
    }
    setExpandedGroups(newSet);
  };

  const isCurrentConfig = (config: PricingConfig) => {
    if (!config.is_active) return false;
    const today = new Date().toISOString().split('T')[0];
    const from = config.effective_date_from;
    const to = config.effective_date_to;
    
    if (!from && !to) return true;
    if (!from) return to! >= today;
    if (!to) return from <= today;
    return from <= today && to >= today;
  };

  const isFutureConfig = (config: PricingConfig) => {
    if (!config.is_active) return false;
    const today = new Date().toISOString().split('T')[0];
    return config.effective_date_from && config.effective_date_from > today;
  };

  const hasUnprofitableItems = (analysis: any) => {
    if (!analysis || typeof analysis !== 'object') return false;
    return Object.values(analysis).some((item: any) => item?.profitable === false);
  };

  const getUnprofitableDetails = (analysis: any) => {
    if (!analysis || typeof analysis !== 'object') return [];
    const unprofitable: string[] = [];
    
    Object.entries(analysis).forEach(([key, value]: [string, any]) => {
      if (value?.profitable === false) {
        const names: Record<string, string> = {
          base_prices: '基础价格',
          ahs_weight: 'AHS超重',
          ahs_dim: 'AHS超尺寸',
          ahs_packing: 'AHS包装',
          oversize_commercial: '商业超大件',
          oversize_residential: '住宅超大件',
          residential_fees: '住宅费用',
          remote_area_fees: '偏远地址'
        };
        unprofitable.push(`${names[key] || key} (${value.lossCount}/${value.totalItems}项亏损)`);
      }
    });
    
    return unprofitable;
  };

  const filteredGroups = customerGroups.filter(group =>
    group.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-semibold">加载中...</h3>
          <p className="text-sm mt-2">正在获取客户报价数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客户报价管理</h1>
          <p className="text-muted-foreground mt-2">按客户分组管理运费报价配置</p>
        </div>
        <Button onClick={() => {
          console.log('=== 点击新增配置按钮 ===');
          const targetPath = "/dashboard/carrier/customer-pricing/new";
          console.log('目标路径:', targetPath);
          
          // 尝试使用 TabContext
          try {
            openTab({
              title: "新增客户报价",
              path: targetPath,
              icon: FileText,
            });
            console.log('TabContext openTab 调用成功');
          } catch (error) {
            console.error('TabContext openTab 失败:', error);
            // 备用方案：直接导航
            navigate(targetPath);
            console.log('使用备用导航方案');
          }
        }}>
          <Plus className="h-4 w-4 mr-2" />
          新增配置
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索客户名称或编号..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? '没有找到匹配的客户' : '暂无客户报价数据'}
                </h3>
                <p className="text-sm">
                  {searchTerm 
                    ? '请尝试修改搜索条件' 
                    : '点击"新增配置"按钮创建第一个客户报价'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const currentConfigs = group.configs.filter(isCurrentConfig);
            const futureConfigs = group.configs.filter(isFutureConfig);
            const historicalConfigs = group.configs.filter(c => !isCurrentConfig(c) && !isFutureConfig(c));

            return (
            <Card key={group.customerId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{group.companyName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{group.customerCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentConfigs.length} 当前</Badge>
                    {futureConfigs.length > 0 && (
                      <Badge variant="secondary">{futureConfigs.length} 未来</Badge>
                    )}
                    {historicalConfigs.length > 0 && (
                      <Badge variant="outline">{historicalConfigs.length} 历史</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Current Configurations */}
                {currentConfigs.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h3 className="font-semibold text-sm">当前生效配置</h3>
                    {currentConfigs.map((config) => (
                      <div key={config.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge>{config.carrier}</Badge>
                            <span className="text-sm text-muted-foreground">v{config.version}</span>
                            {hasUnprofitableItems(config.profitability_analysis) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1 max-w-xs">
                                      <p className="font-semibold">存在亏损项目:</p>
                                      {getUnprofitableDetails(config.profitability_analysis).map((item, idx) => (
                                        <p key={idx} className="text-sm">• {item}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => openTab({
                                    title: `复制报价: ${config.carrier}`,
                                    path: `/dashboard/carrier/customer-pricing/new?copyFrom=${config.id}`,
                                    icon: FileText,
                                  })}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>复制</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => openTab({
                                    title: `编辑报价: ${config.carrier}`,
                                    path: `/dashboard/carrier/customer-pricing/${config.id}`,
                                    icon: FileText,
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          {config.effective_date_from && (
                            <p className="text-muted-foreground">
                              生效: {config.effective_date_from}
                              {config.effective_date_to && ` ~ ${config.effective_date_to}`}
                            </p>
                          )}
                          {config.notes && <p className="text-muted-foreground">{config.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible for future and historical */}
                {(futureConfigs.length > 0 || historicalConfigs.length > 0) && (
                  <Collapsible 
                    open={expandedGroups.has(group.customerId)}
                    onOpenChange={() => toggleGroup(group.customerId)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedGroups.has(group.customerId) ? 'rotate-180' : ''}`} />
                        {futureConfigs.length > 0 && `${futureConfigs.length} 个未来配置`}
                        {futureConfigs.length > 0 && historicalConfigs.length > 0 && ' / '}
                        {historicalConfigs.length > 0 && `${historicalConfigs.length} 个历史配置`}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {futureConfigs.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">未来配置</h3>
                          {futureConfigs.map((config) => (
                            <div key={config.id} className="border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{config.carrier}</Badge>
                                  <span className="text-sm text-muted-foreground">v{config.version}</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => openTab({
                                    title: `编辑报价: ${config.carrier}`,
                                    path: `/dashboard/carrier/customer-pricing/${config.id}`,
                                    icon: FileText,
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-sm space-y-1">
                                <p className="text-muted-foreground">
                                  生效: {config.effective_date_from}
                                  {config.effective_date_to && ` ~ ${config.effective_date_to}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {historicalConfigs.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground">历史配置</h3>
                          {historicalConfigs.slice(0, 3).map((config) => (
                            <div key={config.id} className="border rounded-lg p-4 opacity-60">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{config.carrier}</Badge>
                                <span className="text-sm text-muted-foreground">v{config.version}</span>
                                <span className="text-sm text-muted-foreground">
                                  {config.effective_date_from} ~ {config.effective_date_to || '永久'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {historicalConfigs.length > 3 && (
                            <Button 
                              variant="link" 
                              onClick={() => setHistoryDialog({ open: true, config: historicalConfigs[0] })}
                            >
                              <History className="h-4 w-4 mr-1" />
                              查看全部 {historicalConfigs.length} 条历史记录
                            </Button>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          );
        })
        )}
      </div>

      <PriceHistoryDialog
        open={historyDialog.open}
        onOpenChange={(open) => setHistoryDialog({ ...historyDialog, open })}
        config={historyDialog.config}
      />
    </div>
  );
}
