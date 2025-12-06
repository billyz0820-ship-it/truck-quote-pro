import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search } from "lucide-react";

export default function RemoteAreas() {
  const [searchZip, setSearchZip] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [zones, setZones] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 处理CSV文件上传
    toast({ title: "文件上传功能开发中" });
  };

  const handleSearch = async () => {
    let query = supabase.from("remote_area_zones").select("*");

    if (searchZip) {
      query = query.eq("zip_code", searchZip);
    }
    if (selectedCarrier !== "all") {
      query = query.eq("carrier", selectedCarrier);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "查询失败", description: error.message, variant: "destructive" });
    } else {
      setZones(data || []);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">偏远地址配置</h1>
        <p className="text-muted-foreground mt-1">配置DAS、Extend、Remote区域邮编</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>导入邮编</CardTitle>
          <CardDescription>上传CSV文件批量导入偏远地址邮编</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              导入
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>查询邮编</CardTitle>
          <CardDescription>搜索邮编查看偏远地址分类</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>邮编</Label>
              <Input
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
                placeholder="输入邮编"
              />
            </div>
            <div>
              <Label>承运商</Label>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮编</TableHead>
              <TableHead>承运商</TableHead>
              <TableHead>区域类型</TableHead>
              <TableHead>服务类型</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.zip_code}</TableCell>
                  <TableCell>{zone.carrier}</TableCell>
                  <TableCell>{zone.zone_type}</TableCell>
                  <TableCell>{zone.service_type || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
