import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Trash2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useZipCodeLookup } from "@/hooks/useZipCodeLookup";

const packageSchema = z.object({
  package_type: z.string().optional(),
  product_sku: z.string().optional(),
  weight: z.number().min(0.01, "重量必须大于0"),
  length: z.number().min(0.01, "长度必须大于0"),
  width: z.number().min(0.01, "宽度必须大于0"),
  height: z.number().min(0.01, "高度必须大于0"),
  declared_value: z.number().optional(),
  origin_country: z.string().default("CN"),
  insurance_fee: z.number().default(0),
  insurance_amount: z.number().default(0),
});

const formSchema = z.object({
  // 发货信息
  order_number: z.string().min(1, "订单号不能为空"),
  customer_code: z.string().min(1, "客户不能为空"),
  warehouse: z.string().min(1, "发货仓库不能为空"),
  carrier: z.string().min(1, "物流商不能为空"),
  service_type: z.string().min(1, "物流服务不能为空"),
  signature_service: z.string().default("NO"),
  reference_number: z.string().optional(),
  
  // 收件信息
  country: z.string().default("US"),
  recipient_name: z.string().min(1, "收件人不能为空"),
  recipient_phone: z.string().min(1, "电话不能为空"),
  recipient_email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
  zip_code: z.string().min(1, "邮编不能为空"),
  state: z.string().min(1, "州不能为空"),
  city: z.string().min(1, "城市不能为空"),
  address: z.string().min(1, "地址不能为空"),
  address_type: z.enum(["residential", "commercial", "mixed"]).optional(),
  
  // 其他
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type PackageData = z.infer<typeof packageSchema>;

interface CreateExpressOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  orderId?: string;
  mode?: 'create' | 'edit';
}

export function CreateExpressOrderForm({ onSuccess, onCancel, orderId, mode = 'create' }: CreateExpressOrderFormProps) {
  const { toast } = useToast();
  const { lookupZipCode, loading: zipLoading } = useZipCodeLookup();
  const [isMetric, setIsMetric] = useState(false);
  const [packages, setPackages] = useState<PackageData[]>([
    {
      weight: 0,
      origin_country: "CN",
      insurance_fee: 0,
      insurance_amount: 0,
    }
  ]);
  const [addressValidating, setAddressValidating] = useState(false);
  const [addressType, setAddressType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: "US",
    },
  });

  const addPackage = () => {
    setPackages([...packages, {
      weight: 0,
      origin_country: "CN",
      insurance_fee: 0,
      insurance_amount: 0,
    }]);
  };

  const removePackage = (index: number) => {
    if (packages.length === 1) {
      toast({
        title: "至少保留一个包裹",
        variant: "destructive",
      });
      return;
    }
    setPackages(packages.filter((_, i) => i !== index));
  };

  const copyPackage = (index: number) => {
    setPackages([...packages, { ...packages[index] }]);
  };

  const updatePackage = (index: number, field: keyof PackageData, value: any) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    
    // 如果更新保险费，自动计算保额（保额 = 保费 * 100）
    if (field === "insurance_fee") {
      newPackages[index].insurance_amount = value * 100;
    }
    
    setPackages(newPackages);
  };

  const validateAddress = async () => {
    setAddressValidating(true);
    
    // 模拟地址验证API调用
    setTimeout(() => {
      const random = Math.random();
      if (random < 0.4) {
        setAddressType("residential");
        setValue("address_type", "residential");
      } else if (random < 0.7) {
        setAddressType("commercial");
        setValue("address_type", "commercial");
      } else {
        setAddressType("mixed");
        setValue("address_type", "mixed");
      }
      
      toast({
        title: "地址验证完成",
        description: `地址类型: ${addressType === "residential" ? "住宅地址" : addressType === "commercial" ? "商业地址" : "混合地址"}`,
      });
      
      setAddressValidating(false);
    }, 1500);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      // 验证至少有一个包裹且重量大于0
      if (packages.length === 0 || packages.some(p => p.weight <= 0)) {
        toast({
          title: "包裹信息不完整",
          description: "请至少添加一个包裹并填写重量",
          variant: "destructive",
        });
        return;
      }

      // 插入订单
      const { data: orderData, error: orderError } = await supabase
        .from("express_orders")
        .insert({
          order_number: data.order_number,
          customer_id: "00000000-0000-0000-0000-000000000000", // 需要从实际客户选择获取
          customer_code: data.customer_code,
          warehouse: data.warehouse,
          carrier: data.carrier,
          service_type: data.service_type,
          signature_service: data.signature_service,
          reference_number: data.reference_number,
          country: data.country,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_email: data.recipient_email,
          zip_code: data.zip_code,
          state: data.state,
          city: data.city,
          address: data.address,
          address_type: data.address_type,
          notes: data.notes,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 插入包裹信息
      const packagesData = packages.map(pkg => ({
        order_id: orderData.id,
        package_type: pkg.package_type,
        product_sku: pkg.product_sku,
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        declared_value: pkg.declared_value,
        origin_country: pkg.origin_country,
        insurance_fee: pkg.insurance_fee,
        insurance_amount: pkg.insurance_amount,
        unit_system: isMetric ? "metric" as const : "imperial" as const,
      }));

      const { error: packagesError } = await supabase
        .from("express_packages")
        .insert(packagesData);

      if (packagesError) throw packagesError;

      toast({
        title: "订单创建成功",
        description: `订单 ${data.order_number} 已创建`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 发货信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">发货信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="order_number" className="text-sm">订单号 *</Label>
            <Input id="order_number" {...register("order_number")} className="h-9" />
            {errors.order_number && (
              <p className="text-xs text-destructive">{errors.order_number.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_code" className="text-sm">客户 *</Label>
            <Input id="customer_code" {...register("customer_code")} className="h-9" />
            {errors.customer_code && (
              <p className="text-xs text-destructive">{errors.customer_code.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warehouse" className="text-sm">发货仓库 *</Label>
            <Input id="warehouse" {...register("warehouse")} className="h-9" />
            {errors.warehouse && (
              <p className="text-xs text-destructive">{errors.warehouse.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="carrier" className="text-sm">物流商 *</Label>
            <Input id="carrier" {...register("carrier")} placeholder="如: UPS, FedEx, USPS" className="h-9" />
            {errors.carrier && (
              <p className="text-xs text-destructive">{errors.carrier.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service_type" className="text-sm">物流服务 *</Label>
            <Input id="service_type" {...register("service_type")} placeholder="如: Ground, Express" className="h-9" />
            {errors.service_type && (
              <p className="text-xs text-destructive">{errors.service_type.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signature_service" className="text-sm">签名服务</Label>
            <Select 
              defaultValue="NO" 
              onValueChange={(value) => setValue("signature_service", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO">无需签名</SelectItem>
                <SelectItem value="DIRECT">直接签名</SelectItem>
                <SelectItem value="INDIRECT">间接签名</SelectItem>
                <SelectItem value="ADULT">成人签名</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference_number" className="text-sm">记录号</Label>
            <Input id="reference_number" {...register("reference_number")} className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* 收件信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">收件信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">国家</Label>
            <Select defaultValue="US" onValueChange={(value) => setValue("country", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">美国 (US)</SelectItem>
                <SelectItem value="CA">加拿大 (CA)</SelectItem>
                <SelectItem value="MX">墨西哥 (MX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name">收件人 *</Label>
            <Input id="recipient_name" {...register("recipient_name")} />
            {errors.recipient_name && (
              <p className="text-sm text-destructive">{errors.recipient_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_phone">电话</Label>
            <Input id="recipient_phone" {...register("recipient_phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_email">邮箱</Label>
            <Input id="recipient_email" type="email" {...register("recipient_email")} />
            {errors.recipient_email && (
              <p className="text-sm text-destructive">{errors.recipient_email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip_code">邮编 * (5位或5+4位)</Label>
            <Input 
              id="zip_code" 
              {...register("zip_code")}
              maxLength={10}
              onChange={async (e) => {
                const zip = e.target.value;
                setValue("zip_code", zip);
                const zipRegex = /^\d{5}(-\d{4})?$/;
                if (zipRegex.test(zip)) {
                  const info = await lookupZipCode(zip.substring(0, 5));
                  if (info) {
                    setValue("city", info.city);
                    setValue("state", info.stateCode);
                  }
                }
              }}
            />
            {errors.zip_code && (
              <p className="text-sm text-destructive">{errors.zip_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">州 *</Label>
            <Input id="state" {...register("state")} disabled={zipLoading} className="bg-muted" />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">城市 *</Label>
            <Input id="city" {...register("city")} disabled={zipLoading} className="bg-muted" />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">地址 *</Label>
            <div className="flex gap-2">
              <Input id="address" {...register("address")} className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={validateAddress}
                disabled={addressValidating}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {addressValidating ? "验证中..." : "验证地址"}
              </Button>
            </div>
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
            {addressType && (
              <Badge variant="outline">
                {addressType === "residential" ? "住宅地址" : 
                 addressType === "commercial" ? "商业地址" : "混合地址"}
              </Badge>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea id="notes" {...register("notes")} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* 包裹信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">包裹信息</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>单位切换:</Label>
                <Switch
                  checked={isMetric}
                  onCheckedChange={setIsMetric}
                />
                <span className="text-sm">{isMetric ? "公制 (kg/cm)" : "英制 (lb/in)"}</span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                <Plus className="h-4 w-4 mr-1" />
                添加包裹
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {packages.map((pkg, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">包裹 #{index + 1}</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyPackage(index)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {packages.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePackage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">包裹类型</Label>
                  <Input
                    value={pkg.package_type || ""}
                    onChange={(e) => updatePackage(index, "package_type", e.target.value)}
                    placeholder="如: Box, Envelope"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">产品货号</Label>
                  <Input
                    value={pkg.product_sku || ""}
                    onChange={(e) => updatePackage(index, "product_sku", e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">重量 * ({isMetric ? "kg" : "lb"})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pkg.weight || ""}
                    onChange={(e) => updatePackage(index, "weight", parseFloat(e.target.value) || 0)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">长 * ({isMetric ? "cm" : "in"})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={pkg.length || ""}
                    onChange={(e) => updatePackage(index, "length", parseFloat(e.target.value) || 0)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">宽 * ({isMetric ? "cm" : "in"})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={pkg.width || ""}
                    onChange={(e) => updatePackage(index, "width", parseFloat(e.target.value) || 0)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">高 * ({isMetric ? "cm" : "in"})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={pkg.height || ""}
                    onChange={(e) => updatePackage(index, "height", parseFloat(e.target.value) || 0)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label>申报价值 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pkg.declared_value || ""}
                    onChange={(e) => updatePackage(index, "declared_value", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>原产国</Label>
                  <Select
                    value={pkg.origin_country || "CN"}
                    onValueChange={(value) => updatePackage(index, "origin_country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CN">中国 (CN)</SelectItem>
                      <SelectItem value="US">美国 (US)</SelectItem>
                      <SelectItem value="CA">加拿大 (CA)</SelectItem>
                      <SelectItem value="MX">墨西哥 (MX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>保险费 ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pkg.insurance_fee || ""}
                    onChange={(e) => updatePackage(index, "insurance_fee", parseFloat(e.target.value) || 0)}
                    placeholder="输入保费自动计算保额"
                  />
                </div>

                {pkg.insurance_fee > 0 && (
                  <div className="space-y-2 col-span-3">
                    <Badge variant="secondary">
                      保额: ${pkg.insurance_amount.toFixed(2)} (保费 × 100)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* 操作按钮 */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "创建中..." : "创建订单"}
        </Button>
      </div>
    </form>
  );
}
