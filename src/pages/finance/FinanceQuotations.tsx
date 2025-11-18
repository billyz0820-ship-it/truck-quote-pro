import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomerPricing {
  id: string;
  customer_id: string;
  carrier: string;
  effective_date_from: string | null;
  effective_date_to: string | null;
  notes: string | null;
  version: number;
  profitability_analysis: any;
  customers: {
    customer_code: string;
    company_name: string;
  };
  pricing_templates: {
    template_name: string;
  } | null;
}

const FinanceQuotations = () => {
  const { userRole } = useAuth();
  const [pricingConfigs, setPricingConfigs] = useState<CustomerPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userRole === 'admin') {
      fetchCurrentPricingConfigs();
    }
  }, [userRole]);

  const fetchCurrentPricingConfigs = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('customer_carrier_pricing')
        .select(`
          *,
          customers(customer_code, company_name),
          pricing_templates(template_name)
        `)
        .eq('is_active', true)
        .or(`effective_date_from.lte.${today},effective_date_from.is.null`)
        .or(`effective_date_to.gte.${today},effective_date_to.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPricingConfigs(data || []);
    } catch (error) {
      console.error('Error fetching pricing configs:', error);
      toast.error('获取报价配置失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredConfigs = pricingConfigs.filter(config =>
    config.customers.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.customers.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        unprofitable.push(names[key] || key);
      }
    });
    
    return unprofitable;
  };

  if (userRole !== 'admin') {
    return <div className="p-6">您没有权限访问此页面</div>;
  }

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">当前报价</h1>
          <p className="text-muted-foreground mt-2">查看当前时间段内的客户报价配置</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索客户名称、客户编号或快递公司..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {config.customers.company_name}
                    </CardTitle>
                    {hasUnprofitableItems(config.profitability_analysis) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">亏损项目:</p>
                              {getUnprofitableDetails(config.profitability_analysis).map((item, idx) => (
                                <p key={idx} className="text-sm">• {item}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.customers.customer_code}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{config.carrier}</Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    版本 {config.version}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {config.pricing_templates && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">使用账套:</span>
                    <span>{config.pricing_templates.template_name}</span>
                  </div>
                )}
                {config.effective_date_from && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">生效日期:</span>
                    <span>{config.effective_date_from}</span>
                  </div>
                )}
                {config.effective_date_to && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">失效日期:</span>
                    <span>{config.effective_date_to}</span>
                  </div>
                )}
                {config.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-muted-foreground mb-1">备注:</p>
                    <p>{config.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无当前生效的报价配置</p>
        </div>
      )}
    </div>
  );
};

export default FinanceQuotations;
