import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  effective_date_from: string | null;
  effective_date_to: string | null;
  notes: string | null;
  version: number;
  custom_prices: any;
}

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
}

const SERVICE_TYPES = {
  FedEx: ["Ground", "Home Delivery", "2Day", "Economy", "Priority Overnight", "Standard Overnight"],
  UPS: ["Ground", "Next Day Air", "2nd Day Air", "3 Day Select"],
  USPS: ["Priority Mail", "First Class", "Priority Mail Express"],
};

const ZONES = ["Zone-2", "Zone-3", "Zone-4", "Zone-5", "Zone-6", "Zone-7", "Zone-8"];
const PAGE_SIZE = 10;

const FinanceQuotations = () => {
  const { user, userRole } = useAuth();
  const [pricingConfig, setPricingConfig] = useState<CustomerPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("FedEx");
  const [selectedService, setSelectedService] = useState<string>("Ground");
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = ['admin', 'customer_service', 'operations'].includes(userRole || '');

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    } else if (user) {
      fetchCustomerForUser();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCurrentPricing();
    }
  }, [selectedCustomer, selectedCarrier, selectedService]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_code, company_name')
        .eq('status', 'active')
        .order('customer_code');

      if (error) throw error;
      setCustomers(data || []);
      if (data && data.length > 0) {
        setSelectedCustomer(data[0].id);
      }
    } catch (error: any) {
      toast.error('加载客户列表失败');
    }
  };

  const fetchCustomerForUser = async () => {
    try {
      const { data: customerUser, error } = await supabase
        .from('customer_users')
        .select('customer_id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSelectedCustomer(customerUser.customer_id);
    } catch (error: any) {
      toast.error('加载客户信息失败');
    }
  };

  const fetchCurrentPricing = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customer_carrier_pricing')
        .select('*')
        .eq('customer_id', selectedCustomer)
        .eq('is_active', true)
        .eq('carrier', selectedCarrier);

      if (error) throw error;

      const filtered = data?.filter(d => {
        const customPrices = d.custom_prices as any;
        return !customPrices?.service_type || customPrices?.service_type === selectedService;
      });

      setPricingConfig(filtered && filtered.length > 0 ? filtered[0] : null);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error fetching pricing:', error);
      toast.error('加载报价失败');
    } finally {
      setLoading(false);
    }
  };

  // Generate weight-based pricing data
  const getWeightPricing = () => {
    if (!pricingConfig?.custom_prices?.base_prices) return [];
    
    const basePrices = pricingConfig.custom_prices.base_prices;
    const weights: number[] = [];
    
    // Generate weights from 1 to 150
    for (let i = 1; i <= 150; i++) {
      weights.push(i);
    }

    return weights.map(weight => {
      const row: any = { weight };
      ZONES.forEach(zone => {
        const zoneKey = zone.replace('Zone-', '');
        if (basePrices[zoneKey]) {
          // Find the price for this weight
          const zoneData = basePrices[zoneKey];
          if (typeof zoneData === 'object') {
            row[zone] = zoneData[weight.toString()] || zoneData[weight] || '-';
          } else {
            row[zone] = zoneData;
          }
        } else {
          row[zone] = '-';
        }
      });
      return row;
    });
  };

  const weightPricing = getWeightPricing();
  const totalPages = Math.ceil(weightPricing.length / PAGE_SIZE);
  const paginatedWeightPricing = weightPricing.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Get surcharge items
  const getSurchargeItems = () => {
    if (!pricingConfig?.custom_prices) return [];
    
    const customPrices = pricingConfig.custom_prices;
    const items = [];

    // Residential fee
    if (customPrices.residential_fees) {
      const fees = customPrices.residential_fees;
      if (typeof fees === 'object') {
        Object.entries(fees).forEach(([key, value]) => {
          items.push({ name: `住宅地址附加费 (${key})`, value: `$${value}/包裹` });
        });
      } else {
        items.push({ name: '住宅地址附加费', value: `$${fees}/包裹` });
      }
    }

    // Fuel charge
    if (customPrices.fuel_charge !== undefined) {
      items.push({ name: '燃油费·运费*百分比', value: `${(customPrices.fuel_charge * 100).toFixed(2)}%` });
    }

    // AHS fees
    if (customPrices.ahs_dim) {
      items.push({ name: 'AHS(额外处理费)-超长/包装不规范', value: '费用', link: true });
    }
    if (customPrices.ahs_weight) {
      items.push({ name: 'AHS(额外处理费)-超重', value: '费用', link: true });
    }

    // Oversize
    if (customPrices.oversize_commercial || customPrices.oversize_residential) {
      items.push({ name: '超大超尺寸费', value: '费用', link: true });
    }

    // Address correction
    if (customPrices.address_correction_fee !== undefined) {
      items.push({ name: '地址修正', value: `$${customPrices.address_correction_fee}/包裹` });
    }

    // Signature services
    if (customPrices.signature_services) {
      const sig = customPrices.signature_services;
      if (typeof sig === 'object') {
        Object.entries(sig).forEach(([key, value]) => {
          items.push({ name: `签名签收 (${key})`, value: `$${value}/包裹` });
        });
      } else {
        items.push({ name: '签名签收', value: `$${sig}/包裹` });
      }
    }

    // Remote area fees
    if (customPrices.remote_area_fees) {
      const remote = customPrices.remote_area_fees;
      if (typeof remote === 'object') {
        if (remote.DAS_ground || remote.DAS) {
          items.push({ name: 'Delivery Area Surcharge偏远地区', value: `派送偏远地址 $${remote.DAS_ground || remote.DAS}/包裹` });
        }
        if (remote.DAS_extended_ground || remote.DAS_extended) {
          items.push({ name: 'Extend Delivery Area Surcharge超偏远地区', value: `派送超偏远地址 $${remote.DAS_extended_ground || remote.DAS_extended}/包裹` });
        }
        if (remote.DAS_remote_ground || remote.DAS_remote) {
          items.push({ name: 'DAS-Remote Delivery Area Surcharge超级偏远地区', value: `派送超级偏远地址 $${remote.DAS_remote_ground || remote.DAS_remote}/包裹` });
        }
      }
    }

    // Dim factor
    if (customPrices.dim_factor !== undefined) {
      items.push({ name: '体积除数', value: `长*宽*高/${customPrices.dim_factor}, 长度单位inch，重量单位lbs` });
    }

    // Unauthorized fee
    if (customPrices.unauthorized_fee !== undefined) {
      items.push({ name: 'Unauthorized', value: `$${customPrices.unauthorized_fee}/包裹` });
    }

    // Peak surcharges
    if (customPrices.peak_surcharges) {
      items.push({ name: '旺季附加费以每年官网公告为准', value: '', isHeader: true });
      items.push({ name: 'Demand-AHS', value: '📋', link: true });
    }

    return items;
  };

  const surchargeItems = getSurchargeItems();

  if (loading && !pricingConfig) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">当前报价</h1>
          <p className="text-muted-foreground mt-2">查看快递报价配置</p>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        {isAdmin && (
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="选择客户" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.customer_code} - {customer.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
          <SelectTrigger className="w-[150px]">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Surcharge Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded" />
                其他附加费项目
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">收费项</TableHead>
                    <TableHead>费率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surchargeItems.map((item, index) => (
                    <TableRow key={index} className={item.isHeader ? "bg-muted/50" : ""}>
                      <TableCell className={item.isHeader ? "font-semibold" : ""}>
                        <div className="flex items-center gap-1">
                          {item.link ? (
                            <span className="text-primary cursor-pointer hover:underline">{item.name}</span>
                          ) : (
                            item.name
                          )}
                          {item.name.includes('AHS') && !item.isHeader && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                额外处理费详情
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={item.link ? "text-primary cursor-pointer hover:underline" : ""}>
                        {item.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right: Weight-based Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded" />
                重量区间费用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">重量(lbs)</TableHead>
                      {ZONES.map(zone => (
                        <TableHead key={zone} className="font-semibold text-center">{zone}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWeightPricing.map((row, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-muted/10" : ""}>
                        <TableCell className="font-medium">{row.weight}</TableCell>
                        {ZONES.map(zone => (
                          <TableCell key={zone} className="text-center">
                            {typeof row[zone] === 'number' ? row[zone].toFixed(2) : row[zone]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, weightPricing.length)} 共{weightPricing.length}条
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{PAGE_SIZE}条/页</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前往
                    </Button>
                    <span className="px-2 text-sm">{currentPage}</span>
                    <span className="text-sm text-muted-foreground">页</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">共{totalPages}页</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinanceQuotations;
