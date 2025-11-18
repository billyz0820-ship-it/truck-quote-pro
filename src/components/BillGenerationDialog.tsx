import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BillGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BillGenerationDialog({ open, onOpenChange, onSuccess }: BillGenerationDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [customers, setCustomers] = useState<any[]>([]);

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      months.push({ value, label });
    }
    return months;
  };

  const handleGenerate = async () => {
    if (!selectedMonth) {
      toast.error("请选择账单月份");
      return;
    }

    try {
      setGenerating(true);

      // Fetch customers
      let customerQuery = supabase.from('customers').select('*');
      if (selectedCustomer !== "all") {
        customerQuery = customerQuery.eq('id', selectedCustomer);
      }
      const { data: customersData, error: customersError } = await customerQuery;
      if (customersError) throw customersError;

      // Parse selected month
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      let generatedCount = 0;

      for (const customer of customersData || []) {
        // Fetch truck orders for this customer and month
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customer.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (ordersError) throw ordersError;

        // Fetch express orders for this customer and month
        const { data: expressOrders, error: expressError } = await supabase
          .from('express_orders')
          .select('*')
          .eq('customer_id', customer.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (expressError) throw expressError;

        // Calculate totals
        const truckTotal = orders?.reduce((sum, order) => {
          // For prepaid customers, only include unpaid orders
          if (customer.customer_type === 'prepaid') {
            return sum; // Don't include prepaid orders in bills
          }
          return sum + Number(order.quoted_amount || 0);
        }, 0) || 0;

        const expressTotal = expressOrders?.reduce((sum, order) => {
          // For prepaid customers, check if already paid
          if (customer.customer_type === 'prepaid') {
            return sum; // Don't include prepaid orders in bills
          }
          return sum + Number(order.shipping_fee || 0);
        }, 0) || 0;

        const totalAmount = truckTotal + expressTotal;

        // Only create bill if there are charges
        if (totalAmount > 0) {
          // Generate bill number
          const billNumber = `BILL-${selectedMonth}-${customer.customer_code}`;

          // Check if bill already exists
          const { data: existingBill } = await supabase
            .from('bills')
            .select('id')
            .eq('customer_id', customer.id)
            .eq('bill_month', selectedMonth)
            .single();

          if (existingBill) {
            // Update existing bill
            const { error: updateError } = await supabase
              .from('bills')
              .update({
                total_amount: totalAmount,
                status: customer.customer_type === 'credit' ? 'pending' : 'paid'
              })
              .eq('id', existingBill.id);

            if (updateError) throw updateError;
          } else {
            // Create new bill
            const { error: insertError } = await supabase
              .from('bills')
              .insert({
                customer_id: customer.id,
                bill_number: billNumber,
                bill_month: selectedMonth,
                total_amount: totalAmount,
                status: customer.customer_type === 'credit' ? 'pending' : 'paid'
              });

            if (insertError) throw insertError;
          }

          generatedCount++;
        }
      }

      toast.success(`成功生成 ${generatedCount} 个账单`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("生成账单失败: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>生成月度账单</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>账单月份</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• 系统将自动汇总选定月份的所有卡车订单和快递订单费用</p>
            <p>• 预付费客户已扣款的订单不会计入账单</p>
            <p>• 信用客户的账单状态为"待付款"</p>
            <p>• 如果账单已存在，将更新账单金额</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "生成中..." : "确认生成"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
