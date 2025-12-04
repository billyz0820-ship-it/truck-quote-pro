import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";

interface ZipMapping {
  id: string;
  zip_prefix: string;
  region: string;
  created_at: string;
}

const REGIONS = [
  { value: "美西", label: "美西" },
  { value: "美东", label: "美东" },
  { value: "美中", label: "美中" },
];

export default function ZipRegionMapping() {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<ZipMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ zip_prefix: "", region: "" });

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("zip_region_mapping")
        .select("*")
        .order("zip_prefix");
      if (error) throw error;
      setMappings(data || []);
    } catch (error: any) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mapping?: ZipMapping) => {
    if (mapping) {
      setEditingId(mapping.id);
      setFormData({ zip_prefix: mapping.zip_prefix, region: mapping.region });
    } else {
      setEditingId(null);
      setFormData({ zip_prefix: "", region: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.zip_prefix || !formData.region) {
      toast({ title: "请填写所有字段", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("zip_region_mapping")
          .update({ zip_prefix: formData.zip_prefix, region: formData.region })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "更新成功" });
      } else {
        const { error } = await supabase
          .from("zip_region_mapping")
          .insert([{ zip_prefix: formData.zip_prefix, region: formData.region }]);
        if (error) throw error;
        toast({ title: "添加成功" });
      }
      setIsDialogOpen(false);
      fetchMappings();
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条映射吗？")) return;
    try {
      const { error } = await supabase.from("zip_region_mapping").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "删除成功" });
      fetchMappings();
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  const handleExport = () => {
    const exportData = filteredMappings.map((m) => ({
      邮编前缀: m.zip_prefix,
      地区: m.region,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "邮编地区映射");
    XLSX.writeFile(wb, "邮编地区映射.xlsx");
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
          zip_prefix: String(row["邮编前缀"] || row["zip_prefix"] || "").padStart(3, "0"),
          region: row["地区"] || row["region"] || "",
        })).filter((item) => item.zip_prefix && item.region);

        // Use upsert to handle duplicates
        const { error } = await supabase
          .from("zip_region_mapping")
          .upsert(importData, { onConflict: "zip_prefix" });
        if (error) throw error;
        toast({ title: "导入成功", description: `处理了 ${importData.length} 条记录` });
        fetchMappings();
      } catch (error: any) {
        toast({ title: "导入失败", description: error.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const filteredMappings = mappings.filter((m) => {
    const matchesSearch = m.zip_prefix.includes(searchTerm);
    const matchesRegion = filterRegion === "all" || m.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  // Group by region for statistics
  const regionStats = REGIONS.map((r) => ({
    region: r.value,
    count: mappings.filter((m) => m.region === r.value).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">邮编地区映射</h1>
          <p className="text-muted-foreground">配置邮编前缀与地区（美西/美东/美中）的对应关系</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              导入
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            添加映射
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        {regionStats.map((stat) => (
          <Card key={stat.region}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{stat.region}</CardTitle>
              <CardDescription>邮编前缀数量</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索邮编前缀..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮编前缀</TableHead>
                  <TableHead>地区</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono font-medium">{mapping.zip_prefix}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{mapping.region}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(mapping)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(mapping.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑映射" : "添加映射"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>邮编前缀 (3位数字)</Label>
              <Input
                value={formData.zip_prefix}
                onChange={(e) => setFormData({ ...formData, zip_prefix: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                placeholder="例：900、100、600"
                maxLength={3}
              />
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
