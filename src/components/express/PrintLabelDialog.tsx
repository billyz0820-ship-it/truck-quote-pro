import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InsufficientBalanceDialog } from "./InsufficientBalanceDialog";
import { AgreementViewDialog } from "@/components/agreements/AgreementViewDialog";
import { useFirstOrderCheck } from "@/hooks/useFirstOrderCheck";

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
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [totalShippingFee, setTotalShippingFee] = useState<number>(0);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const { isFirstOrder, hasAgreed, markAsAgreed } = useFirstOrderCheck(customerId);

  // Fetch order details and available coupons when dialog opens
  useEffect(() => {
    if (open && orderIds.length > 0) {
      fetchOrderAndCoupon();
    }
  }, [open, orderIds]);

  const fetchOrderAndCoupon = async () => {
    try {
      // Fetch all selected orders' shipping fees
      const { data: ordersData, error: ordersError } = await supabase
        .from('express_orders')
        .select('shipping_fee, customer_id')
        .in('id', orderIds);

      if (ordersError) throw ordersError;
      
      const firstOrder = ordersData?.[0];
      if (!firstOrder) return;

      const total = ordersData.reduce((sum, o) => sum + (o.shipping_fee || 0), 0);
      setTotalShippingFee(total);
      setOrderDetails(firstOrder);
      setCustomerId(firstOrder.customer_id);

      // Fetch customer balance and credit limit
      const { data: customerData } = await supabase
        .from('customers')
        .select('balance, credit_limit')
        .eq('id', firstOrder.customer_id)
        .single();

      if (customerData) {
        setCustomerBalance(customerData.balance || 0);
        setCreditLimit(customerData.credit_limit || 0);
      }

      // Fetch available coupon for this customer (auto-apply)
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', firstOrder.customer_id)
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

  // Calculate final amount after coupon
  const discountAmount = couponInfo ? Math.min(couponInfo.amount, totalShippingFee) : 0;
  const finalAmount = totalShippingFee - discountAmount;
  const totalAvailable = customerBalance + creditLimit;

  const handlePrint = async () => {
    // Check agreement for first order
    if (isFirstOrder && !hasAgreed) {
      setShowAgreementDialog(true);
      return;
    }
    
    // Check balance + credit limit before printing
    if (totalAvailable < finalAmount) {
      setShowInsufficientDialog(true);
      return;
    }

    try {
      setPrinting(true);
      
      // If coupon is available, use it
      if (couponInfo && orderIds.length === 1) {
        // Update order with coupon (only for single order)
        const { error: updateError } = await supabase
          .from('express_orders')
          .update({ 
            label_printed_at: new Date().toISOString(),
            status: 'labeled',
            coupon_id: couponInfo.id,
            discount_amount: discountAmount,
            shipping_fee: finalAmount
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>打印面单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Balance info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前余额</span>
                <span className="font-medium">${customerBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">信用额度</span>
                <span className="font-medium">${creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-muted-foreground">可用总额</span>
                <span className="font-medium text-primary">${totalAvailable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-2">
                <span className="text-muted-foreground">运费总计</span>
                <span>${totalShippingFee.toFixed(2)}</span>
              </div>
              {couponInfo && orderIds.length === 1 && (
                <div className="flex justify-between text-green-600">
                  <span>优惠券抵扣</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>应付金额</span>
                <span className="text-primary">${finalAmount.toFixed(2)}</span>
              </div>
            </div>

            {couponInfo && orderIds.length === 1 && (
              <p className="text-sm text-green-600">
                已自动应用优惠券，节省 ${discountAmount.toFixed(2)}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              确认打印 <span className="font-bold">{orderIds.length}</span> 个订单的面单吗？
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handlePrint} disabled={printing}>
                <Printer className="h-4 w-4 mr-2" />
                {printing ? "打印中..." : isFirstOrder && !hasAgreed ? "签署协议并打印" : "确认打印"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        currentBalance={totalAvailable}
        requiredAmount={finalAmount}
      />

      <AgreementViewDialog
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        onAccept={markAsAgreed}
      />
    </>
  );
}
