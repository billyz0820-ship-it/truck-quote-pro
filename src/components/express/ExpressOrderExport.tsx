import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ExpressOrderExportProps {
  orders: any[];
  selectedOrders?: string[];
}

export function ExpressOrderExport({ orders, selectedOrders }: ExpressOrderExportProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    order_number: true,
    customer_code: true,
    warehouse: true,
    carrier: true,
    service_type: true,
    recipient_name: true,
    zip_code: true,
    state: true,
    city: true,
    address: true,
    recipient_phone: true,
    recipient_email: true,
    tracking_number: true,
    shipping_fee: true,
    status: true,
    created_at: true,
  });
  const { toast } = useToast();

  const fieldLabels: Record<string, string> = {
    order_number: "订单号",
    customer_code: "客户编码",
    warehouse: "发货仓库",
    carrier: "物流商",
    service_type: "物流服务",
    recipient_name: "收件人",
    zip_code: "邮编",
    state: "州",
    city: "城市",
    address: "地址",
    recipient_phone: "电话",
    recipient_email: "邮箱",
    tracking_number: "物流单号",
    shipping_fee: "运费",
    status: "状态",
    created_at: "创建时间",
  };

  const handleFieldToggle = (field: string) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleExport = () => {
    const exportData = selectedOrders && selectedOrders.length > 0
      ? orders.filter((o: any) => selectedOrders.includes(o.id))
      : orders;

    if (exportData.length === 0) {
      toast({
        title: "导出失败",
        description: "没有可导出的数据",
        variant: "destructive",
      });
      return;
    }

    const selectedFields = Object.entries(fields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    const headers = selectedFields.map(f => fieldLabels[f]).join(",");
    const rows = exportData.map(order => {
      return selectedFields.map(field => {
        let value = order[field] || "";
        if (field === "created_at" && value) {
          value = new Date(value).toLocaleString("zh-CN");
        }
        // 处理包含逗号的值
        if (typeof value === "string" && value.includes(",")) {
          value = `"${value}"`;
        }
        return value;
      }).join(",");
    }).join("\n");

    const csv = `\ufeff${headers}\n${rows}`; // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `express_orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "导出成功",
      description: `已导出 ${exportData.length} 条订单`,
    });
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <FileDown className="h-4 w-4" />
        导出
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出快递订单</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedOrders && selectedOrders.length > 0
                ? `已选择 ${selectedOrders.length} 条订单`
                : `将导出所有 ${orders.length} 条订单`}
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm">选择导出字段：</div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={fields[field as keyof typeof fields]}
                      onCheckedChange={() => handleFieldToggle(field)}
                    />
                    <label
                      htmlFor={field}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleExport} className="flex-1">
                导出
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
