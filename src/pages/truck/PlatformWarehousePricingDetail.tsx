import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Upload, Download, Search, Warehouse } from "lucide-react";
import { useTab } from "@/contexts/TabContext";
import * as XLSX from "xlsx";

interface PricingItem {
  id: string;
  pricing_name: string;
  carrier_id: string | null;
  platform: string;
  region: string;
  warehouse_code: string;
  warehouse_address: string | null;
  transit_time: string | null;
  min_pallets: number;
  max_pallets: number;
  price: number;
  max_dimensions: string | null;
  is_active: boolean;
  created_at: string;
  truck_carriers?: { carrier_name: string } | null;
}

const PLATFORMS = [
  { value: "Amazon FBA", label: "Amazon FBA" },
  { value: "Wayfair CG", label: "Wayfair CG" },
  { value: "Walmart WFS", label: "Walmart WFS" },
  { value: "Target", label: "Target" },
  { value: "Costco", label: "Costco" },
  { value: "Home Depot", label: "Home Depot" },
  { value: "Other", label: "其他" },
];

const REGIONS = [
  { value: "美西", label: "美西" },
  { value: "美东", label: "美东" },
  { value: "美中", label: "美中" },
];

export default function PlatformWarehousePricingDetail() {
  const { pricingName } = useParams();
  const decodedName = decodeURIComponent(pricingName || "");
  const { toast } = useToast();
  const { openTab, closeTab } = useTab();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentTabId = `/dashboard/truck/platform-warehouse/${encodeURIComponent(decodedName)}`.replace(/\//g, "-");

  const [formData, setFormData] = useState({
    carrier_id: "",
    platform: "",
    region: "",
    warehouse_code: "",
    warehouse_address: "",
    transit_time: "",
    min_pallets: 1,
    max_pallets: 7,
    price: 0,
    max_dimensions: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, [decodedName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, carriersRes] = await Promise.all([
        supabase
          .from("platform_warehouse_pricing")
          .select("*, truck_carriers(carrier_name)")
          .eq("pricing_name", decodedName)
          .order("region")
          .order("warehouse_code"),
        supabase.from("truck_carriers").select("id, carrier_name").eq("status", "active"),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (carriersRes.data) setCarriers(carriersRes.data);
    } catch (error: any) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    closeTab(currentTabId);
    openTab({
      title: "平台仓专送",
      path: "/dashboard/truck/platform-warehouse",
      icon: Warehouse,
    });
  };

  const handleOpenDialog = (item?: PricingItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        carrier_id: item.carrier_id || "",
        platform: item.platform,
        region: item.region,
        warehouse_code: item.warehouse_code,
        warehouse_address: item.warehouse_address || "",
        transit_time: item.transit_time || "",
        min_pallets: item.min_pallets,
        max_pallets: item.max_pallets,
        price: item.price,
        max_dimensions: item.max_dimensions || "",
        is_active: item.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({
        carrier_id: "",
        platform: "",
        region: "",
        warehouse_code: "",
        warehouse_address: "",
        transit_time: "",
        min_pallets: 1,
        max_pallets: 7,
        price: 0,
        max_dimensions: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.platform || !formData.warehouse_code || !formData.price) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }

    try {
      const dataToSave = {
        pricing_name: decodedName,
        carrier_id: formData.carrier_id || null,
        platform: formData.platform,
        region: formData.region,
        warehouse_code: formData.warehouse_code,
        warehouse_address: formData.warehouse_address || null,
        transit_time: formData.transit_time || null,
        min_pallets: formData.min_pallets,
        max_pallets: formData.max_pallets,
        price: formData.price,
        max_dimensions: formData.max_dimensions || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("platform_warehouse_pricing").update(dataToSave).eq("id", editingId);
        if (error) throw error;
        toast({ title: "更新成功" });
      } else {
        const { error } = await supabase.from("platform_warehouse_pricing").insert([dataToSave]);
        if (error) throw error;
        toast({ title: "创建成功" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条报价吗？")) return;
    try {
      const { error } = await supabase.from("platform_warehouse_pricing").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "删除成功" });
      fetchData();
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("platform_warehouse_pricing").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    }
  };

  const handleExport = () => {
    const exportData = filteredItems.map((p) => ({
      报价名称: p.pricing_name,
      承运商: p.truck_carriers?.carrier_name || "",
      平台: p.platform,
      地区: p.region,
      仓库编码: p.warehouse_code,
      仓库地址: p.warehouse_address,
      参考时效: p.transit_time,
      最小托数: p.min_pallets,
      最大托数: p.max_pallets,
      价格: p.price,
      最大尺寸: p.max_dimensions,
      状态: p.is_active ? "启用" : "禁用",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, decodedName);
    XLSX.writeFile(wb, `${decodedName}.xlsx`);
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

        const importData = jsonData.map((row) => ({
          pricing_name: decodedName,
          platform: row["平台"] || "",
          region: row["地区"] || "",
          warehouse_code: row["仓库编码"] || "",
          warehouse_address: row["仓库地址"] || null,
          transit_time: row["参考时效"] || null,
          min_pallets: parseInt(row["最小托数"]) || 1,
          max_pallets: parseInt(row["最大托数"]) || 7,
          price: parseFloat(row["价格"]) || 0,
          max_dimensions: row["最大尺寸"] || null,
          is_active: row["状态"] !== "禁用",
        }));

        const { error } = await supabase.from("platform_warehouse_pricing").insert(importData);
        if (error) throw error;
        toast({ title: "导入成功", description: `成功导入 ${importData.length} 条记录` });
        fetchData();
      } catch (error: any) {
        toast({ title: "导入失败", description: error.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const filteredItems = items.filter((p) => {
    const matchesSearch =
      p.warehouse_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.warehouse_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || p.platform === filterPlatform;
    const matchesRegion = filterRegion === "all" || p.region === filterRegion;
    return matchesSearch && matchesPlatform && matchesRegion;
  });

  // Group by region for display
  const groupedByRegion = filteredItems.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = [];
    }
    acc[item.region].push(item);
    return acc;
  }, {} as Record<string, PricingItem[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{decodedName}</h1>
          <p className="text-muted-foreground">共 {items.length} 个仓库配置</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              追加导入
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            新增仓库
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索仓库编码或地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="所有平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有平台</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="所有地区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有地区</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : Object.keys(groupedByRegion).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无仓库配置，请导入或手动添加</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByRegion).map(([region, regionItems]) => (
                <div key={region}>
                  <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                    <Badge variant="outline">{region}</Badge>
                    <span className="text-sm text-muted-foreground">({regionItems.length} 个仓库)</span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>仓库编码</TableHead>
                        <TableHead>平台</TableHead>
                        <TableHead>仓库地址</TableHead>
                        <TableHead>参考时效</TableHead>
                        <TableHead>托数范围</TableHead>
                        <TableHead>价格</TableHead>
                        <TableHead>最大尺寸</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regionItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.warehouse_code}</TableCell>
                          <TableCell><Badge variant="secondary">{item.platform}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.warehouse_address}</TableCell>
                          <TableCell>{item.transit_time}</TableCell>
                          <TableCell>{item.min_pallets}-{item.max_pallets}托</TableCell>
                          <TableCell className="font-medium">${item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.max_dimensions}</TableCell>
                          <TableCell>
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑仓库" : "新增仓库"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>平台 *</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>地区</Label>
              <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                <SelectTrigger><SelectValue placeholder="选择地区" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>仓库编码 *</Label>
              <Input
                value={formData.warehouse_code}
                onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value.toUpperCase() })}
                placeholder="例：ABE8、TEB6"
              />
            </div>
            <div className="space-y-2">
              <Label>参考时效</Label>
              <Input
                value={formData.transit_time}
                onChange={(e) => setFormData({ ...formData, transit_time: e.target.value })}
                placeholder="例：1-3 BUSINESS DAY"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>仓库地址</Label>
              <Input
                value={formData.warehouse_address}
                onChange={(e) => setFormData({ ...formData, warehouse_address: e.target.value })}
                placeholder="完整的仓库地址"
              />
            </div>
            <div className="space-y-2">
              <Label>最小托数</Label>
              <Input
                type="number"
                value={formData.min_pallets}
                onChange={(e) => setFormData({ ...formData, min_pallets: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>最大托数</Label>
              <Input
                type="number"
                value={formData.max_pallets}
                onChange={(e) => setFormData({ ...formData, max_pallets: parseInt(e.target.value) || 7 })}
              />
            </div>
            <div className="space-y-2">
              <Label>价格 ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>最大尺寸</Label>
              <Input
                value={formData.max_dimensions}
                onChange={(e) => setFormData({ ...formData, max_dimensions: e.target.value })}
                placeholder="例：40*48*72 1000LB"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>启用此报价</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
