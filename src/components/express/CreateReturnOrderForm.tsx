import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  order_number: z.string().min(1, "订单号不能为空"),
  customer_code: z.string().min(1, "客户不能为空"),
  return_person: z.string().min(1, "退货人不能为空"),
  carrier: z.string().min(1, "物流商不能为空"),
  service_type: z.string().min(1, "物流服务不能为空"),
  warehouse: z.string().min(1, "收货仓库不能为空"),
  zip_code: z.string().min(1, "邮编不能为空"),
  state: z.string().min(1, "州不能为空"),
  city: z.string().min(1, "城市不能为空"),
  address: z.string().min(1, "地址不能为空"),
  address_type: z.string().optional(),
  order_source: z.string().optional(),
  shipping_fee: z.number().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface CreateReturnOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateReturnOrderForm({ onSuccess, onCancel }: CreateReturnOrderFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipping_fee: 0,
    },
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, customer_code, company_name")
      .eq("status", "active")
      .order("customer_code");
    if (data) setCustomers(data);
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RT${dateStr}${random}`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      // Find customer ID from customer_code
      const customer = customers.find(c => c.customer_code === data.customer_code);
      if (!customer) {
        toast({
          title: "客户不存在",
          description: "请选择有效的客户",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("return_orders")
        .insert({
          order_number: data.order_number || generateOrderNumber(),
          customer_id: customer.id,
          customer_code: data.customer_code,
          return_person: data.return_person,
          carrier: data.carrier,
          service_type: data.service_type,
          warehouse: data.warehouse,
          zip_code: data.zip_code,
          state: data.state,
          city: data.city,
          address: data.address,
          address_type: data.address_type || null,
          order_source: data.order_source || null,
          shipping_fee: data.shipping_fee,
          status: "pending_label",
        });

      if (error) throw error;

      toast({
        title: "创建成功",
        description: `退货订单 ${data.order_number} 已创建`,
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
      {/* 订单基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">订单信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order_number">订单号 *</Label>
            <Input 
              id="order_number" 
              {...register("order_number")} 
              placeholder="留空自动生成"
            />
            {errors.order_number && (
              <p className="text-sm text-destructive">{errors.order_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_code">客户 *</Label>
            <Select onValueChange={(value) => setValue("customer_code", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择客户" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.customer_code}>
                    {customer.customer_code} - {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_code && (
              <p className="text-sm text-destructive">{errors.customer_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="return_person">退货人 *</Label>
            <Input id="return_person" {...register("return_person")} />
            {errors.return_person && (
              <p className="text-sm text-destructive">{errors.return_person.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_source">订单来源</Label>
            <Select onValueChange={(value) => setValue("order_source", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="手动创建">手动创建</SelectItem>
                <SelectItem value="API导入">API导入</SelectItem>
                <SelectItem value="Excel导入">Excel导入</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 物流信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">物流信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carrier">物流商 *</Label>
            <Select onValueChange={(value) => setValue("carrier", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择物流商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="USPS">USPS</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
              </SelectContent>
            </Select>
            {errors.carrier && (
              <p className="text-sm text-destructive">{errors.carrier.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">物流服务 *</Label>
            <Select onValueChange={(value) => setValue("service_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择服务" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ground">Ground</SelectItem>
                <SelectItem value="Home Delivery">Home Delivery</SelectItem>
                <SelectItem value="Express">Express</SelectItem>
                <SelectItem value="2Day">2Day</SelectItem>
                <SelectItem value="Overnight">Overnight</SelectItem>
              </SelectContent>
            </Select>
            {errors.service_type && (
              <p className="text-sm text-destructive">{errors.service_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">收货仓库 *</Label>
            <Input id="warehouse" {...register("warehouse")} placeholder="如: 洛杉矶仓, 纽约仓" />
            {errors.warehouse && (
              <p className="text-sm text-destructive">{errors.warehouse.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_fee">运费 ($)</Label>
            <Input 
              id="shipping_fee" 
              type="number" 
              step="0.01"
              {...register("shipping_fee", { valueAsNumber: true })} 
            />
          </div>
        </CardContent>
      </Card>

      {/* 地址信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">退货地址</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip_code">邮编 *</Label>
            <Input id="zip_code" {...register("zip_code")} />
            {errors.zip_code && (
              <p className="text-sm text-destructive">{errors.zip_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">州 *</Label>
            <Input id="state" {...register("state")} />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">城市 *</Label>
            <Input id="city" {...register("city")} />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_type">地址类型</Label>
            <Select onValueChange={(value) => setValue("address_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">住宅地址</SelectItem>
                <SelectItem value="commercial">商业地址</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">详细地址 *</Label>
            <Textarea id="address" {...register("address")} rows={2} />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

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
