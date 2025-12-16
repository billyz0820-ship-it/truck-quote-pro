import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { InsufficientBalanceDialog } from "./InsufficientBalanceDialog";
import { AgreementViewDialog } from "@/components/agreements/AgreementViewDialog";
import { useFirstOrderCheck } from "@/hooks/useFirstOrderCheck";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderIds: string[];
  onSuccess: () => void;
}

interface FreightDetails {
  quoteId: string;
  quoteNo: string;
  freight: number;
  balance: number;
  totalFee: number;
  baseFee: number;
  ashFee: number;
  overSizeFee: number;
  nonStandardPackagingFee: number;
  nonStandardFee: number;
  remoteFee: number;
  ultraRemoteFee: number;
  dasRemote: number;
  nonMotorizedFee: number;
  peakSeasonSurcharge: number;
  fuelCharge: number;
  residentialDeliveryCharge: number;
  signFee: number;
  unauthorizedPackage: number;
  ahsweight: number;
  ahsdim: number;
  peakAHS: number;
  peakOverSize: number;
  peakResidential: number;
  peakShipping: number;
  peakUnauthorizedPackage: number;
  transfinite: number;
  peakTransfinite: number;
  irregularSurcharge: number;
  peakResidentialDelivery: number;
  peakDemandResidential: number;
  deliveryandreturns: number;
  pickupFee: number;
  insuranceFee: number;
  demandPrePackage: number;
  discountBaseFee: number;
  discountASHFee: number;
  discountNonStandardPackagingFee: number;
  discountNonStandardFee: number;
  discountOverSizeFee: number;
  discountRemoteFee: number;
  discountUltraRemoteFee: number;
  discountDASRemote: number;
  discountNonMotorizedFee: number;
  discountPeakSeasonSurcharge: number;
  discountFuelCharge: number;
  discountResidentialDeliveryCharge: number;
  discountSignFee: number;
  discountUnauthorizedPackage: number;
  discountPeakDemandResidential: number;
  discountDeliveryandreturns: number;
  discountDemandPrePackage: number;
  orderNo: string;
  trackingNumber: string;
  errorMessage?: string;
}

export function PrintLabelDialog({ open, onOpenChange, orderIds, onSuccess }: PrintLabelDialogProps) {
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freightDetails, setFreightDetails] = useState<FreightDetails[]>([]);
  const [totalFreight, setTotalFreight] = useState<number>(0);
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const { isFirstOrder, hasAgreed, markAsAgreed } = useFirstOrderCheck(customerId);

  // Fetch freight details when dialog opens
  useEffect(() => {
    if (open && orderIds.length > 0) {
      fetchFreightDetails();
    }
  }, [open, orderIds]);

  const fetchFreightDetails = async () => {
    try {
      setLoading(true);
      
      // Call freight calculation API
      const response = await api.post('/api/v1/Order/GetQuoteFreightList', {
        id: orderIds,
        isReturn: false
      });

      if (response.isSuccess && response.data) {
        const freightData = response.data.calculateFreightNewResponses || [];
        setFreightDetails(freightData);
        
        const total = freightData.reduce((sum: number, item: FreightDetails) => 
          sum + (item.totalFee || 0), 0);
        setTotalFreight(total);
        
        // Get customer info from first order
        if (freightData.length > 0) {
          const firstOrder = freightData[0];
          // Fetch customer balance (this would need to be implemented based on your data structure)
          // For now, using dummy data
          setCustomerBalance(1000);
          setCreditLimit(500);
        }
      } else {
        toast.error("获取运费信息失败: " + response.message);
      }
    } catch (error: any) {
      console.error("获取运费信息失败:", error);
      toast.error("获取运费信息失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAvailable = customerBalance + creditLimit;

  const handlePrint = async () => {
    // Check agreement for first order
    if (isFirstOrder && !hasAgreed) {
      setShowAgreementDialog(true);
      return;
    }
    
    // Check balance + credit limit before printing
    if (totalAvailable < totalFreight) {
      setShowInsufficientDialog(true);
      return;
    }

    try {
      setPrinting(true);
      
      // Get the first quote ID from freight details
      const firstQuoteId = freightDetails.length > 0 ? freightDetails[0].quoteId : null;
      
      // Call CreateShipment API
      const response = await api.post('/api/v1/Order/CreateShipment', {
        iDs: orderIds,
        quoteId: firstQuoteId
      });

      if (response.isSuccess) {
        // Update order status in database
        const { error } = await supabase
          .from('express_orders')
          .update({ 
            label_printed_at: new Date().toISOString(),
            status: 'completed'
          })
          .in('id', orderIds);

        if (error) throw error;

        toast.success(`已打印 ${orderIds.length} 个订单的面单`);
        
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("创建运单失败: " + (response.message || "未知错误"));
      }
    } catch (error: any) {
      console.error("打单失败:", error);
      toast.error("打单失败: " + error.message);
    } finally {
      setPrinting(false);
    }
  };

  // Helper function to format fee breakdown
  const getFeeBreakdown = (fee: FreightDetails) => {
    const breakdown: { label: string; value: number; key: keyof FreightDetails }[] = [
      { label: "基础费用", value: fee.baseFee, key: "baseFee" },
      { label: "超长超重费", value: fee.ashFee, key: "ashFee" },
      { label: "超尺寸费", value: fee.overSizeFee, key: "overSizeFee" },
      { label: "非标准包装费", value: fee.nonStandardPackagingFee, key: "nonStandardPackagingFee" },
      { label: "非标准费", value: fee.nonStandardFee, key: "nonStandardFee" },
      { label: "偏远费", value: fee.remoteFee, key: "remoteFee" },
      { label: "超偏远费", value: fee.ultraRemoteFee, key: "ultraRemoteFee" },
      { label: "DAS偏远费", value: fee.dasRemote, key: "dasRemote" },
      { label: "非机动费", value: fee.nonMotorizedFee, key: "nonMotorizedFee" },
      { label: "旺季附加费", value: fee.peakSeasonSurcharge, key: "peakSeasonSurcharge" },
      { label: "燃油附加费", value: fee.fuelCharge, key: "fuelCharge" },
      { label: "住宅附加费", value: fee.residentialDeliveryCharge, key: "residentialDeliveryCharge" },
      { label: "签收费", value: fee.signFee, key: "signFee" },
      { label: "超标费", value: fee.unauthorizedPackage, key: "unauthorizedPackage" },
      { label: "AHS超重", value: fee.ahsweight, key: "ahsweight" },
      { label: "AHS超长", value: fee.ahsdim, key: "ahsdim" },
      { label: "旺季AHS", value: fee.peakAHS, key: "peakAHS" },
      { label: "旺季超尺寸", value: fee.peakOverSize, key: "peakOverSize" },
      { label: "旺季住宅", value: fee.peakResidential, key: "peakResidential" },
      { label: "旺季运费", value: fee.peakShipping, key: "peakShipping" },
      { label: "旺季超标", value: fee.peakUnauthorizedPackage, key: "peakUnauthorizedPackage" },
      { label: "超限附加费", value: fee.transfinite, key: "transfinite" },
      { label: "旺季超限费", value: fee.peakTransfinite, key: "peakTransfinite" },
      { label: "不规则附加费", value: fee.irregularSurcharge, key: "irregularSurcharge" },
      { label: "旺季住宅附加费", value: fee.peakResidentialDelivery, key: "peakResidentialDelivery" },
      { label: "旺季需求住宅", value: fee.peakDemandResidential, key: "peakDemandResidential" },
      { label: "退货收货费", value: fee.deliveryandreturns, key: "deliveryandreturns" },
      { label: "上门取件费", value: fee.pickupFee, key: "pickupFee" },
      { label: "保险费", value: fee.insuranceFee, key: "insuranceFee" },
      { label: "亚马逊预包装", value: fee.demandPrePackage, key: "demandPrePackage" }
    ];

    return breakdown.filter(item => item.value > 0);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex justify-between border-t pt-1 mt-2 font-medium">
                <span>运费总计</span>
                <span className="text-primary">${totalFreight.toFixed(2)}</span>
              </div>
            </div>

            {/* Freight details */}
            {loading ? (
              <div className="text-center py-4">
                <span className="text-muted-foreground">正在计算运费...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium">费用明细</h3>
                <div className="space-y-2">
                  {freightDetails.map((fee, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{fee.orderNo}</div>
                          {fee.trackingNumber && (
                            <div className="text-sm text-muted-foreground">
                              追踪号: {fee.trackingNumber}
                            </div>
                          )}
                          {fee.errorMessage && (
                            <div className="text-sm text-red-600 mt-1">
                              错误: {fee.errorMessage}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">${fee.totalFee.toFixed(2)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <div className="space-y-1">
                                <div className="font-medium">费用明细</div>
                                {getFeeBreakdown(fee).map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>{item.label}:</span>
                                    <span>${item.value.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="border-t pt-1 font-medium">
                                  <div className="flex justify-between">
                                    <span>总计:</span>
                                    <span>${fee.totalFee.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              确认打印 <span className="font-bold">{orderIds.length}</span> 个订单的面单吗？
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={printing}>
                取消
              </Button>
              <Button onClick={handlePrint} disabled={printing || loading || totalFreight === 0}>
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
        requiredAmount={totalFreight}
      />

      <AgreementViewDialog
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        onAccept={markAsAgreed}
      />
    </>
  );
}
