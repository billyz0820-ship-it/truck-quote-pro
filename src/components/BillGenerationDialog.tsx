import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_code, company_name')
        .order('company_name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error("加载客户列表失败: " + error.message);
    }
  };

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

      const allOrderDetails: any[] = [];

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

        // Calculate totals and collect details
        const truckDetails = (orders || []).map(order => ({
          type: 'truck',
          order_number: order.order_number,
          amount: Number(order.quoted_amount || 0),
          isPrepaid: customer.customer_type === 'prepaid',
          carrier: order.carrier_name,
          pickup_zip: order.pickup_zip,
          delivery_zip: order.delivery_zip,
          notes: order.cargo_description,
          customer_code: customer.customer_code
        }));

        const expressDetails = (expressOrders || []).map(order => ({
          type: 'express',
          order_number: order.order_number,
          tracking_number: order.tracking_number,
          amount: Number(order.shipping_fee || 0),
          isPrepaid: customer.customer_type === 'prepaid',
          carrier: order.carrier,
          service_type: order.service_type,
          zip_code: order.zip_code,
          notes: order.notes,
          customer_code: customer.customer_code
        }));

        allOrderDetails.push(...truckDetails, ...expressDetails);

        const truckTotal = truckDetails
          .filter(d => !d.isPrepaid)
          .reduce((sum, d) => sum + d.amount, 0);

        const expressTotal = expressDetails
          .filter(d => !d.isPrepaid)
          .reduce((sum, d) => sum + d.amount, 0);

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

      setOrderDetails(allOrderDetails);
      setShowDetails(true);
      toast.success(`成功生成 ${generatedCount} 个账单`);
      onSuccess();
    } catch (error: any) {
      toast.error("生成账单失败: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const filteredDetails = selectedCustomer !== "all"
    ? orderDetails.filter(d => d.customer_code === customers.find(c => c.id === selectedCustomer)?.customer_code)
    : orderDetails;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setShowDetails(false);
        setOrderDetails([]);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生成月度账单</DialogTitle>
        </DialogHeader>
        
        {!showDetails ? (
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
            
            <div>
              <Label>选择客户（可选）</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="全部客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部客户</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_code} - {customer.company_name}
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">订单明细</h3>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>承运商</TableHead>
                    <TableHead>服务/路线</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetails.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={detail.type === 'truck' ? 'default' : 'secondary'}>
                          {detail.type === 'truck' ? '卡车' : '快递'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {detail.order_number}
                        {detail.tracking_number && (
                          <div className="text-xs text-muted-foreground">
                            追踪: {detail.tracking_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{detail.carrier || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {detail.type === 'truck' 
                          ? `${detail.pickup_zip} → ${detail.delivery_zip}`
                          : `${detail.service_type} (${detail.zip_code})`
                        }
                      </TableCell>
                      <TableCell className="font-medium">
                        ${detail.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {detail.isPrepaid ? (
                          <Badge variant="outline" className="bg-green-50">
                            已预付
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            待付款
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {detail.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>订单总数：</span>
                <span className="font-medium">{filteredDetails.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>预付订单：</span>
                <span className="font-medium text-green-600">
                  {filteredDetails.filter(d => d.isPrepaid).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>待付款订单：</span>
                <span className="font-medium text-yellow-600">
                  {filteredDetails.filter(d => !d.isPrepaid).length}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>应收金额：</span>
                <span className="text-lg">
                  ${filteredDetails
                    .filter(d => !d.isPrepaid)
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
