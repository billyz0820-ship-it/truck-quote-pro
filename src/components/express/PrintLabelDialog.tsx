import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderIds: string[];
  onSuccess: () => void;
}

export function PrintLabelDialog({ open, onOpenChange, orderIds, onSuccess }: PrintLabelDialogProps) {
  const [printing, setPrinting] = useState(false);

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [couponInfo, setCouponInfo] = useState<any>(null);

  // Fetch order details and available coupons when dialog opens
  useEffect(() => {
    if (open && orderIds.length > 0) {
      fetchOrderAndCoupon();
    }
  }, [open, orderIds]);

  const fetchOrderAndCoupon = async () => {
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('express_orders')
        .select('shipping_fee, customer_id')
        .eq('id', orderIds[0])
        .single();

      if (orderError) throw orderError;
      setOrderDetails(orderData);

      // Fetch available coupon for this customer
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', orderData.customer_id)
        .eq('status', 'active')
        .eq('coupon_type', 'express')
        .is('used_at', null)
        .order('amount', { ascending: false })
        .limit(1)
        .single();

      if (couponData) {
        const now = new Date();
        const expireAt = couponData.expire_at ? new Date(couponData.expire_at) : null;
        if (!expireAt || expireAt > now) {
          setCouponInfo(couponData);
        }
      }
    } catch (error: any) {
      console.error("获取订单信息失败:", error);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // If coupon is available, use it
      if (couponInfo && orderDetails) {
        const discountAmount = Math.min(couponInfo.amount, orderDetails.shipping_fee);
        
        // Update order with coupon
        const { error: updateError } = await supabase
          .from('express_orders')
          .update({ 
            label_printed_at: new Date().toISOString(),
            status: 'labeled',
            coupon_id: couponInfo.id,
            discount_amount: discountAmount,
            shipping_fee: orderDetails.shipping_fee - discountAmount
          })
          .in('id', orderIds);

        if (updateError) throw updateError;

        // Mark coupon as used
        await supabase
          .from('coupons')
          .update({ 
            status: 'used',
            used_at: new Date().toISOString()
          })
          .eq('id', couponInfo.id);
      } else {
        // Update without coupon
        const { error } = await supabase
          .from('express_orders')
          .update({ 
            label_printed_at: new Date().toISOString(),
            status: 'labeled'
          })
          .in('id', orderIds);

        if (error) throw error;
      }

      toast.success(`已打印 ${orderIds.length} 个订单的面单`);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("打单失败: " + error.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>打印面单</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {couponInfo && orderDetails ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                原运费为 <span className="text-primary">${orderDetails.shipping_fee.toFixed(2)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                您有一张优惠券可直接抵扣，优惠价格为 <span className="font-bold text-primary">${(orderDetails.shipping_fee - Math.min(couponInfo.amount, orderDetails.shipping_fee)).toFixed(2)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                确认打印 <span className="font-bold">{orderIds.length}</span> 个订单的面单吗？
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              确认打印 <span className="font-bold">{orderIds.length}</span> 个订单的面单吗？
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handlePrint} disabled={printing}>
              <Printer className="h-4 w-4 mr-2" />
              {printing ? "打印中..." : "确认打印"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
