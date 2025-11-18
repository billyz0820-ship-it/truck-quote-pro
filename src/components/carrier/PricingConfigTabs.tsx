import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceImportDialog } from "./PriceImportDialog";
import { FedExAdditionalFees } from "./FedExAdditionalFees";

interface SurchargeTimeItem {
  start_date: string;
  end_date: string;
  value: number;
}

interface PricingConfig {
  base_prices: Record<string, Record<string, number>>;
  ahs_weight: Record<string, number>;
  ahs_dim: Record<string, number>;
  ahs_packing: Record<string, number>;
  oversize_commercial: Record<string, number>;
  oversize_residential: Record<string, number>;
  residential_fees: { ground: number; home: number };
  remote_area_fees: {
    das: { ground: number; home: number };
    extend: { ground: number; home: number };
    remote: { ground: number; home: number };
  };
  dim_factor: number;
  fuel_charge: number;
  unauthorized_fee: number;
  peak_surcharges: {
    economy: SurchargeTimeItem[];
    hd_ground: SurchargeTimeItem[];
    ahs: SurchargeTimeItem[];
    oversize: SurchargeTimeItem[];
    unauthorized: SurchargeTimeItem[];
    residential: SurchargeTimeItem[];
  };
  signature_services?: {
    direct_signature: number;
    indirect_signature: number;
    adult_signature: number;
  };
  delivery_intercept_fee?: number;
  address_correction_fee?: number;
  dangerous_goods_fee?: number;
}

interface PricingConfigTabsProps {
  config: Partial<PricingConfig>;
  onChange: (config: Partial<PricingConfig>) => void;
}

export function PricingConfigTabs({ config, onChange }: PricingConfigTabsProps) {
  const zones = ["2", "3", "4", "5", "6", "7"];
  const weights = Array.from({ length: 150 }, (_, i) => (i + 1).toString());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const updateConfig = (key: keyof PricingConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updateBasePrice = (weight: string, zone: string, price: number) => {
    const basePrices = config.base_prices || {};
    const weightPrices = basePrices[weight] || {};
    updateConfig("base_prices", {
      ...basePrices,
      [weight]: {
        ...weightPrices,
        [zone]: price
      }
    });
  };

  const handleImportPrices = (prices: Record<string, Record<string, number>>) => {
    updateConfig("base_prices", prices);
  };

  const loadMore = () => {
    if (visibleRange.end < weights.length) {
      setVisibleRange(prev => ({ ...prev, end: Math.min(prev.end + 50, weights.length) }));
    }
  };

  const visibleWeights = weights.slice(visibleRange.start, visibleRange.end);

  const addPeakSurchargeItem = (type: keyof PricingConfig['peak_surcharges']) => {
    const currentItems = config.peak_surcharges?.[type] || [];
    updateConfig("peak_surcharges", {
      ...config.peak_surcharges,
      [type]: [
        ...currentItems,
        {
          start_date: "",
          end_date: "",
          value: 0
        }
      ]
    });
  };

  const updatePeakSurchargeItem = (
    type: keyof PricingConfig['peak_surcharges'],
    index: number,
    field: keyof SurchargeTimeItem,
    value: any
  ) => {
    const items = [...(config.peak_surcharges?.[type] || [])];
    items[index] = { ...items[index], [field]: value };
    updateConfig("peak_surcharges", {
      ...config.peak_surcharges,
      [type]: items
    });
  };

  const removePeakSurchargeItem = (type: keyof PricingConfig['peak_surcharges'], index: number) => {
    const items = config.peak_surcharges?.[type] || [];
    updateConfig("peak_surcharges", {
      ...config.peak_surcharges,
      [type]: items.filter((_, i) => i !== index)
    });
  };

  const peakSurchargeTypes = [
    { key: 'economy' as const, label: 'Economy' },
    { key: 'hd_ground' as const, label: 'HD & Ground' },
    { key: 'ahs' as const, label: 'AHS' },
    { key: 'oversize' as const, label: 'Oversize' },
    { key: 'unauthorized' as const, label: 'Unauthorized' },
    { key: 'residential' as const, label: 'Residential' }
  ];

  return (
    <div className="space-y-6">
      {/* 基础价格配置 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">基础价格（按重量和区域）</h3>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            批量导入
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left font-medium border-r">Weight (lbs)</th>
                  {zones.map((zone) => (
                    <th key={zone} className="px-4 py-2 text-center font-medium border-r last:border-r-0">
                      Zone-{zone}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-background">
                {visibleWeights.map((weight) => (
                  <tr key={weight} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium border-r">{weight}</td>
                    {zones.map((zone) => (
                      <td key={zone} className="px-2 py-1 border-r last:border-r-0">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-8 text-center border-0 bg-transparent focus-visible:ring-1"
                          value={config.base_prices?.[weight]?.[zone] || ""}
                          onChange={(e) => updateBasePrice(weight, zone, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRange.end < weights.length && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={loadMore}>
                  加载更多 ({visibleRange.end}/{weights.length})
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <PriceImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportPrices}
      />

      {/* AHS费用 */}
      <div className="space-y-4">
        <h3 className="font-semibold">AHS费用配置</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">AHS-Weight（超重）</h4>
            {zones.map((zone) => (
              <div key={zone} className="flex gap-2 mb-2">
                <Label className="w-20">Zone {zone}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={config.ahs_weight?.[zone] || ""}
                  onChange={(e) => updateConfig("ahs_weight", {
                    ...config.ahs_weight,
                    [zone]: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">AHS-Dim（超尺寸）</h4>
            {zones.map((zone) => (
              <div key={zone} className="flex gap-2 mb-2">
                <Label className="w-20">Zone {zone}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={config.ahs_dim?.[zone] || ""}
                  onChange={(e) => updateConfig("ahs_dim", {
                    ...config.ahs_dim,
                    [zone]: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">AHS-Packing（非标包装）</h4>
            {zones.map((zone) => (
              <div key={zone} className="flex gap-2 mb-2">
                <Label className="w-20">Zone {zone}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={config.ahs_packing?.[zone] || ""}
                  onChange={(e) => updateConfig("ahs_packing", {
                    ...config.ahs_packing,
                    [zone]: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 超大件费用 */}
      <div className="space-y-4">
        <h3 className="font-semibold">超大件费用</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">商业地址</h4>
            {zones.map((zone) => (
              <div key={zone} className="flex gap-2 mb-2">
                <Label className="w-20">Zone {zone}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={config.oversize_commercial?.[zone] || ""}
                  onChange={(e) => updateConfig("oversize_commercial", {
                    ...config.oversize_commercial,
                    [zone]: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">住宅地址</h4>
            {zones.map((zone) => (
              <div key={zone} className="flex gap-2 mb-2">
                <Label className="w-20">Zone {zone}</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={config.oversize_residential?.[zone] || ""}
                  onChange={(e) => updateConfig("oversize_residential", {
                    ...config.oversize_residential,
                    [zone]: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 住宅费用 */}
      <div className="space-y-4">
        <h3 className="font-semibold">住宅配送费</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ground服务</Label>
            <Input 
              type="number" 
              step="0.01"
              value={config.residential_fees?.ground || ""}
              onChange={(e) => updateConfig("residential_fees", {
                ...config.residential_fees,
                ground: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <div>
            <Label>Home服务</Label>
            <Input 
              type="number" 
              step="0.01"
              value={config.residential_fees?.home || ""}
              onChange={(e) => updateConfig("residential_fees", {
                ...config.residential_fees,
                home: parseFloat(e.target.value) || 0
              })}
            />
          </div>
        </div>
      </div>

      {/* 偏远地址费用 */}
      <div className="space-y-4">
        <h3 className="font-semibold">偏远地址附加费</h3>
        <div className="space-y-3">
          {["das", "extend", "remote"].map((type) => (
            <div key={type} className="grid grid-cols-3 gap-4">
              <Label className="capitalize self-center">{type.toUpperCase()}</Label>
              <div>
                <Label className="text-xs">Ground</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={config.remote_area_fees?.[type as keyof typeof config.remote_area_fees]?.ground || ""}
                  onChange={(e) => updateConfig("remote_area_fees", {
                    ...config.remote_area_fees,
                    [type]: {
                      ...config.remote_area_fees?.[type as keyof typeof config.remote_area_fees],
                      ground: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Home</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={config.remote_area_fees?.[type as keyof typeof config.remote_area_fees]?.home || ""}
                  onChange={(e) => updateConfig("remote_area_fees", {
                    ...config.remote_area_fees,
                    [type]: {
                      ...config.remote_area_fees?.[type as keyof typeof config.remote_area_fees],
                      home: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 其他费用 */}
      <div className="space-y-6">
        <h3 className="font-semibold">其他费用</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>体积除数 (Dim Factor)</Label>
            <Input 
              type="number"
              value={config.dim_factor || ""}
              onChange={(e) => updateConfig("dim_factor", parseFloat(e.target.value) || 0)}
              placeholder="例：139"
            />
          </div>
          <div>
            <Label>燃油附加费 (%)</Label>
            <Input 
              type="number" 
              step="0.01"
              value={config.fuel_charge || ""}
              onChange={(e) => updateConfig("fuel_charge", parseFloat(e.target.value) || 0)}
              placeholder="例：15.5"
            />
          </div>
          <div>
            <Label>未授权地址费用 ($)</Label>
            <Input 
              type="number" 
              step="0.01"
              value={config.unauthorized_fee || ""}
              onChange={(e) => updateConfig("unauthorized_fee", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <FedExAdditionalFees
          signatureServices={config.signature_services}
          deliveryInterceptFee={config.delivery_intercept_fee}
          addressCorrectionFee={config.address_correction_fee}
          dangerousGoodsFee={config.dangerous_goods_fee}
          onChange={updateConfig}
        />
      </div>

      {/* 旺季附加费 - 每项独立配置时间段 */}
      <div className="space-y-6">
        <h3 className="font-semibold">旺季附加费配置（按类型独立配置时间段）</h3>
        
        {peakSurchargeTypes.map(({ key, label }) => (
          <div key={key} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{label}</h4>
              <Button onClick={() => addPeakSurchargeItem(key)} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加时间段
              </Button>
            </div>
            
            <div className="space-y-3">
              {(config.peak_surcharges?.[key] || []).map((item: SurchargeTimeItem, index: number) => (
                <div key={index} className="bg-muted/30 rounded-md p-3">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <Label className="text-xs">开始日期</Label>
                      <Input
                        type="date"
                        value={item.start_date}
                        onChange={(e) => updatePeakSurchargeItem(key, index, "start_date", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">结束日期</Label>
                      <Input
                        type="date"
                        value={item.end_date}
                        onChange={(e) => updatePeakSurchargeItem(key, index, "end_date", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">费用 ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => updatePeakSurchargeItem(key, index, "value", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removePeakSurchargeItem(key, index)}
                      className="h-9"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!config.peak_surcharges?.[key] || config.peak_surcharges[key].length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  暂无配置，点击"添加时间段"开始配置
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
