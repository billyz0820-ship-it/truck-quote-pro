import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface CostImport {
  id: string;
  order_number: string;
  carrier_name: string | null;
  actual_cost: number;
  import_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export const CostImportManagement = () => {
  const [costImports, setCostImports] = useState<CostImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [importForm, setImportForm] = useState({
    order_number: "",
    carrier_name: "",
    actual_cost: "",
    import_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    reference_number: "",
    notes: ""
  });

  useEffect(() => {
    fetchCostImports();
  }, []);

  const fetchCostImports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cost_imports')
        .select('*')
        .order('import_date', { ascending: false });

      if (error) throw error;
      setCostImports(data || []);
    } catch (error: any) {
      toast.error("加载成本数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImportForm({
      order_number: "",
      carrier_name: "",
      actual_cost: "",
      import_date: new Date().toISOString().split('T')[0],
      payment_method: "",
      reference_number: "",
      notes: ""
    });
  };

  const handleImport = async () => {
    if (!importForm.order_number || !importForm.actual_cost) {
      toast.error("请填写订单编号和成本金额");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("用户未登录");

      const { error: insertError } = await supabase
        .from('cost_imports')
        .insert([{
          order_number: importForm.order_number,
          carrier_name: importForm.carrier_name || null,
          actual_cost: parseFloat(importForm.actual_cost),
          import_date: importForm.import_date,
          payment_method: importForm.payment_method || null,
          reference_number: importForm.reference_number || null,
          notes: importForm.notes || null,
          created_by: user.id
        }]);

      if (insertError) throw insertError;

      // 更新订单的实际成本和利润
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('quoted_amount')
        .eq('order_number', importForm.order_number)
        .single();

      if (!orderError && orderData) {
        const profit = orderData.quoted_amount - parseFloat(importForm.actual_cost);
        
        await supabase
          .from('orders')
          .update({
            actual_cost: parseFloat(importForm.actual_cost),
            profit: profit
          })
          .eq('order_number', importForm.order_number);
      }

      toast.success("成本导入成功！");
      setDialogOpen(false);
      resetForm();
      fetchCostImports();
    } catch (error: any) {
      toast.error("导入失败: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">成本导入</h2>
          <p className="text-muted-foreground">导入订单的实际成本数据</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              导入成本
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>导入订单成本</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>订单编号 *</Label>
                <Input
                  placeholder="订单编号"
                  value={importForm.order_number}
                  onChange={(e) => setImportForm({ ...importForm, order_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>承运商名称</Label>
                <Input
                  placeholder="承运商名称（可选）"
                  value={importForm.carrier_name}
                  onChange={(e) => setImportForm({ ...importForm, carrier_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>实际成本 ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="实际成本"
                  value={importForm.actual_cost}
                  onChange={(e) => setImportForm({ ...importForm, actual_cost: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>付款日期 *</Label>
                <Input
                  type="date"
                  value={importForm.import_date}
                  onChange={(e) => setImportForm({ ...importForm, import_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select
                  value={importForm.payment_method}
                  onValueChange={(value) => setImportForm({ ...importForm, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择付款方式（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">支票</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="bank_transfer">银行转账</SelectItem>
                    <SelectItem value="credit_card">信用卡</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>参考编号</Label>
                <Input
                  placeholder="参考编号（可选）"
                  value={importForm.reference_number}
                  onChange={(e) => setImportForm({ ...importForm, reference_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  placeholder="备注（可选）"
                  value={importForm.notes}
                  onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleImport}>
                  导入
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            成本导入记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单编号</TableHead>
                <TableHead>承运商</TableHead>
                <TableHead>实际成本</TableHead>
                <TableHead>付款日期</TableHead>
                <TableHead>付款方式</TableHead>
                <TableHead>参考编号</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>导入时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costImports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    暂无成本导入记录
                  </TableCell>
                </TableRow>
              ) : (
                costImports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.order_number}</TableCell>
                    <TableCell>{item.carrier_name || "-"}</TableCell>
                    <TableCell className="font-medium text-red-600">
                      ${Number(item.actual_cost).toFixed(2)}
                    </TableCell>
                    <TableCell>{new Date(item.import_date).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>{item.payment_method || "-"}</TableCell>
                    <TableCell>{item.reference_number || "-"}</TableCell>
                    <TableCell>{item.notes || "-"}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString('zh-CN')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
