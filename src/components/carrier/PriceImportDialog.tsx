import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface PriceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (prices: Record<string, Record<string, number>>) => void;
}

export function PriceImportDialog({ open, onOpenChange, onImport }: PriceImportDialogProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // 期望格式：第一行是表头（Weight, Zone-2, Zone-3, ...）
      // 从第二行开始是数据
      if (jsonData.length < 2) {
        throw new Error("文件格式不正确");
      }

      const headers = jsonData[0];
      const zoneColumns: string[] = [];
      
      // 查找Zone列
      headers.forEach((header: any, index: number) => {
        if (typeof header === "string" && header.startsWith("Zone-")) {
          zoneColumns.push(header.replace("Zone-", ""));
        }
      });

      if (zoneColumns.length === 0) {
        throw new Error("未找到Zone列，请确保列名格式为 Zone-2, Zone-3 等");
      }

      const prices: Record<string, Record<string, number>> = {};

      // 处理数据行
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const weight = String(row[0]);
        
        if (!weight || weight === "") continue;

        prices[weight] = {};
        
        headers.forEach((header: any, colIndex: number) => {
          if (typeof header === "string" && header.startsWith("Zone-")) {
            const zone = header.replace("Zone-", "");
            const price = parseFloat(row[colIndex]);
            if (!isNaN(price)) {
              prices[weight][zone] = price;
            }
          }
        });
      }

      onImport(prices);
      toast({ title: "导入成功", description: `已导入 ${Object.keys(prices).length} 条价格数据` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: "导入失败", 
        description: error.message || "请确保文件格式正确",
        variant: "destructive" 
      });
    }
  };

  const handleDownloadTemplate = () => {
    const zones = ["2", "3", "4", "5", "6", "7"];
    const weights = Array.from({ length: 150 }, (_, i) => i + 1);
    
    // 创建模板数据
    const templateData = [
      ["Weight", ...zones.map(z => `Zone-${z}`)],
      ...weights.map(w => [w, ...zones.map(() => 0)])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "基础价格");
    
    XLSX.writeFile(workbook, "基础价格模板.xlsx");
    
    toast({ title: "模板下载成功" });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      handleFileUpload(file);
    } else {
      toast({ title: "请上传Excel或CSV文件", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量导入基础价格</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              拖拽Excel或CSV文件到此处，或点击下方按钮选择文件
            </p>
            
            <label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  选择文件
                </span>
              </Button>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">或</span>
            <div className="flex-1 border-t" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            下载Excel模板
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">文件格式说明：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>第一行：Weight, Zone-2, Zone-3, Zone-4, Zone-5, Zone-6, Zone-7</li>
              <li>从第二行开始：重量值和对应的各区域价格</li>
              <li>支持.xlsx, .xls, .csv格式</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
