import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

interface ExpressOrderImportProps {
  onSuccess: () => void;
}

export function ExpressOrderImport({ onSuccess }: ExpressOrderImportProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());

      const requiredFields = ["order_number", "customer_code", "warehouse", "carrier", "service_type", 
                             "recipient_name", "zip_code", "state", "city", "address"];
      const missingFields = requiredFields.filter(f => !headers.includes(f));

      if (missingFields.length > 0) {
        toast({
          title: "导入失败",
          description: `缺少必填字段: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const errors: Array<{ row: number; message: string }> = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map(v => v.trim());
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || null;
        });

        // 验证必填字段
        const missingValues = requiredFields.filter(f => !rowData[f]);
        if (missingValues.length > 0) {
          errors.push({ row: i + 1, message: `缺少必填值: ${missingValues.join(", ")}` });
          continue;
        }

        // 插入数据
        const { error } = await supabase.from("express_orders").insert({
          ...rowData,
          customer_id: rowData.customer_id || "00000000-0000-0000-0000-000000000000", // 需要从 customer_code 查询
          status: "pending_label",
          country: rowData.country || "US",
        });

        if (error) {
          errors.push({ row: i + 1, message: error.message });
        } else {
          success++;
        }
      }

      setResult({
        success,
        failed: errors.length,
        errors: errors.slice(0, 10), // 只显示前10个错误
      });

      if (success > 0) {
        onSuccess();
        toast({
          title: "导入完成",
          description: `成功导入 ${success} 条订单`,
        });
      }
    } catch (error: any) {
      toast({
        title: "导入失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = ""; // 重置文件选择
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "order_number", "customer_code", "warehouse", "carrier", "service_type",
      "recipient_name", "zip_code", "state", "city", "address",
      "recipient_phone", "recipient_email", "reference_number", "signature_service"
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "express_order_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <FileUp className="h-4 w-4" />
        导入
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量导入快递订单</DialogTitle>
            <DialogDescription>
              支持 CSV 格式文件，请确保文件包含所有必填字段
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                下载模板
              </Button>
              <div className="flex-1">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={importing} className="w-full cursor-pointer">
                    <span>
                      {importing ? "导入中..." : "选择文件"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {result && (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    成功导入 {result.success} 条订单，失败 {result.failed} 条
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">错误详情：</div>
                      <div className="space-y-1 text-sm">
                        {result.errors.map((error, index) => (
                          <div key={index}>
                            第 {error.row} 行: {error.message}
                          </div>
                        ))}
                        {result.failed > 10 && (
                          <div className="text-muted-foreground">
                            还有 {result.failed - 10} 条错误未显示
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
