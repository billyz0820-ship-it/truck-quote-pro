import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Upload, DollarSign, Download, Search, 
  AlertTriangle, CheckCircle, XCircle, Package, 
  MapPin, Scale, Truck, Filter, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FreightDifference {
  id: string;
  batch_id: string;
  tracking_number: string;
  carrier: string;
  carrier_billed_weight: number | null;
  carrier_billed_length: number | null;
  carrier_billed_width: number | null;
  carrier_billed_height: number | null;
  carrier_billed_zone: string | null;
  carrier_base_fee: number;
  carrier_fuel_surcharge: number;
  carrier_residential_fee: number;
  carrier_remote_area_fee: number;
  carrier_oversize_fee: number;
  carrier_ahs_fee: number;
  carrier_peak_surcharge: number;
  carrier_other_fees: number;
  carrier_total_cost: number;
  match_status: string;
  order_id: string | null;
  customer_id: string | null;
  customer_code: string | null;
  original_weight: number | null;
  original_length: number | null;
  original_width: number | null;
  original_height: number | null;
  original_zone: string | null;
  original_shipping_fee: number | null;
  difference_type: string[] | null;
  weight_difference: number | null;
  zone_difference: string | null;
  recalculated_total: number;
  difference_amount: number;
  status: string;
  notes: string | null;
  import_date: string;
  created_at: string;
}

interface ImportBatch {
  id: string;
  batch_name: string | null;
  carrier: string;
  import_date: string;
  file_name: string | null;
  total_records: number;
  matched_count: number;
  unmatched_count: number;
  total_difference: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
}

const FreightDifference = () => {
  const { userRole, user } = useAuth();
  const [differences, setDifferences] = useState<FreightDifference[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<FreightDifference | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterMatchStatus, setFilterMatchStatus] = useState<string>("all");
  const [filterDiffType, setFilterDiffType] = useState<string>("all");
  const [filterCarrier, setFilterCarrier] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");

  // Import form states
  const [importCarrier, setImportCarrier] = useState("FedEx");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [diffsRes, batchesRes, customersRes] = await Promise.all([
        supabase.from('freight_differences').select('*').order('created_at', { ascending: false }),
        supabase.from('freight_difference_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, customer_code, company_name')
      ]);

      if (diffsRes.error) throw diffsRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (customersRes.error) throw customersRes.error;

      setDifferences(diffsRes.data || []);
      setBatches(batchesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        '追踪号': 'TRACK123456789',
        '承运商': 'FedEx',
        '计费重量(lb)': 10.5,
        '计费长度(in)': 12,
        '计费宽度(in)': 8,
        '计费高度(in)': 6,
        '计费区域': '5',
        '基础运费': 15.50,
        '燃油附加费': 2.30,
        '住宅配送费': 0,
        '偏远地区费': 0,
        '超大件费': 0,
        'AHS费用': 0,
        '旺季附加费': 0,
        '其他费用': 0,
        '总费用': 17.80,
        '差异金额(可选)': '',
        '差异类型(可选)': '',
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "运费差异模板");
    XLSX.writeFile(wb, "运费差异导入模板.xlsx");
    toast.success("模板下载成功");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast.error("文件中没有数据");
            setImporting(false);
            return;
          }

          // Create batch record
          const { data: batchData, error: batchError } = await supabase
            .from('freight_difference_batches')
            .insert({
              batch_name: file.name.replace(/\.[^/.]+$/, ""),
              carrier: importCarrier,
              import_date: new Date().toISOString().split('T')[0],
              imported_by: user.id,
              file_name: file.name,
              total_records: jsonData.length,
              status: 'processing'
            })
            .select()
            .single();

          if (batchError) throw batchError;
          const batchId = batchData.id;

          // Process each row and match with express_orders
          let matchedCount = 0;
          let unmatchedCount = 0;
          let totalDifference = 0;

          const diffRecords: any[] = [];

          for (const row of jsonData as any[]) {
            const trackingNumber = row['追踪号'] || row['tracking_number'] || '';
            if (!trackingNumber) continue;

            // Try to match with express_orders
            const { data: orderData } = await supabase
              .from('express_orders')
              .select(`
                id, customer_id, customer_code, zone, shipping_fee,
                express_packages(weight, length, width, height)
              `)
              .eq('tracking_number', trackingNumber)
              .maybeSingle();

            const carrierTotalCost = Number(row['总费用'] || row['carrier_total_cost'] || 0);
            const isMatched = !!orderData;

            // Analyze differences
            const differenceTypes: string[] = [];
            let weightDiff: number | null = null;
            let zoneDiff: string | null = null;
            let originalWeight: number | null = null;
            let originalLength: number | null = null;
            let originalWidth: number | null = null;
            let originalHeight: number | null = null;
            let originalZone: string | null = null;
            let originalShippingFee: number | null = null;

            if (orderData) {
              matchedCount++;
              const pkg = orderData.express_packages?.[0];
              
              originalWeight = pkg?.weight || null;
              originalLength = pkg?.length || null;
              originalWidth = pkg?.width || null;
              originalHeight = pkg?.height || null;
              originalZone = orderData.zone;
              originalShippingFee = orderData.shipping_fee;

              const carrierWeight = Number(row['计费重量(lb)'] || 0);
              const carrierZone = row['计费区域'] || '';

              // Weight difference
              if (originalWeight && carrierWeight && Math.abs(carrierWeight - originalWeight) > 0.1) {
                differenceTypes.push('weight');
                weightDiff = carrierWeight - originalWeight;
              }

              // Dimension difference
              const carrierL = Number(row['计费长度(in)'] || 0);
              const carrierW = Number(row['计费宽度(in)'] || 0);
              const carrierH = Number(row['计费高度(in)'] || 0);
              if ((originalLength && Math.abs(carrierL - originalLength) > 0.1) ||
                  (originalWidth && Math.abs(carrierW - originalWidth) > 0.1) ||
                  (originalHeight && Math.abs(carrierH - originalHeight) > 0.1)) {
                differenceTypes.push('dimension');
              }

              // Zone difference
              if (originalZone && carrierZone && originalZone !== carrierZone) {
                differenceTypes.push('zone');
                zoneDiff = `${originalZone}->${carrierZone}`;
              }

              // Surcharge differences
              if (Number(row['住宅配送费'] || 0) > 0) differenceTypes.push('residential');
              if (Number(row['偏远地区费'] || 0) > 0) differenceTypes.push('remote');
              if (Number(row['超大件费'] || 0) > 0) differenceTypes.push('oversize');
              if (Number(row['AHS费用'] || 0) > 0) differenceTypes.push('ahs');

            } else {
              unmatchedCount++;
              differenceTypes.push('not_found');
            }

            // Calculate difference amount
            // For now, use carrier cost - original shipping fee as the difference
            // Later this will be recalculated based on customer pricing
            let differenceAmount = 0;
            if (orderData && orderData.shipping_fee) {
              differenceAmount = carrierTotalCost - orderData.shipping_fee;
            } else {
              differenceAmount = carrierTotalCost;
            }
            totalDifference += differenceAmount;

            diffRecords.push({
              batch_id: batchId,
              import_date: new Date().toISOString().split('T')[0],
              imported_by: user.id,
              tracking_number: trackingNumber,
              carrier: importCarrier,
              carrier_billed_weight: Number(row['计费重量(lb)'] || 0) || null,
              carrier_billed_length: Number(row['计费长度(in)'] || 0) || null,
              carrier_billed_width: Number(row['计费宽度(in)'] || 0) || null,
              carrier_billed_height: Number(row['计费高度(in)'] || 0) || null,
              carrier_billed_zone: row['计费区域'] || null,
              carrier_base_fee: Number(row['基础运费'] || 0),
              carrier_fuel_surcharge: Number(row['燃油附加费'] || 0),
              carrier_residential_fee: Number(row['住宅配送费'] || 0),
              carrier_remote_area_fee: Number(row['偏远地区费'] || 0),
              carrier_oversize_fee: Number(row['超大件费'] || 0),
              carrier_ahs_fee: Number(row['AHS费用'] || 0),
              carrier_peak_surcharge: Number(row['旺季附加费'] || 0),
              carrier_other_fees: Number(row['其他费用'] || 0),
              carrier_total_cost: carrierTotalCost,
              match_status: isMatched ? 'matched' : 'unmatched',
              order_id: orderData?.id || null,
              customer_id: orderData?.customer_id || null,
              customer_code: orderData?.customer_code || null,
              original_weight: originalWeight,
              original_length: originalLength,
              original_width: originalWidth,
              original_height: originalHeight,
              original_zone: originalZone,
              original_shipping_fee: originalShippingFee,
              difference_type: differenceTypes.length > 0 ? differenceTypes : null,
              weight_difference: weightDiff,
              zone_difference: zoneDiff,
              difference_amount: differenceAmount,
              status: 'pending'
            });
          }

          // Insert all difference records
          if (diffRecords.length > 0) {
            const { error: insertError } = await supabase
              .from('freight_differences')
              .insert(diffRecords);
            if (insertError) throw insertError;
          }

          // Update batch status
          await supabase
            .from('freight_difference_batches')
            .update({
              matched_count: matchedCount,
              unmatched_count: unmatchedCount,
              total_difference: totalDifference,
              status: 'completed'
            })
            .eq('id', batchId);

          toast.success(`导入成功！匹配 ${matchedCount} 条，未匹配 ${unmatchedCount} 条`);
          setImportDialogOpen(false);
          fetchData();
        } catch (error: any) {
          toast.error("处理文件失败: " + error.message);
        } finally {
          setImporting(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error("导入失败: " + error.message);
      setImporting(false);
    }
  };

  const exportUnmatched = () => {
    const unmatched = differences.filter(d => d.match_status === 'unmatched');
    if (unmatched.length === 0) {
      toast.error("没有未匹配的记录");
      return;
    }

    const exportData = unmatched.map(d => ({
      '追踪号': d.tracking_number,
      '承运商': d.carrier,
      '计费重量': d.carrier_billed_weight,
      '计费区域': d.carrier_billed_zone,
      '总费用': d.carrier_total_cost,
      '导入日期': d.import_date,
      '备注': '系统中未找到此追踪号'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "未匹配记录");
    XLSX.writeFile(wb, `未匹配运单_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`已导出 ${unmatched.length} 条未匹配记录`);
  };

  const exportFiltered = () => {
    const filtered = filteredDifferences;
    if (filtered.length === 0) {
      toast.error("没有数据可导出");
      return;
    }

    const exportData = filtered.map(d => ({
      '追踪号': d.tracking_number,
      '客户编码': d.customer_code || '-',
      '承运商': d.carrier,
      '匹配状态': d.match_status === 'matched' ? '已匹配' : '未匹配',
      '差异类型': (d.difference_type || []).join(', '),
      '原始重量': d.original_weight,
      '计费重量': d.carrier_billed_weight,
      '重量差异': d.weight_difference,
      '原始区域': d.original_zone,
      '计费区域': d.carrier_billed_zone,
      '区域变化': d.zone_difference || '-',
      '原始运费': d.original_shipping_fee,
      '承运商成本': d.carrier_total_cost,
      '差异金额': d.difference_amount,
      '状态': d.status,
      '导入日期': d.import_date
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "运费差异");
    XLSX.writeFile(wb, `运费差异_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`已导出 ${filtered.length} 条记录`);
  };

  // Filter logic
  const filteredDifferences = useMemo(() => {
    let result = differences;

    // Tab filter
    if (activeTab === 'matched') {
      result = result.filter(d => d.match_status === 'matched');
    } else if (activeTab === 'unmatched') {
      result = result.filter(d => d.match_status === 'unmatched');
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.tracking_number.toLowerCase().includes(term) ||
        (d.customer_code || '').toLowerCase().includes(term)
      );
    }

    // Customer filter
    if (filterCustomer !== 'all') {
      result = result.filter(d => d.customer_id === filterCustomer);
    }

    // Match status filter
    if (filterMatchStatus !== 'all') {
      result = result.filter(d => d.match_status === filterMatchStatus);
    }

    // Difference type filter
    if (filterDiffType !== 'all') {
      result = result.filter(d => 
        d.difference_type && d.difference_type.includes(filterDiffType)
      );
    }

    // Carrier filter
    if (filterCarrier !== 'all') {
      result = result.filter(d => d.carrier === filterCarrier);
    }

    // Batch filter
    if (filterBatch !== 'all') {
      result = result.filter(d => d.batch_id === filterBatch);
    }

    return result;
  }, [differences, activeTab, searchTerm, filterCustomer, filterMatchStatus, filterDiffType, filterCarrier, filterBatch]);

  // Stats
  const stats = useMemo(() => {
    const total = differences.length;
    const matched = differences.filter(d => d.match_status === 'matched').length;
    const unmatched = differences.filter(d => d.match_status === 'unmatched').length;
    const totalDiff = differences.reduce((sum, d) => sum + (d.difference_amount || 0), 0);
    return { total, matched, unmatched, totalDiff };
  }, [differences]);

  const uniqueCarriers = useMemo(() => {
    return [...new Set(differences.map(d => d.carrier))];
  }, [differences]);

  const getDifferenceTypeBadges = (types: string[] | null) => {
    if (!types || types.length === 0) return null;
    
    const typeLabels: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      'weight': { label: '重量', variant: 'destructive' },
      'dimension': { label: '尺寸', variant: 'destructive' },
      'zone': { label: '区域', variant: 'secondary' },
      'residential': { label: '住宅', variant: 'outline' },
      'remote': { label: '偏远', variant: 'outline' },
      'oversize': { label: '超大', variant: 'outline' },
      'ahs': { label: 'AHS', variant: 'outline' },
      'not_found': { label: '未找到', variant: 'destructive' }
    };

    return (
      <div className="flex flex-wrap gap-1">
        {types.map(type => {
          const config = typeLabels[type] || { label: type, variant: 'default' as const };
          return (
            <Badge key={type} variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          );
        })}
      </div>
    );
  };

  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">运费差异调整</h1>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">运费差异调整</h1>
          <p className="text-muted-foreground">导入承运商账单，自动匹配并计算差异</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            下载模板
          </Button>
          <Button variant="outline" onClick={exportUnmatched}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            导出未匹配
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                导入账单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>导入运费账单</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>请先下载模板，按模板格式填写后导入。系统将自动：</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>匹配追踪号对应的订单</li>
                    <li>检测重量、尺寸、区域差异</li>
                    <li>识别附加费触发情况</li>
                    <li>根据客户报价重新计算应收金额</li>
                  </ul>
                </div>
                <div>
                  <Label>承运商</Label>
                  <Select value={importCarrier} onValueChange={setImportCarrier}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>选择文件</Label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={importing}
                    className="mt-2"
                  />
                </div>
                {importing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    正在处理，请稍候...
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">已匹配</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未匹配</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unmatched}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总差异金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(stats.totalDiff).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div>
              <Label className="text-xs">搜索</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="追踪号/客户编码"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">客户</Label>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="全部客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部客户</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.customer_code} - {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">匹配状态</Label>
              <Select value={filterMatchStatus} onValueChange={setFilterMatchStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="matched">已匹配</SelectItem>
                  <SelectItem value="unmatched">未匹配</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">差异类型</Label>
              <Select value={filterDiffType} onValueChange={setFilterDiffType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="weight">重量差异</SelectItem>
                  <SelectItem value="dimension">尺寸差异</SelectItem>
                  <SelectItem value="zone">区域差异</SelectItem>
                  <SelectItem value="residential">住宅附加费</SelectItem>
                  <SelectItem value="remote">偏远地区费</SelectItem>
                  <SelectItem value="oversize">超大件费</SelectItem>
                  <SelectItem value="ahs">AHS费用</SelectItem>
                  <SelectItem value="not_found">未找到</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">承运商</Label>
              <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部承运商</SelectItem>
                  {uniqueCarriers.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">导入批次</Label>
              <Select value={filterBatch} onValueChange={setFilterBatch}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部批次</SelectItem>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batch_name || b.file_name || b.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              共 {filteredDifferences.length} 条记录
            </span>
            <Button variant="outline" size="sm" onClick={exportFiltered}>
              <Download className="h-4 w-4 mr-2" />
              导出筛选结果
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table with Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                全部 <Badge variant="secondary">{differences.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="matched" className="gap-2">
                已匹配 <Badge variant="secondary">{stats.matched}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unmatched" className="gap-2">
                未匹配 <Badge variant="destructive">{stats.unmatched}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>追踪号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>承运商</TableHead>
                  <TableHead>差异类型</TableHead>
                  <TableHead>重量差异</TableHead>
                  <TableHead>区域变化</TableHead>
                  <TableHead>原始运费</TableHead>
                  <TableHead>承运商成本</TableHead>
                  <TableHead>差异金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredDifferences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      暂无运费差异记录，请导入账单
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDifferences.map((diff) => (
                    <TableRow key={diff.id}>
                      <TableCell className="font-mono text-sm">{diff.tracking_number}</TableCell>
                      <TableCell>{diff.customer_code || '-'}</TableCell>
                      <TableCell>{diff.carrier}</TableCell>
                      <TableCell>{getDifferenceTypeBadges(diff.difference_type)}</TableCell>
                      <TableCell>
                        {diff.weight_difference ? (
                          <span className={diff.weight_difference > 0 ? 'text-red-600' : 'text-green-600'}>
                            {diff.weight_difference > 0 ? '+' : ''}{diff.weight_difference.toFixed(2)} lb
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {diff.zone_difference ? (
                          <Badge variant="outline">{diff.zone_difference}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>${diff.original_shipping_fee?.toFixed(2) || '-'}</TableCell>
                      <TableCell>${diff.carrier_total_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={diff.difference_amount >= 0 ? 'destructive' : 'default'}>
                          {diff.difference_amount >= 0 ? '+' : ''}${diff.difference_amount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          diff.match_status === 'matched' ? 'default' : 'destructive'
                        }>
                          {diff.match_status === 'matched' ? '已匹配' : '未匹配'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedDiff(diff);
                            setDetailDialogOpen(true);
                          }}
                        >
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>差异详情</DialogTitle>
          </DialogHeader>
          {selectedDiff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    订单信息
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">追踪号：</span>{selectedDiff.tracking_number}</p>
                    <p><span className="text-muted-foreground">客户编码：</span>{selectedDiff.customer_code || '未匹配'}</p>
                    <p><span className="text-muted-foreground">承运商：</span>{selectedDiff.carrier}</p>
                    <p><span className="text-muted-foreground">匹配状态：</span>
                      <Badge variant={selectedDiff.match_status === 'matched' ? 'default' : 'destructive'} className="ml-1">
                        {selectedDiff.match_status === 'matched' ? '已匹配' : '未匹配'}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    差异类型
                  </h4>
                  {getDifferenceTypeBadges(selectedDiff.difference_type)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    尺寸重量对比
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">项目</TableHead>
                        <TableHead className="text-xs">原始</TableHead>
                        <TableHead className="text-xs">账单</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">重量(lb)</TableCell>
                        <TableCell className="text-xs">{selectedDiff.original_weight || '-'}</TableCell>
                        <TableCell className="text-xs">{selectedDiff.carrier_billed_weight || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">长度(in)</TableCell>
                        <TableCell className="text-xs">{selectedDiff.original_length || '-'}</TableCell>
                        <TableCell className="text-xs">{selectedDiff.carrier_billed_length || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">宽度(in)</TableCell>
                        <TableCell className="text-xs">{selectedDiff.original_width || '-'}</TableCell>
                        <TableCell className="text-xs">{selectedDiff.carrier_billed_width || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">高度(in)</TableCell>
                        <TableCell className="text-xs">{selectedDiff.original_height || '-'}</TableCell>
                        <TableCell className="text-xs">{selectedDiff.carrier_billed_height || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    区域对比
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">原始区域：</span>{selectedDiff.original_zone || '-'}</p>
                    <p><span className="text-muted-foreground">账单区域：</span>{selectedDiff.carrier_billed_zone || '-'}</p>
                    {selectedDiff.zone_difference && (
                      <p className="text-red-600">
                        区域变化：{selectedDiff.zone_difference}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  费用明细
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">承运商账单费用：</p>
                    <p><span className="text-muted-foreground">基础运费：</span>${selectedDiff.carrier_base_fee.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">燃油附加费：</span>${selectedDiff.carrier_fuel_surcharge.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">住宅配送费：</span>${selectedDiff.carrier_residential_fee.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">偏远地区费：</span>${selectedDiff.carrier_remote_area_fee.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">超大件费：</span>${selectedDiff.carrier_oversize_fee.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">AHS费用：</span>${selectedDiff.carrier_ahs_fee.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">旺季附加费：</span>${selectedDiff.carrier_peak_surcharge.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">其他费用：</span>${selectedDiff.carrier_other_fees.toFixed(2)}</p>
                    <p className="font-medium border-t pt-1">总计：${selectedDiff.carrier_total_cost.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">原始收费：</p>
                    <p><span className="text-muted-foreground">原始运费：</span>${selectedDiff.original_shipping_fee?.toFixed(2) || '-'}</p>
                    <p className="font-medium border-t pt-1 mt-4">
                      差异金额：
                      <span className={selectedDiff.difference_amount >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {selectedDiff.difference_amount >= 0 ? '+' : ''}${selectedDiff.difference_amount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreightDifference;
