import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface QuotationExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configs: any[];
  fields: any[];
}

export const QuotationExportDialog = ({ open, onOpenChange, configs, fields }: QuotationExportDialogProps) => {
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (configs.length === 0) {
      toast.error('没有可导出的数据');
      return;
    }

    setExporting(true);

    try {
      if (exportFormat === 'excel') {
        exportToExcel();
      } else {
        exportToPDF();
      }
      
      toast.success('导出成功！');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    // 准备表头
    const headers = ['收费项目', ...configs.map(c => c.customers.company_name)];
    
    // 准备数据行
    const rows = fields.map(field => {
      const row = [field.label];
      configs.forEach(config => {
        const value = getFieldValue(config, field);
        row.push(value || '-');
      });
      return row;
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 },
      ...configs.map(() => ({ wch: 25 }))
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '报价对比');

    // 下载文件
    const fileName = `报价对比_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    // 创建打印内容
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>报价对比</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .lowest {
              background-color: #d4edda;
              font-weight: bold;
            }
            .highest {
              background-color: #f8d7da;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>客户报价对比表</h1>
          <p style="text-align: center; color: #666;">生成日期: ${new Date().toLocaleDateString('zh-CN')}</p>
          <table>
            <thead>
              <tr>
                <th>收费项目</th>
                ${configs.map(c => `<th>${c.customers.company_name}<br><small>${c.customers.customer_code}</small></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${fields.map(field => `
                <tr>
                  <td>${field.label}</td>
                  ${configs.map(config => {
                    const value = getFieldValue(config, field);
                    return `<td>${value || '-'}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>本报价对比表由系统自动生成</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // 等待内容加载后打印
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getFieldValue = (config: any, field: any) => {
    const data = config.custom_prices;
    if (!data || !data[field.key]) return null;

    switch (field.type) {
      case 'zone':
        const zonePrices = data[field.key];
        if (typeof zonePrices === 'object' && zonePrices !== null) {
          return zonePrices['2_1'] ? `$${zonePrices['2_1']}` : '已配置';
        }
        return '已配置';
      case 'percentage':
        return `${data[field.key]}%`;
      case 'number':
        return `$${data[field.key]}`;
      case 'signature':
        const sig = data[field.key];
        return sig ? `直接:$${sig.direct_signature} 间接:$${sig.indirect_signature} 成人:$${sig.adult_signature}` : null;
      case 'surcharge':
        return Array.isArray(data[field.key]) && data[field.key].length > 0 ? '已配置' : null;
      case 'remote':
        return data[field.key]?.length > 0 ? '已配置' : null;
      default:
        return data[field.key];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出报价对比</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Excel 文件</div>
                  <div className="text-sm text-muted-foreground">导出为 .xlsx 格式，便于数据处理</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">PDF 文件</div>
                  <div className="text-sm text-muted-foreground">导出为打印友好格式</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-muted-foreground">
              将导出 {configs.length} 个客户的报价对比数据
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? '导出中...' : '导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
