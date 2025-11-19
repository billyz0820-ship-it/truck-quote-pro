import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { user } = useAuth();
  const [pricingConfig, setPricingConfig] = useState<CustomerPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("FedEx");
  const [selectedService, setSelectedService] = useState<string>("Ground");

  useEffect(() => {
    if (user) {
      fetchCurrentPricing();
    }
  }, [user, selectedCarrier, selectedService]);

  const fetchCurrentPricing = async () => {
    try {
      setLoading(true);
      
      // First get customer_id from customer_users table
      const { data: customerUser, error: customerUserError } = await supabase
        .from('customer_users')
        .select('customer_id')
        .eq('user_id', user?.id)
        .single();
      
      if (customerUserError) throw customerUserError;
      
      const { data, error } = await supabase
        .from('customer_carrier_pricing')
        .select(`
          *,
          customers(customer_code, company_name),
          pricing_templates(template_name)
        `)
        .eq('customer_id', customerUser.customer_id)
        .eq('is_active', true)
        .eq('carrier', selectedCarrier);

      if (error) throw error;

      const filtered = data?.filter(d => {
        const customPrices = d.custom_prices as any;
        return !customPrices?.service_type || customPrices?.service_type === selectedService;
      });

      setPricingConfig(filtered && filtered.length > 0 ? filtered[0] : null);
    } catch (error: any) {
      console.error('Error fetching pricing:', error);
      toast.error('加载报价失败');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
        return `$${value.toFixed(2)}`;
      case 'zone':
        return typeof value === 'object' ? 'Zone-based pricing' : value;
      case 'surcharge':
        if (typeof value === 'object') {
          return Object.entries(value)
            .map(([k, v]) => `${k}: $${v}`)
            .join(', ');
        }
        return `$${value}`;
      case 'remote':
        if (typeof value === 'object') {
          return Object.entries(value)
            .map(([k, v]) => `${k}: $${v}`)
            .join(', ');
        }
        return value;
      case 'signature':
        if (typeof value === 'object') {
          return Object.entries(value)
            .map(([k, v]) => `${k}: $${v}`)
            .join(', ');
        }
        return value;
      default:
        return String(value);
    }
  };

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">当前报价</h1>
          <p className="text-muted-foreground mt-2">查看您的快递报价配置</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
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

      {!pricingConfig ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            暂无报价配置
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRICING_FIELDS.map((field) => {
              const customPrices = pricingConfig.custom_prices as any;
              const value = customPrices?.[field.key];
              
              return (
                <Card key={field.key} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{field.label}</CardTitle>
                    <CardDescription className="text-xs">
                      {field.type === 'zone' && '基于区域的价格'}
                      {field.type === 'percentage' && '百分比费率'}
                      {field.type === 'number' && '固定金额'}
                      {field.type === 'surcharge' && '附加费用'}
                      {field.type === 'remote' && '偏远地区附加费'}
                      {field.type === 'signature' && '签名服务费用'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-primary">
                      {formatValue(value, field.type)}
                    </div>
                    {field.type === 'zone' && typeof value === 'object' && value && (
                      <div className="mt-3 space-y-1 text-sm">
                        {Object.entries(value).slice(0, 3).map(([zone, price]: [string, any]) => (
                          <div key={zone} className="flex justify-between text-muted-foreground">
                            <span>{zone}:</span>
                            <span className="font-medium">${typeof price === 'object' ? JSON.stringify(price) : price}</span>
                          </div>
                        ))}
                        {Object.keys(value).length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{Object.keys(value).length - 3} more zones...
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>配置信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">承运商:</span>
                <Badge variant="outline">{pricingConfig.carrier}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">服务类型:</span>
                <span className="font-medium">{selectedService}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本:</span>
                <span className="font-medium">v{pricingConfig.version}</span>
              </div>
              {pricingConfig.effective_date_from && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">生效日期:</span>
                  <span className="font-medium">
                    {new Date(pricingConfig.effective_date_from).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              {pricingConfig.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">备注:</p>
                  <p className="text-sm mt-1">{pricingConfig.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FinanceQuotations;
