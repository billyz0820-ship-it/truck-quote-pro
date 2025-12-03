import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Upload, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FreightDiff {
  id: string;
  order_number: string;
  carrier_name: string | null;
  original_fee: number;
  actual_fee: number;
  difference: number;
  import_date: string;
  created_at: string;
}

const FreightDifference = () => {
  const { userRole, user } = useAuth();
  const [diffs, setDiffs] = useState<FreightDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchDiffs();
    }
  }, [userRole]);

  const fetchDiffs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cost_imports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformed = (data || []).map(item => ({
        id: item.id,
        order_number: item.order_number,
        carrier_name: item.carrier_name,
        original_fee: 0, // Would come from order
        actual_fee: item.actual_cost,
        difference: item.actual_cost,
        import_date: item.import_date,
        created_at: item.created_at
      }));
      
      setDiffs(transformed);
    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process and import data
        const imports = jsonData.map((row: any) => ({
          order_number: row['订单号'] || row['order_number'] || '',
          actual_cost: Number(row['实际运费'] || row['actual_cost'] || 0),
          carrier_name: row['物流商'] || row['carrier_name'] || null,
          import_date: new Date().toISOString().split('T')[0],
          created_by: user?.id || '',
        })).filter(item => item.order_number);

        if (imports.length === 0) {
          toast.error("没有找到有效数据");
          return;
        }

        const { error } = await supabase.from('cost_imports').insert(imports);
        if (error) throw error;

        toast.success(`成功导入 ${imports.length} 条运费差异记录`);
        setImportDialogOpen(false);
        fetchDiffs();
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error("导入失败: " + error.message);
    }
  };

  const getTotalStats = () => {
    const total = diffs.length;
    const totalDiff = diffs.reduce((sum, d) => sum + d.difference, 0);
    return { total, totalDiff };
  };

  const stats = getTotalStats();

  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">运费差异</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">运费差异</h1>
          <p className="text-muted-foreground">管理和导入运费差异记录</p>
        </div>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              导入运费差异
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>导入运费差异</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>请上传Excel文件，包含以下列：</p>
                <ul className="list-disc pl-4 mt-2">
                  <li>订单号 (order_number)</li>
                  <li>实际运费 (actual_cost)</li>
                  <li>物流商 (carrier_name) - 可选</li>
                </ul>
              </div>
              <div>
                <Label>选择文件</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总差异金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDiff.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>运费差异列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单编号</TableHead>
                <TableHead>物流商</TableHead>
                <TableHead>差异金额</TableHead>
                <TableHead>导入日期</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">加载中...</TableCell>
                </TableRow>
              ) : diffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    暂无运费差异记录
                  </TableCell>
                </TableRow>
              ) : (
                diffs.map((diff) => (
                  <TableRow key={diff.id}>
                    <TableCell className="font-medium">{diff.order_number}</TableCell>
                    <TableCell>{diff.carrier_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={diff.difference >= 0 ? "destructive" : "default"}>
                        {diff.difference >= 0 ? '+' : ''}{diff.difference.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{diff.import_date}</TableCell>
                    <TableCell>{new Date(diff.created_at).toLocaleDateString('zh-CN')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreightDifference;
