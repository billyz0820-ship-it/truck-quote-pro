import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileDown, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LabelExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderIds: string[];
  orderType: 'express' | 'return';
}

export function LabelExportDialog({ open, onOpenChange, orderIds, orderType }: LabelExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf');

  const handleExport = async () => {
    if (orderIds.length === 0) {
      toast.error("请选择要导出的订单");
      return;
    }

    try {
      setExporting(true);
      
      // Generate label content (placeholder - in real implementation, this would call an API)
      const labelContent = generateLabelContent(orderIds, format);
      
      if (format === 'pdf') {
        exportAsPDF(labelContent, orderIds);
      } else {
        exportAsPNG(labelContent, orderIds);
      }

      toast.success(`已导出 ${orderIds.length} 个订单的面单为${format.toUpperCase()}格式`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error("导出失败: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const generateLabelContent = (ids: string[], exportFormat: string) => {
    // This is a placeholder - in real implementation, this would generate actual label content
    return {
      orderIds: ids,
      format: exportFormat,
      timestamp: new Date().toISOString(),
    };
  };

  const exportAsPDF = (content: any, ids: string[]) => {
    // Create a printable HTML document for PDF export
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("无法打开打印窗口，请检查浏览器设置");
      return;
    }

    const orderType_CN = orderType === 'express' ? '快递' : '退货';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${orderType_CN}面单导出</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label { border: 2px solid #000; padding: 20px; margin-bottom: 20px; page-break-after: always; }
            .label:last-child { page-break-after: auto; }
            .header { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .barcode { font-family: monospace; font-size: 18px; letter-spacing: 3px; margin: 15px 0; }
            .info-row { display: flex; margin: 8px 0; }
            .info-label { width: 100px; font-weight: bold; }
            .info-value { flex: 1; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${ids.map((id, index) => `
            <div class="label">
              <div class="header">${orderType_CN}面单 #${index + 1}</div>
              <div class="barcode">*${id.slice(0, 12).toUpperCase()}*</div>
              <div class="info-row">
                <span class="info-label">订单ID:</span>
                <span class="info-value">${id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">导出时间:</span>
                <span class="info-value">${new Date().toLocaleString('zh-CN')}</span>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const exportAsPNG = (content: any, ids: string[]) => {
    // Create canvas for PNG export
    ids.forEach((id, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Draw label content
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      const orderType_CN = orderType === 'express' ? '快递' : '退货';
      ctx.fillText(`${orderType_CN}面单 #${index + 1}`, 30, 60);
      
      ctx.font = '16px monospace';
      ctx.fillText(`*${id.slice(0, 12).toUpperCase()}*`, 30, 120);
      
      ctx.font = '14px Arial';
      ctx.fillText(`订单ID: ${id}`, 30, 180);
      ctx.fillText(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 30, 210);

      // Download the canvas as PNG
      const link = document.createElement('a');
      link.download = `label-${id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出面单</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            将导出 <span className="font-bold text-foreground">{orderIds.length}</span> 个订单的面单
          </div>
          
          <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'png')}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-medium">PDF 格式</div>
                  <div className="text-sm text-muted-foreground">适合批量打印，所有面单合并为一个文件</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="png" id="png" />
              <Label htmlFor="png" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileImage className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">PNG 格式</div>
                  <div className="text-sm text-muted-foreground">每个面单单独导出为图片文件</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              <FileDown className="h-4 w-4 mr-2" />
              {exporting ? "导出中..." : "确认导出"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
