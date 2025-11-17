import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface EditReturnOrderFormProps {
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditReturnOrderForm({ orderId, onSuccess, onCancel }: EditReturnOrderFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    return_person: "",
    carrier: "",
    service_type: "",
    order_source: "",
    warehouse: "",
    zip_code: "",
    state: "",
    city: "",
    address: "",
    zone: "",
    shipping_fee: "0",
    address_type: "",
    status: "",
  });

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const { data, error } = await supabase
        .from("return_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setFormData({
        return_person: data.return_person || "",
        carrier: data.carrier || "",
        service_type: data.service_type || "",
        order_source: data.order_source || "",
        warehouse: data.warehouse || "",
        zip_code: data.zip_code || "",
        state: data.state || "",
        city: data.city || "",
        address: data.address || "",
        zone: data.zone || "",
        shipping_fee: data.shipping_fee?.toString() || "0",
        address_type: data.address_type || "",
        status: data.status || "pending_label",
      });
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("return_orders")
        .update({
          ...formData,
          shipping_fee: parseFloat(formData.shipping_fee),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "更新成功",
        description: "退货订单已更新",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>退货人 *</Label>
          <Input
            value={formData.return_person}
            onChange={(e) => setFormData({ ...formData, return_person: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>物流商 *</Label>
          <Select
            value={formData.carrier}
            onValueChange={(value) => setFormData({ ...formData, carrier: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FedEx">FedEx</SelectItem>
              <SelectItem value="UPS">UPS</SelectItem>
              <SelectItem value="USPS">USPS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>物流服务 *</Label>
          <Input
            value={formData.service_type}
            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>订单来源</Label>
          <Input
            value={formData.order_source}
            onChange={(e) => setFormData({ ...formData, order_source: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>收货仓库 *</Label>
          <Input
            value={formData.warehouse}
            onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>邮编 *</Label>
          <Input
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>州 *</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>城市 *</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>分区</Label>
          <Input
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>地址 *</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>地址属性</Label>
          <Select
            value={formData.address_type}
            onValueChange={(value) => setFormData({ ...formData, address_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="商业">商业</SelectItem>
              <SelectItem value="住宅">住宅</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>运费</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.shipping_fee}
            onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
          />
        </div>
        <div>
          <Label>状态</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_label">待打单</SelectItem>
              <SelectItem value="labeled">已打单</SelectItem>
              <SelectItem value="in_transit">在途</SelectItem>
              <SelectItem value="delivered">已送达</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
