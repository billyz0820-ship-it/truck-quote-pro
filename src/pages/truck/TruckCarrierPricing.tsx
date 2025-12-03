import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const ZONES = ["A", "B", "C", "D", "E", "F"];

interface BasePrice {
  minWeight: number;
  maxWeight: number;
  zones: { [key: string]: number };
}

interface ServiceSurcharge {
  name: string;
  condition: string;
  minFee: number;
  perLbFee: number;
}

interface AccessorialCharge {
  name: string;
  condition: string;
  feeType: "fixed" | "perUnit" | "perCwt";
  fee: number;
  unit?: string;
}

interface ZoneMapping {
  fromState: string;
  toState: string;
  zone: string;
}

const TruckCarrierPricing = () => {
  const { carrierId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pricingName, setPricingName] = useState("默认报价");
  const [basePrices, setBasePrices] = useState<BasePrice[]>([
    { minWeight: 1, maxWeight: 150, zones: { A: 105.56, B: 112.22, C: 117.78, D: 123.33, E: 131.11, F: 136.67 } },
  ]);
  const [serviceSurcharges, setServiceSurcharges] = useState<ServiceSurcharge[]>([
    { name: "Basic", condition: "住宅门外送货", minFee: 0, perLbFee: 0 },
    { name: "Standard - 单人服务", condition: "送货至主入口内部", minFee: 16.25, perLbFee: 0.09 },
    { name: "Standard - 团队服务", condition: "超过125磅或总尺寸超110英寸", minFee: 73.75, perLbFee: 0.45 },
    { name: "Room of Choice", condition: "送货至指定房间", minFee: 87.50, perLbFee: 0.49 },
    { name: "Deluxe", condition: "指定房间+拆包+垃圾清理", minFee: 103.75, perLbFee: 0.59 },
    { name: "Premier", condition: "指定房间+拆包+15分钟安装", minFee: 203.75, perLbFee: 0.87 },
  ]);
  const [accessorialCharges, setAccessorialCharges] = useState<AccessorialCharge[]>([
    { name: "额外楼梯费", condition: "第一层后的额外楼层", feeType: "perUnit", fee: 30, unit: "层" },
    { name: "额外人工费", condition: "需要额外人力", feeType: "perUnit", fee: 55, unit: "小时/人" },
    { name: "组装服务", condition: "Premier服务的组装", feeType: "perUnit", fee: 40, unit: "15分钟" },
    { name: "尝试取货/送货 - 单人常规", condition: "常规服务点单人尝试", feeType: "fixed", fee: 50 },
    { name: "尝试取货/送货 - 单人偏远", condition: "偏远服务点单人尝试", feeType: "fixed", fee: 75 },
    { name: "运输中取消及退回", condition: "运输过程中取消并退回", feeType: "fixed", fee: 75 },
    { name: "床垫处理费", condition: "床垫处理", feeType: "perUnit", fee: 60, unit: "件" },
  ]);
  const [zoneMappings, setZoneMappings] = useState<ZoneMapping[]>([]);

  const { data: carrier } = useQuery({
    queryKey: ["truck-carrier", carrierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("truck_carriers")
        .select("*")
        .eq("id", carrierId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingPricing } = useQuery({
    queryKey: ["truck-carrier-pricing", carrierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("truck_carrier_pricing")
        .select("*")
        .eq("carrier_id", carrierId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingPricing) {
      setPricingName(existingPricing.pricing_name);
      if (existingPricing.base_prices && Array.isArray(existingPricing.base_prices)) {
        setBasePrices(existingPricing.base_prices as unknown as BasePrice[]);
      }
      if (existingPricing.service_surcharges && Array.isArray(existingPricing.service_surcharges)) {
        setServiceSurcharges(existingPricing.service_surcharges as unknown as ServiceSurcharge[]);
      }
      if (existingPricing.accessorial_charges && Array.isArray(existingPricing.accessorial_charges)) {
        setAccessorialCharges(existingPricing.accessorial_charges as unknown as AccessorialCharge[]);
      }
      if (existingPricing.zone_table && typeof existingPricing.zone_table === "object") {
        const mappings: ZoneMapping[] = [];
        const zoneTable = existingPricing.zone_table as Record<string, Record<string, string>>;
        Object.entries(zoneTable).forEach(([fromState, toStates]) => {
          Object.entries(toStates).forEach(([toState, zone]) => {
            mappings.push({ fromState, toState, zone });
          });
        });
        setZoneMappings(mappings);
      }
    }
  }, [existingPricing]);

  const savePricingMutation = useMutation({
    mutationFn: async () => {
      // Convert zone mappings to nested object
      const zoneTable: Record<string, Record<string, string>> = {};
      zoneMappings.forEach((mapping) => {
        if (!zoneTable[mapping.fromState]) {
          zoneTable[mapping.fromState] = {};
        }
        zoneTable[mapping.fromState][mapping.toState] = mapping.zone;
      });

      const pricingData = {
        carrier_id: carrierId,
        pricing_name: pricingName,
        base_prices: JSON.parse(JSON.stringify(basePrices)),
        service_surcharges: JSON.parse(JSON.stringify(serviceSurcharges)),
        accessorial_charges: JSON.parse(JSON.stringify(accessorialCharges)),
        zone_table: zoneTable,
        is_active: true,
      };

      if (existingPricing) {
        const { error } = await supabase
          .from("truck_carrier_pricing")
          .update(pricingData)
          .eq("id", existingPricing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("truck_carrier_pricing").insert([pricingData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truck-carrier-pricing", carrierId] });
      toast.success("报价配置保存成功");
    },
    onError: () => toast.error("保存失败"),
  });

  const addBasePrice = () => {
    const lastPrice = basePrices[basePrices.length - 1];
    const newMinWeight = lastPrice ? lastPrice.maxWeight + 1 : 1;
    setBasePrices([
      ...basePrices,
      {
        minWeight: newMinWeight,
        maxWeight: newMinWeight + 50,
        zones: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
      },
    ]);
  };

  const updateBasePrice = (index: number, field: string, value: any) => {
    const updated = [...basePrices];
    if (field === "minWeight" || field === "maxWeight") {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      updated[index] = {
        ...updated[index],
        zones: { ...updated[index].zones, [field]: Number(value) },
      };
    }
    setBasePrices(updated);
  };

  const removeBasePrice = (index: number) => {
    setBasePrices(basePrices.filter((_, i) => i !== index));
  };

  const addZoneMapping = () => {
    setZoneMappings([...zoneMappings, { fromState: "CA", toState: "NY", zone: "E" }]);
  };

  const updateZoneMapping = (index: number, field: keyof ZoneMapping, value: string) => {
    const updated = [...zoneMappings];
    updated[index] = { ...updated[index], [field]: value };
    setZoneMappings(updated);
  };

  const removeZoneMapping = (index: number) => {
    setZoneMappings(zoneMappings.filter((_, i) => i !== index));
  };

  const addServiceSurcharge = () => {
    setServiceSurcharges([
      ...serviceSurcharges,
      { name: "", condition: "", minFee: 0, perLbFee: 0 },
    ]);
  };

  const updateServiceSurcharge = (index: number, field: keyof ServiceSurcharge, value: any) => {
    const updated = [...serviceSurcharges];
    updated[index] = { ...updated[index], [field]: field === "name" || field === "condition" ? value : Number(value) };
    setServiceSurcharges(updated);
  };

  const removeServiceSurcharge = (index: number) => {
    setServiceSurcharges(serviceSurcharges.filter((_, i) => i !== index));
  };

  const addAccessorialCharge = () => {
    setAccessorialCharges([
      ...accessorialCharges,
      { name: "", condition: "", feeType: "fixed", fee: 0 },
    ]);
  };

  const updateAccessorialCharge = (index: number, field: keyof AccessorialCharge, value: any) => {
    const updated = [...accessorialCharges];
    updated[index] = { ...updated[index], [field]: value };
    setAccessorialCharges(updated);
  };

  const removeAccessorialCharge = (index: number) => {
    setAccessorialCharges(accessorialCharges.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => navigate("/dashboard/truck/carriers")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>返回</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div>
          <h1 className="text-2xl font-bold">报价配置 - {carrier?.carrier_name}</h1>
          <p className="text-muted-foreground">配置承运商的基础价格、服务附加费和分区表</p>
        </div>
        <div className="ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => savePricingMutation.mutate()}>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </Button>
              </TooltipTrigger>
              <TooltipContent>保存报价配置</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="mb-4">
        <Label>报价名称</Label>
        <Input
          value={pricingName}
          onChange={(e) => setPricingName(e.target.value)}
          placeholder="请输入报价名称"
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="base-prices">
        <TabsList>
          <TabsTrigger value="base-prices">基础价格</TabsTrigger>
          <TabsTrigger value="service-surcharges">服务附加费</TabsTrigger>
          <TabsTrigger value="accessorial-charges">附加收费项目</TabsTrigger>
          <TabsTrigger value="zone-table">分区表</TabsTrigger>
        </TabsList>

        <TabsContent value="base-prices">
          <Card>
            <CardHeader>
              <CardTitle>基础价格配置</CardTitle>
              <CardDescription>按重量区间和分区配置基础运费（1-2000磅）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>最小重量(磅)</TableHead>
                      <TableHead>最大重量(磅)</TableHead>
                      {ZONES.map((zone) => (
                        <TableHead key={zone}>分区 {zone}</TableHead>
                      ))}
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {basePrices.map((price, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={2000}
                            value={price.minWeight}
                            onChange={(e) => updateBasePrice(index, "minWeight", e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={2000}
                            value={price.maxWeight}
                            onChange={(e) => updateBasePrice(index, "maxWeight", e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        {ZONES.map((zone) => (
                          <TableCell key={zone}>
                            <Input
                              type="number"
                              step="0.01"
                              value={price.zones[zone] || 0}
                              onChange={(e) => updateBasePrice(index, zone, e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBasePrice(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button variant="outline" onClick={addBasePrice} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                添加重量区间
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-surcharges">
          <Card>
            <CardHeader>
              <CardTitle>服务附加费配置</CardTitle>
              <CardDescription>配置不同服务等级的附加费用</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>服务等级</TableHead>
                    <TableHead>收费条件</TableHead>
                    <TableHead>最低收费($)</TableHead>
                    <TableHead>每磅收费($)</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceSurcharges.map((surcharge, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={surcharge.name}
                          onChange={(e) => updateServiceSurcharge(index, "name", e.target.value)}
                          placeholder="服务等级名称"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={surcharge.condition}
                          onChange={(e) => updateServiceSurcharge(index, "condition", e.target.value)}
                          placeholder="收费条件"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={surcharge.minFee}
                          onChange={(e) => updateServiceSurcharge(index, "minFee", e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={surcharge.perLbFee}
                          onChange={(e) => updateServiceSurcharge(index, "perLbFee", e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeServiceSurcharge(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" onClick={addServiceSurcharge} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                添加服务等级
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessorial-charges">
          <Card>
            <CardHeader>
              <CardTitle>附加收费项目配置</CardTitle>
              <CardDescription>配置额外服务的收费项目</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收费项目</TableHead>
                    <TableHead>收费条件</TableHead>
                    <TableHead>收费类型</TableHead>
                    <TableHead>收费标准($)</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessorialCharges.map((charge, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={charge.name}
                          onChange={(e) => updateAccessorialCharge(index, "name", e.target.value)}
                          placeholder="收费项目"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={charge.condition}
                          onChange={(e) => updateAccessorialCharge(index, "condition", e.target.value)}
                          placeholder="收费条件"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={charge.feeType}
                          onValueChange={(value: "fixed" | "perUnit" | "perCwt") =>
                            updateAccessorialCharge(index, "feeType", value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">固定费用</SelectItem>
                            <SelectItem value="perUnit">按单位</SelectItem>
                            <SelectItem value="perCwt">按百磅</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={charge.fee}
                          onChange={(e) => updateAccessorialCharge(index, "fee", Number(e.target.value))}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={charge.unit || ""}
                          onChange={(e) => updateAccessorialCharge(index, "unit", e.target.value)}
                          placeholder="单位"
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAccessorialCharge(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" onClick={addAccessorialCharge} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                添加收费项目
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zone-table">
          <Card>
            <CardHeader>
              <CardTitle>分区表配置</CardTitle>
              <CardDescription>配置州到州的运输分区（A-F）</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发货州</TableHead>
                    <TableHead>收货州</TableHead>
                    <TableHead>分区</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={mapping.fromState}
                          onValueChange={(value) => updateZoneMapping(index, "fromState", value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.toState}
                          onValueChange={(value) => updateZoneMapping(index, "toState", value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.zone}
                          onValueChange={(value) => updateZoneMapping(index, "zone", value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ZONES.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeZoneMapping(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" onClick={addZoneMapping} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                添加分区映射
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TruckCarrierPricing;