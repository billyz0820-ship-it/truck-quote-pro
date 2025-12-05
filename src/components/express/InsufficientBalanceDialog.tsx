import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  requiredAmount: number;
}

export function InsufficientBalanceDialog({ 
  open, 
  onOpenChange, 
  currentBalance, 
  requiredAmount 
}: InsufficientBalanceDialogProps) {
  const shortfall = requiredAmount - currentBalance;

  const paymentInfo = {
    bankName: "Bank of America",
    accountName: "智运物流 LLC",
    accountNumber: "1234567890",
    routingNumber: "026009593",
    zelle: "payment@zhiyunlogistics.com"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            余额不足
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">当前余额</span>
              <span className="font-medium">${currentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">所需金额</span>
              <span className="font-medium">${requiredAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-destructive/20 pt-2 flex justify-between">
              <span className="text-sm font-medium text-destructive">差额</span>
              <span className="font-bold text-destructive">${shortfall.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">付款信息</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">银行</span>
                <span>{paymentInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">账户名</span>
                <div className="flex items-center gap-1">
                  <span>{paymentInfo.accountName}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(paymentInfo.accountName, "账户名")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">账号</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{paymentInfo.accountNumber}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(paymentInfo.accountNumber, "账号")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Routing</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{paymentInfo.routingNumber}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(paymentInfo.routingNumber, "Routing")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-muted-foreground">Zelle</span>
                <div className="flex items-center gap-1">
                  <span>{paymentInfo.zelle}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(paymentInfo.zelle, "Zelle")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            请充值后再进行打单操作。如有疑问，请联系客服。
          </p>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>我知道了</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}