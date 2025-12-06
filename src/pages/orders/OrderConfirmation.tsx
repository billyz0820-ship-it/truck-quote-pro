import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Truck, Ticket, Wallet, FileText, AlertCircle, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useFirstOrderCheck } from "@/hooks/useFirstOrderCheck";
import { AgreementViewDialog } from "@/components/agreements/AgreementViewDialog";
import { InsufficientBalanceDialog } from "@/components/express/InsufficientBalanceDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AvailableCoupon {
  id: string;
  coupon_code: string;
  amount: number;
  expire_at: string | null;
  order_type: string | null;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useAuth();
  const { orderData, selectedQuote, pickupDetails, deliveryDetails, couponApplied: initialCoupon } = location.state || {};
  const [customerCode, setCustomerCode] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  
  // Coupon selection
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>(initialCoupon?.id || "none");
  const [selectedCoupon, setSelectedCoupon] = useState<AvailableCoupon | null>(initialCoupon || null);
  
  const { isFirstOrder, loading: loadingAgreement, hasAgreed, markAsAgreed } = useFirstOrderCheck(customerId);

  // 获取客户余额和额度
  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;

      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('balance, credit_limit, customer_code')
          .eq('id', customerId)
          .single();

        if (customerData) {
          setCustomerBalance(customerData.balance || 0);
          setCreditLimit(customerData.credit_limit || 0);
          setCustomerCode(customerData.customer_code || '');
        }

        // 获取可用优惠券
        const { data: couponsData } = await supabase
          .from('coupons')
          .select('id, coupon_code, amount, expire_at, order_type')
          .eq('customer_id', customerId)
          .eq('status', 'active')
          .or('order_type.is.null,order_type.eq.truck');
        
        if (couponsData) {
          setAvailableCoupons(couponsData);
        }
      } catch (error) {
        console.error("获取数据失败:", error);
      }
    };

    fetchData();
  }, [customerId]);

  // 当选择优惠券时更新
  useEffect(() => {
    if (selectedCouponId === "none") {
      setSelectedCoupon(null);
    } else {
      const coupon = availableCoupons.find(c => c.id === selectedCouponId);
      setSelectedCoupon(coupon || null);
    }
  }, [selectedCouponId, availableCoupons]);

  // 如果没有数据，返回创建页面
  if (!orderData || !selectedQuote || !pickupDetails || !deliveryDetails) {
    navigate("/dashboard/orders/create");
    return null;
  }

  const totalCost = selectedQuote.totalCost;
  const discountAmount = selectedCoupon?.amount || 0;
  const finalAmount = Math.max(0, totalCost - discountAmount);
  
  // 计算可用总额 = 余额 + 额度
  const totalAvailable = customerBalance + creditLimit;
  const remainingBalance = customerBalance - finalAmount;
  const canAfford = totalAvailable >= finalAmount;

  const handleSubmit = async () => {
    // 检查余额+额度是否足够
    if (!canAfford) {
      setShowInsufficientDialog(true);
      return;
    }

    // 检查协议 - 首单需要签署
    if (isFirstOrder && !hasAgreed) {
      setShowAgreementDialog(true);
      return;
    }

    try {
      setLoading(true);
      
      // 生成订单编号
      const orderNumber = `ORD-${Date.now()}`;
      
      // 创建订单到数据库
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          customer_code: customerCode || '',
          pickup_zip: orderData.pickupZip,
          delivery_zip: orderData.deliveryZip,
          reference_number: orderData.referenceNumber || null,
          cargo_description: orderData.cargoDescription || null,
          quoted_amount: finalAmount,
          carrier_name: selectedQuote.name,
          status: 'pending_review',
          shipment_type: orderData.shipmentType,
          coupon_id: selectedCoupon?.id || null,
          discount_amount: discountAmount,
          // 发货详细信息
          pickup_address: pickupDetails.address,
          pickup_city: pickupDetails.city,
          pickup_state: pickupDetails.state,
          pickup_address_type: pickupDetails.addressType,
          pickup_contact_name: pickupDetails.contactName,
          pickup_contact_phone: pickupDetails.contactPhone,
          pickup_contact_email: pickupDetails.contactEmail,
          pickup_notes: pickupDetails.notes || null,
          // 收货详细信息
          delivery_address: deliveryDetails.address,
          delivery_city: deliveryDetails.city,
          delivery_state: deliveryDetails.state,
          delivery_address_type: deliveryDetails.addressType,
          delivery_contact_name: deliveryDetails.contactName,
          delivery_contact_phone: deliveryDetails.contactPhone,
          delivery_contact_email: deliveryDetails.contactEmail,
          delivery_notes: deliveryDetails.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // 如果使用了优惠券，更新优惠券状态
      if (selectedCoupon) {
        await supabase
          .from('coupons')
          .update({ status: 'used', used_at: new Date().toISOString() })
          .eq('id', selectedCoupon.id);
      }

      toast.success("订单创建成功！");
      navigate(`/dashboard/orders/${data.id}`);
    } catch (error: any) {
      console.error("创建订单失败:", error);
      toast.error("创建订单失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">确认订单</h1>
          <p className="text-muted-foreground">请核对订单信息后提交</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：订单信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 承运商信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                承运商信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedQuote.name}</h3>
                  <p className="text-sm text-muted-foreground">运输时间: {selectedQuote.transitTime}</p>
                </div>
                <Badge variant="outline">{orderData.shipmentType}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 发货信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                发货信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">地址：</span>
                  <span>{pickupDetails.address}, {pickupDetails.city}, {pickupDetails.state} {pickupDetails.zip}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">联系人：</span>
                  <span>{pickupDetails.contactName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">电话：</span>
                  <span>{pickupDetails.contactPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">地址类型：</span>
                  <span>{pickupDetails.addressType || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 收货信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                收货信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">地址：</span>
                  <span>{deliveryDetails.address}, {deliveryDetails.city}, {deliveryDetails.state} {deliveryDetails.zip}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">联系人：</span>
                  <span>{deliveryDetails.contactName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">电话：</span>
                  <span>{deliveryDetails.contactPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">地址类型：</span>
                  <span>{deliveryDetails.addressType || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：费用信息 */}
        <div className="space-y-6">
          {/* 优惠券选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                优惠券
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableCoupons.length > 0 ? (
                <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优惠券" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不使用优惠券</SelectItem>
                    {availableCoupons.map(coupon => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.coupon_code} - ${coupon.amount} 
                        {coupon.expire_at && ` (${new Date(coupon.expire_at).toLocaleDateString()}到期)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">暂无可用优惠券</p>
              )}
            </CardContent>
          </Card>

          {/* 费用明细 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                费用明细
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前余额</span>
                <span className="font-medium">${customerBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">信用额度</span>
                <span className="font-medium">${creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">可用总额</span>
                <span className="font-medium text-primary">${totalAvailable.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">运费</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      优惠券
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>实付金额</span>
                  <span className="text-primary">${finalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">支付后余额</span>
                  <span className={remainingBalance < 0 ? "text-amber-600 font-medium" : "font-medium"}>
                    ${remainingBalance.toFixed(2)}
                    {remainingBalance < 0 && <span className="text-xs ml-1">(使用额度)</span>}
                  </span>
                </div>
              </div>

              {!canAfford && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">余额和额度不足</p>
                      <p className="text-xs mt-1">请先充值后再下单</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 服务协议提示 */}
          {!loadingAgreement && isFirstOrder && !hasAgreed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  服务协议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    首次下单需阅读并同意服务协议
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAgreementDialog(true)}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    查看并签署协议
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 提交按钮 */}
          <div className="space-y-3">
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? "提交中..." : isFirstOrder && !hasAgreed ? "签署协议并下单" : "确认下单"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="w-full"
              disabled={loading}
            >
              返回修改
            </Button>
          </div>
        </div>
      </div>

      <AgreementViewDialog
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        onAccept={markAsAgreed}
      />

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={setShowInsufficientDialog}
        currentBalance={totalAvailable}
        requiredAmount={finalAmount}
      />
    </div>
  );
};

export default OrderConfirmation;
