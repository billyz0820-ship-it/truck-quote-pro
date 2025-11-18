import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Search, AlertTriangle, ChevronDown, Copy, History } from "lucide-react";
import { PricingConfigTabs } from "@/components/carrier/PricingConfigTabs";
import { ProfitabilityAnalyzer } from "@/lib/profitabilityAnalyzer";

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
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [carrier, setCarrier] = useState("FedEx");
  const [customPrices, setCustomPrices] = useState<any>({});
  const [effectiveDateFrom, setEffectiveDateFrom] = useState<string>("");
  const [effectiveDateTo, setEffectiveDateTo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [customersRes, templatesRes, accountsRes, pricingRes] = await Promise.all([
      supabase.from("customers").select("*").order("customer_code"),
      supabase.from("pricing_templates").select("*").order("template_name"),
      supabase.from("carrier_accounts").select("*").order("carrier"),
      supabase.from("customer_carrier_pricing")
        .select("*, customers(customer_code, company_name)")
        .order("created_at", { ascending: false }),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    
    if (pricingRes.data) {
      // Group by customer
      const groups = pricingRes.data.reduce((acc: any[], config: any) => {
        const existingGroup = acc.find(g => g.customerId === config.customer_id);
        if (existingGroup) {
          existingGroup.configs.push(config);
        } else {
          acc.push({
            customerId: config.customer_id,
            customerCode: config.customers.customer_code,
            companyName: config.customers.company_name,
            configs: [config]
          });
        }
        return acc;
      }, []);
      setCustomerGroups(groups);
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
    if (!from) return to >= today;
    if (!to) return from <= today;
    return from <= today && to >= today;
  };

  const isFutureConfig = (config: PricingConfig) => {
    if (!config.is_active) return false;
    const today = new Date().toISOString().split('T')[0];
    return config.effective_date_from && config.effective_date_from > today;
  };

  const handleOpenDialog = (config?: PricingConfig) => {
    if (config) {
      setEditingConfig(config);
      setSelectedCustomer(config.customer_id);
      setCarrier(config.carrier);
      setSelectedTemplate(config.template_id || "none");
      setCustomPrices(config.custom_prices || {});
      setEffectiveDateFrom(config.effective_date_from || "");
      setEffectiveDateTo(config.effective_date_to || "");
      setNotes(config.notes || "");
    } else {
      setEditingConfig(null);
      setSelectedCustomer("");
      setCarrier("FedEx");
      setSelectedTemplate("none");
      setCustomPrices({});
      setEffectiveDateFrom("");
      setEffectiveDateTo("");
      setNotes("");
    }
    setIsDialogOpen(true);
  };

  const handleCopy = (config: PricingConfig) => {
    setSelectedCustomer("");
    setCarrier(config.carrier);
    setSelectedTemplate(config.template_id || "none");
    setCustomPrices(config.custom_prices || {});
    setEffectiveDateFrom("");
    setEffectiveDateTo("");
    setNotes(`复制自配置 v${config.version}`);
    setEditingConfig(null);
    setIsDialogOpen(true);
    toast({ title: "配置已复制" });
  };

  const handleSave = async () => {
    try {
      if (!selectedCustomer || !carrier) {
        toast({ title: "请填写必填项", variant: "destructive" });
        return;
      }

      // Validate date range
      if (effectiveDateFrom && effectiveDateTo && effectiveDateFrom > effectiveDateTo) {
        toast({ title: "生效日期不能晚于失效日期", variant: "destructive" });
        return;
      }

      let pricingData = customPrices;

      // Load template data if selected
      if (selectedTemplate && selectedTemplate !== "none") {
        const { data: templateData } = await supabase
          .from("pricing_templates")
          .select("*")
          .eq("id", selectedTemplate)
          .single();
        
        if (templateData) {
          pricingData = {
            base_prices: templateData.base_prices,
            ahs_weight: templateData.ahs_weight,
            ahs_dim: templateData.ahs_dim,
            ahs_packing: templateData.ahs_packing,
            oversize_commercial: templateData.oversize_commercial,
            oversize_residential: templateData.oversize_residential,
            residential_fees: templateData.residential_fees,
            remote_area_fees: templateData.remote_area_fees,
            peak_surcharges: templateData.peak_surcharges,
            dim_factor: templateData.dim_factor,
            fuel_charge: templateData.fuel_charge,
            unauthorized_fee: templateData.unauthorized_fee,
            ...customPrices
          };
        }
      }

      // Get cost pricing for profitability analysis
      const { data: accountData } = await supabase
        .from("carrier_accounts")
        .select("id")
        .eq("carrier", carrier)
        .single();

      let profitabilityAnalysis = {};
      if (accountData) {
        const { data: costData } = await supabase
          .from("carrier_account_costs")
          .select("*")
          .eq("account_id", accountData.id)
          .order("effective_date", { ascending: false })
          .limit(1)
          .single();

        if (costData) {
          const costPricing = {
            base_prices: costData.base_prices as any,
            ahs_weight: costData.ahs_weight as any,
            ahs_dim: costData.ahs_dim as any,
            ahs_packing: costData.ahs_packing as any,
            oversize_commercial: costData.oversize_commercial as any,
            oversize_residential: costData.oversize_residential as any,
            residential_fees: costData.residential_fees as any,
            remote_area_fees: costData.remote_area_fees as any,
          };
          profitabilityAnalysis = ProfitabilityAnalyzer.analyze(pricingData, costPricing);
        }
      }

      // Deactivate old config if editing
      if (editingConfig) {
        await supabase
          .from("customer_carrier_pricing")
          .update({ is_active: false })
          .eq("id", editingConfig.id);
      }

      // Get next version number
      const { data: existingConfigs } = await supabase
        .from("customer_carrier_pricing")
        .select("version")
        .eq("customer_id", selectedCustomer)
        .eq("carrier", carrier)
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = existingConfigs && existingConfigs.length > 0 
        ? existingConfigs[0].version + 1 
        : 1;

      // Insert new config
      const { data, error } = await supabase
        .from("customer_carrier_pricing")
        .insert({
          customer_id: selectedCustomer,
          carrier,
          template_id: selectedTemplate && selectedTemplate !== "none" ? selectedTemplate : null,
          custom_prices: pricingData,
          effective_date_from: effectiveDateFrom || null,
          effective_date_to: effectiveDateTo || null,
          notes,
          version: nextVersion,
          is_active: true,
          profitability_analysis: profitabilityAnalysis,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if effective date is set
      if (effectiveDateFrom && data) {
        await supabase
          .from("customer_pricing_notifications")
          .insert({
            customer_id: selectedCustomer,
            pricing_config_id: data.id,
            title: "价格配置更新通知",
            message: `您的${carrier}运费配置已更新，将于${effectiveDateFrom}生效${effectiveDateTo ? `，${effectiveDateTo}失效` : ''}。`,
            effective_date: effectiveDateFrom
          });
      }

      toast({ title: "保存成功" });
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    }
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客户报价管理</h1>
          <p className="text-muted-foreground mt-2">按客户分组管理运费报价配置</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
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
        {filteredGroups.map((group) => {
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
                            <Button size="sm" variant="ghost" onClick={() => handleCopy(config)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(config)}>
                              <Edit className="h-4 w-4" />
                            </Button>
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
                      <Button variant="ghost" size="sm" className="w-full">
                        <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${
                          expandedGroups.has(group.customerId) ? 'rotate-180' : ''
                        }`} />
                        {expandedGroups.has(group.customerId) ? '收起' : '展开'}历史和未来配置
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {/* Future Configurations */}
                      {futureConfigs.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2 text-blue-600">未来配置</h3>
                          {futureConfigs.map((config) => (
                            <div key={config.id} className="border rounded-lg p-3 mb-2 bg-blue-50/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Badge variant="secondary">{config.carrier}</Badge>
                                  <span className="text-sm text-muted-foreground ml-2">v{config.version}</span>
                                  {config.effective_date_from && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      将于 {config.effective_date_from} 生效
                                    </p>
                                  )}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(config)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Historical Configurations */}
                      {historicalConfigs.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2 text-muted-foreground">历史配置</h3>
                          {historicalConfigs.map((config) => (
                            <div key={config.id} className="border rounded-lg p-3 mb-2 opacity-60">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Badge variant="outline">{config.carrier}</Badge>
                                  <span className="text-sm text-muted-foreground ml-2">v{config.version}</span>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {config.effective_date_from || '开始'} ~ {config.effective_date_to || '结束'}
                                  </p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(config)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无数据</p>
        </div>
      )}

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "编辑报价配置" : "新增报价配置"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>客户 *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
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
              </div>
              <div>
                <Label>快递公司 *</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(accounts.map(a => a.carrier))).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>生效日期</Label>
                <Input
                  type="date"
                  value={effectiveDateFrom}
                  onChange={(e) => setEffectiveDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>失效日期</Label>
                <Input
                  type="date"
                  value={effectiveDateTo}
                  onChange={(e) => setEffectiveDateTo(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>使用账套（可选）</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="不使用账套" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不使用账套</SelectItem>
                  {templates.filter(t => t.carrier === carrier).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>备注</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="输入备注信息..."
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 block">自定义价格</Label>
              <PricingConfigTabs config={customPrices} onChange={setCustomPrices} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
