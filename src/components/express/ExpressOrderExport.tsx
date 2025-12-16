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
    orderNo: true,
    customerName: true,
    wareHouseName: true,
    carrierStr: true,
    logisticsidService: true,
    orderSourceTypeName: true,
    recipient: true,
    recipientPostalCode: true,
    recipientStateorProvince: true,
    recipientCityName: true,
    recipientAddress1: true,
    recipientZone: true,
    trackingNumber: true,
    recordNo: true,
    account: true,
    createdTime: true,
    orderStatus: true,
    addressType: true,
    remark: true,
  });
  const { toast } = useToast();

  const fieldLabels: Record<string, string> = {
    orderNo: "订单号",
    customerName: "客户",
    wareHouseName: "发货仓库",
    carrierStr: "物流商",
    logisticsidService: "物流服务",
    orderSourceTypeName: "订单来源",
    recipient: "收件人",
    recipientPostalCode: "邮编",
    recipientStateorProvince: "州",
    recipientCityName: "城市",
    recipientAddress1: "地址",
    recipientZone: "分区",
    trackingNumber: "追踪号",
    recordNo: "记录号",
    account: "物流账号",
    createdTime: "创建时间",
    orderStatus: "订单状态",
    addressType: "地址类型",
    remark: "备注",
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
        
        // 格式化创建时间
        if (field === "createdTime" && value) {
          value = new Date(value).toLocaleString("zh-CN", { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: false 
          }).replace(/\//g, '-');
        }
        
        // 格式化订单状态
        if (field === "orderStatus" && value) {
          const statusMap: Record<number, string> = {
            10: "待打单",
            20: "已打单",
            30: "运输中",
            40: "已送达",
            50: "已取消",
          };
          value = statusMap[value] || `状态${value}`;
        }
        
        // 格式化地址类型
        if (field === "addressType" && value) {
          const addressTypeMap: Record<number, string> = {
            1: "混合",
            2: "未知",
            3: "商业",
            4: "住宅",
          };
          value = addressTypeMap[value] || "未知";
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
