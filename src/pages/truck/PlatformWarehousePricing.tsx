import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Warehouse, ChevronRight } from "lucide-react";
import { useTab } from "@/contexts/TabContext";
import * as XLSX from "xlsx";

interface PricingGroup {
  pricing_name: string;
  count: number;
  platforms: string[];
  regions: string[];
}

export default function PlatformWarehousePricing() {
  const { toast } = useToast();
  const { openTab } = useTab();
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPricingName, setNewPricingName] = useState("");

  useEffect(() => {
    fetchPricingGroups();
  }, []);

  const fetchPricingGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_warehouse_pricing")
        .select("pricing_name, platform, region")
        .order("pricing_name");

      if (error) throw error;

      const grouped = (data || []).reduce((acc, item) => {
        if (!acc[item.pricing_name]) {
          acc[item.pricing_name] = {
            pricing_name: item.pricing_name,
            count: 0,
            platforms: new Set<string>(),
            regions: new Set<string>(),
          };
        }
        acc[item.pricing_name].count++;
        acc[item.pricing_name].platforms.add(item.platform);
        acc[item.pricing_name].regions.add(item.region);
        return acc;
      }, {} as Record<string, any>);

      const groups: PricingGroup[] = Object.values(grouped).map((g: any) => ({
        pricing_name: g.pricing_name,
        count: g.count,
        platforms: Array.from(g.platforms) as string[],
        regions: Array.from(g.regions) as string[],
      }));

      setPricingGroups(groups);
    } catch (error: any) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (pricingName: string) => {
    openTab({
      title: `平台仓报价 - ${pricingName}`,
      path: `/dashboard/truck/platform-warehouse/${encodeURIComponent(pricingName)}`,
      icon: Warehouse,
    });
  };

  const handleCreatePricing = async () => {
    if (!newPricingName.trim()) {
      toast({ title: "请输入报价名称", variant: "destructive" });
      return;
    }
    setIsCreateDialogOpen(false);
    handleOpenDetail(newPricingName.trim());
    setNewPricingName("");
  };

  const handleExportTemplate = () => {
    const template = [
      {
        报价名称: "示例报价A",
        平台: "Amazon FBA",
        地区: "美东FBA仓",
        仓库编码: "ABE8",
        仓库地址: "705 Boulder Drive, Breinigsville, PA 18031",
        参考时效: "1-3 BUSINESS DAY",
        最小托数: 1,
        最大托数: 7,
        价格: 350,
        最大尺寸: "40*48*72 1000LB",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "报价模板");
    XLSX.writeFile(wb, "平台仓报价导入模板.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (jsonData.length === 0) {
          toast({ title: "文件为空", variant: "destructive" });
          return;
        }

        const importData = jsonData.map((row) => ({
          pricing_name: row["报价名称"] || "",
          platform: row["平台"] || "",
          region: row["地区"] || "",
          warehouse_code: row["仓库编码"] || "",
          warehouse_address: row["仓库地址"] || null,
          transit_time: row["参考时效"] || null,
          min_pallets: parseInt(row["最小托数"]) || 1,
          max_pallets: parseInt(row["最大托数"]) || 7,
          price: parseFloat(row["价格"]) || 0,
          max_dimensions: row["最大尺寸"] || null,
          is_active: true,
        }));

        const { error } = await supabase.from("platform_warehouse_pricing").insert(importData);
        if (error) throw error;
        toast({ title: "导入成功", description: `成功导入 ${importData.length} 条记录` });
        fetchPricingGroups();
      } catch (error: any) {
        toast({ title: "导入失败", description: error.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">平台仓专送</h1>
          <p className="text-muted-foreground">管理平台仓库固定报价配置，支持批量导入</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportTemplate}>
            <Download className="h-4 w-4 mr-2" />
            下载模板
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              批量导入
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增报价
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : pricingGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无报价配置</h3>
            <p className="text-muted-foreground mb-4">点击"批量导入"上传报价表，或点击"新增报价"手动添加</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pricingGroups.map((group) => (
            <Card 
              key={group.pricing_name} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenDetail(group.pricing_name)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{group.pricing_name}</CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">仓库数量：</span>
                    <span className="font-medium ml-1">{group.count} 个</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">平台：</span>
                    <div className="flex gap-1">
                      {group.platforms.slice(0, 3).map((p) => (
                        <Badge key={p} variant="secondary">{p}</Badge>
                      ))}
                      {group.platforms.length > 3 && (
                        <Badge variant="outline">+{group.platforms.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">地区：</span>
                    <div className="flex gap-1">
                      {group.regions.slice(0, 2).map((r) => (
                        <Badge key={r} variant="outline">{r}</Badge>
                      ))}
                      {group.regions.length > 2 && (
                        <Badge variant="outline">+{group.regions.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增报价</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>报价名称 *</Label>
              <Input
                value={newPricingName}
                onChange={(e) => setNewPricingName(e.target.value)}
                placeholder="例：A报价、美东专线报价"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreatePricing}>创建并配置</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}