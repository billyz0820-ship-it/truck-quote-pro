import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuotationExportDialog } from "@/components/carrier/QuotationExportDialog";

interface CustomerPricing {
  id: string;
  customer_id: string;
  carrier: string;
  service_type?: string;
  effective_date_from: string | null;
  effective_date_to: string | null;
  notes: string | null;
  version: number;
  profitability_analysis: any;
  custom_prices: any;
  customers: {
    customer_code: string;
    company_name: string;
  };
  pricing_templates: {
    template_name: string;
  } | null;
}

const SERVICE_TYPES = {
  FedEx: ["Ground", "2Day", "Economy", "Priority Overnight", "Standard Overnight"],
  UPS: ["Ground", "Next Day Air", "2nd Day Air", "3 Day Select"],
  USPS: ["Priority Mail", "First Class", "Priority Mail Express"],
};

const PRICING_FIELDS = [
  { key: 'base_prices', label: '基础价格', type: 'zone' },
  { key: 'fuel_charge', label: '燃油附加费', type: 'percentage' },
  { key: 'dim_factor', label: '体积系数', type: 'number' },
  { key: 'residential_fees', label: '住宅费用', type: 'surcharge' },
  { key: 'remote_area_fees', label: '偏远地址', type: 'remote' },
  { key: 'ahs_weight', label: 'AHS超重', type: 'surcharge' },
  { key: 'ahs_dim', label: 'AHS超尺寸', type: 'surcharge' },
  { key: 'ahs_packing', label: 'AHS包装', type: 'surcharge' },
  { key: 'oversize_commercial', label: '商业超大件', type: 'surcharge' },
  { key: 'oversize_residential', label: '住宅超大件', type: 'surcharge' },
  { key: 'signature_services', label: '签名服务', type: 'signature' },
  { key: 'delivery_intercept_fee', label: '拦截附加费', type: 'number' },
  { key: 'address_correction_fee', label: '地址修正费', type: 'number' },
  { key: 'dangerous_goods_fee', label: '危险品附加费', type: 'number' },
  { key: 'unauthorized_fee', label: '未授权费用', type: 'number' },
];

const FinanceQuotations = () => {
  const { userRole } = useAuth();
  const [pricingConfigs, setPricingConfigs] = useState<CustomerPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("FedEx");
  const [selectedService, setSelectedService] = useState<string>("Ground");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['base']));
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchCurrentPricingConfigs();
    }
  }, [userRole, selectedCarrier, selectedService]);

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
        .eq('carrier', selectedCarrier)
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
    config.customers.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUnprofitableItems = (analysis: any) => {
    if (!analysis || typeof analysis !== 'object') return false;
    return Object.values(analysis).some((item: any) => item?.profitable === false);
  };

  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const selectedConfigs = filteredConfigs.filter(config => 
    selectedCustomers.has(config.customer_id)
  );

  const getFieldValue = (config: CustomerPricing, field: any) => {
    const data = config.custom_prices;
    if (!data || !data[field.key]) return null;

    switch (field.type) {
      case 'zone':
        // For zone prices, show a summary or reference price
        const zonePrices = data[field.key];
        if (typeof zonePrices === 'object' && zonePrices !== null) {
          // Show zone 2 weight 1 as reference
          return zonePrices['2_1'] ? `$${zonePrices['2_1']}` : '已配置';
        }
        return '已配置';
      case 'percentage':
        return `${data[field.key]}%`;
      case 'number':
        return `$${data[field.key]}`;
      case 'signature':
        const sig = data[field.key];
        return sig ? `直接:$${sig.direct_signature} 间接:$${sig.indirect_signature} 成人:$${sig.adult_signature}` : null;
      case 'surcharge':
        return Array.isArray(data[field.key]) && data[field.key].length > 0 ? '已配置' : null;
      case 'remote':
        return data[field.key]?.length > 0 ? '已配置' : null;
      default:
        return data[field.key];
    }
  };

  const compareValues = (configs: CustomerPricing[], field: any) => {
    if (configs.length < 2) return null;
    
    const values = configs.map(config => {
      const data = config.custom_prices;
      if (!data) return null;
      
      if (field.key === 'base_prices' && data.base_prices) {
        // For base prices, compare zone 2 weight 1 as reference
        return data.base_prices['2_1'] || 0;
      }
      
      if (field.type === 'percentage' || field.type === 'number') {
        return parseFloat(data[field.key]) || 0;
      }
      
      return null;
    });

    if (values.some(v => v === null)) return null;
    
    const numValues = values as number[];
    const minValue = Math.min(...numValues);
    const maxValue = Math.max(...numValues);
    
    return numValues.map(v => {
      if (v === minValue && v !== maxValue) return 'lowest';
      if (v === maxValue && v !== minValue) return 'highest';
      return 'equal';
    });
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
          <p className="text-muted-foreground mt-2">查看和对比当前时间段内的客户报价配置</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户名称或客户编号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FedEx">FedEx</SelectItem>
            <SelectItem value="UPS">UPS</SelectItem>
            <SelectItem value="USPS">USPS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES[selectedCarrier as keyof typeof SERVICE_TYPES]?.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCustomers.size === 0 ? (
        <div className="grid gap-4">
          {filteredConfigs.map((config) => (
            <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader onClick={() => toggleCustomerSelection(config.customer_id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedCustomers.has(config.customer_id)}
                      onCheckedChange={() => toggleCustomerSelection(config.customer_id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
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
                                <p className="font-semibold">存在亏损项目</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.customers.customer_code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{config.carrier}</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      版本 {config.version}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              已选择 {selectedCustomers.size} 个客户进行对比
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                导出对比
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCustomers(new Set())}
              >
                清除选择
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] sticky left-0 bg-background z-10">
                      收费项目
                    </TableHead>
                    {selectedConfigs.map((config) => (
                      <TableHead key={config.id} className="text-center min-w-[200px]">
                        <div className="space-y-1">
                          <p className="font-semibold">{config.customers.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.customers.customer_code}
                          </p>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRICING_FIELDS.map((field) => {
                    const isExpanded = expandedSections.has(field.key);
                    const comparisons = compareValues(selectedConfigs, field);
                    
                    return (
                      <TableRow key={field.key}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            {field.type === 'zone' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSection(field.key)}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {field.label}
                          </div>
                        </TableCell>
                        {selectedConfigs.map((config, idx) => {
                          const value = getFieldValue(config, field);
                          const comparison = comparisons?.[idx];
                          
                          return (
                            <TableCell
                              key={config.id}
                              className={`text-center ${
                                comparison === 'lowest'
                                  ? 'bg-green-50 dark:bg-green-950 font-semibold text-green-700 dark:text-green-300'
                                  : comparison === 'highest'
                                  ? 'bg-red-50 dark:bg-red-950 font-semibold text-red-700 dark:text-red-300'
                                  : ''
                              }`}
                            >
                              {value || '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无当前生效的报价配置</p>
        </div>
      )}

      <QuotationExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        configs={selectedConfigs}
        fields={PRICING_FIELDS}
      />
    </div>
  );
};

export default FinanceQuotations;
