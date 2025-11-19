import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess?: () => void;
}

export const RechargeDialog = ({ open, onOpenChange, customerId, onSuccess }: RechargeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVoucherFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !paymentMethod || !voucherFile) {
      toast.error("请填写所有必填项");
      return;
    }

    setLoading(true);
    try {
      // 上传付款凭证
      const fileExt = voucherFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-documents')
        .upload(`recharge-vouchers/${fileName}`, voucherFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-documents')
        .getPublicUrl(`recharge-vouchers/${fileName}`);

      // 创建充值记录
      const { error: insertError } = await supabase
        .from('recharge_records')
        .insert({
          customer_id: customerId,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          voucher_url: publicUrl
        });

      if (insertError) throw insertError;

      toast.success("充值申请已提交");
      onOpenChange(false);
      setAmount("");
      setPaymentMethod("");
      setVoucherFile(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error("充值申请失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>账户充值</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">付款方式 *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="选择付款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">银行转账</SelectItem>
                <SelectItem value="credit_card">信用卡</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">充值金额 *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucher">付款凭证 *</Label>
            <div className="flex gap-2">
              <Input
                id="voucher"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {voucherFile && (
              <p className="text-sm text-muted-foreground">{voucherFile.name}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "提交中..." : "提交充值"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
