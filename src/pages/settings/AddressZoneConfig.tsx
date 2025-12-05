import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface ZipZone {
  id: string;
  address_id: string;
  zip_start: string;
  zip_end: string;
  zone: number;
}

interface AddressInfo {
  id: string;
  name: string;
  contact_name: string;
  address: string;
  zip: string;
  city: string;
  state: string;
}

export default function AddressZoneConfig() {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const [address, setAddress] = useState<AddressInfo | null>(null);
  const [zones, setZones] = useState<ZipZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    zip_start: "",
    zip_end: "",
    zone: 1
  });

  useEffect(() => {
    if (addressId) {
      fetchData();
    }
  }, [addressId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch address info
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id, name, contact_name, address, zip, city, state')
        .eq('id', addressId)
        .single();
      
      if (addressError) throw addressError;
      setAddress(addressData as AddressInfo);

      // Fetch zones - use any type since table might not be in types yet
      const { data: zonesData, error: zonesError } = await supabase
        .from('address_zip_zones' as any)
        .select('*')
        .eq('address_id', addressId)
        .order('zip_start');
      
      if (zonesError && !zonesError.message.includes('does not exist')) throw zonesError;
      setZones((zonesData || []) as unknown as ZipZone[]);
    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    try {
      if (!formData.zip_start || !formData.zip_end) {
        toast.error("请填写邮编区间");
        return;
      }

      const { error } = await supabase
        .from('address_zip_zones' as any)
        .insert({
          address_id: addressId,
          zip_start: formData.zip_start,
          zip_end: formData.zip_end,
          zone: formData.zone
        });

      if (error) throw error;
      toast.success("分区已添加");
      setDialogOpen(false);
      setFormData({ zip_start: "", zip_end: "", zone: 1 });
      fetchData();
    } catch (error: any) {
      toast.error("添加失败: " + error.message);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("确定要删除此分区吗？")) return;
    try {
      const { error } = await supabase
        .from('address_zip_zones' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("分区已删除");
      fetchData();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const zonesToInsert: { address_id: string; zip_start: string; zip_end: string; zone: number }[] = [];

        jsonData.forEach((row: any) => {
          // Support formats: "00000-00399" or separate columns
          const zipRange = row['Destination ZIP'] || row['邮编区间'] || row['ZIP Range'];
          const zone = row['Zone'] || row['分区'] || row['zone'];

          if (zipRange && zone) {
            const match = zipRange.toString().match(/(\d{5})-(\d{5})/);
            if (match) {
              const zoneNum = parseInt(zone);
              if (!isNaN(zoneNum) && zoneNum >= 1 && zoneNum <= 8) {
                zonesToInsert.push({
                  address_id: addressId!,
                  zip_start: match[1],
                  zip_end: match[2],
                  zone: zoneNum
                });
              }
            }
          } else if (row['zip_start'] && row['zip_end'] && row['zone']) {
            const zoneNum = parseInt(row['zone']);
            if (!isNaN(zoneNum) && zoneNum >= 1 && zoneNum <= 8) {
              zonesToInsert.push({
                address_id: addressId!,
                zip_start: row['zip_start'].toString().padStart(5, '0'),
                zip_end: row['zip_end'].toString().padStart(5, '0'),
                zone: zoneNum
              });
            }
          }
        });

        if (zonesToInsert.length === 0) {
          toast.error("未找到有效的分区数据，请检查Excel格式");
          return;
        }

        // Delete existing zones first
        await supabase.from('address_zip_zones' as any).delete().eq('address_id', addressId);

        // Insert new zones
        const { error } = await supabase.from('address_zip_zones' as any).insert(zonesToInsert);
        if (error) throw error;

        toast.success(`成功导入 ${zonesToInsert.length} 条分区数据`);
        fetchData();
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error("导入失败: " + error.message);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleExport = () => {
    const exportData = zones.map(z => ({
      '邮编区间': `${z.zip_start}-${z.zip_end}`,
      '分区': z.zone
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "邮编分区");
    XLSX.writeFile(wb, `邮编分区_${address?.zip || 'unknown'}.xlsx`);
    toast.success("导出成功");
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { '邮编区间': '00000-00399', '分区': 'NA' },
      { '邮编区间': '00400-00599', '分区': '7' },
      { '邮编区间': '01000-04699', '分区': '7' },
      { '邮编区间': '04700-04799', '分区': '8' },
      { '邮编区间': '04800-06999', '分区': '7' },
      { '邮编区间': '07000-10499', '分区': '6' },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "模板");
    XLSX.writeFile(wb, "邮编分区导入模板.xlsx");
    toast.success("模板已下载");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/settings/addresses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold">邮编分区配置</h1>
          <p className="text-sm text-muted-foreground">
            {address?.name || address?.contact_name} - {address?.address}, {address?.city}, {address?.state} {address?.zip}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>分区列表</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                下载模板
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={zones.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  导入
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                </label>
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加分区
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无分区配置</p>
              <p className="text-sm mt-2">请点击"导入"按钮上传邮编分区表，或手动添加分区</p>
            </div>
          ) : (
            <div className="border rounded-md max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>邮编区间</TableHead>
                    <TableHead>分区</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-mono">{zone.zip_start} - {zone.zip_end}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                          {zone.zone}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加邮编分区</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>起始邮编</Label>
                <Input 
                  value={formData.zip_start} 
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_start: e.target.value }))}
                  placeholder="00000"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>结束邮编</Label>
                <Input 
                  value={formData.zip_end} 
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_end: e.target.value }))}
                  placeholder="99999"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>分区 (1-8)</Label>
              <Input 
                type="number"
                min={1}
                max={8}
                value={formData.zone} 
                onChange={(e) => setFormData(prev => ({ ...prev, zone: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddZone}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
