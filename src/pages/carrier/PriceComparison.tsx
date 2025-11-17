import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PriceCalculator } from "@/lib/priceCalculator";
import { Calculator, TrendingDown, TrendingUp, Save } from "lucide-react";

export default function PriceComparison() {
  const { toast } = useToast();
  const [results, setResults] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [packageInfo, setPackageInfo] = useState({
    weight: 50,
    length: 20,
    width: 15,
    height: 10,
    zone: "3",
    addressType: "commercial" as "commercial" | "residential",
    serviceType: "ground",
  });

  const handleSaveHistory = async () => {
    if (results.length === 0) {
      toast({ title: "请先进行价格计算", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "请先登录", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("price_calculation_history").insert({
      user_id: user.id,
      calculation_type: "comparison",
      package_info: packageInfo,
      results: results,
      notes: notes || null,
    });
    if (error) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "保存成功" });
      setNotes("");
    }
  };

  const handleCalculate = () => {
    const mockAccounts = [
      {
        id: "1",
        name: "FedEx账号A",
        config: {
          base_prices: { "2": 15.50, "3": 18.00, "4": 22.00, "5": 25.00, "6": 28.00, "7": 32.00, "8": 35.00 },
          ahs_weight: { "2": 45, "3": 50, "4": 55, "5": 60, "6": 65, "7": 70, "8": 75 },
          ahs_dim: { "2": 40, "3": 45, "4": 50, "5": 55, "6": 60, "7": 65, "8": 70 },
          ahs_packing: { "2": 30, "3": 35, "4": 40, "5": 45, "6": 50, "7": 55, "8": 60 },
          oversize_commercial: { "2": 50, "3": 60, "4": 70, "5": 80, "6": 90, "7": 100, "8": 110 },
          oversize_residential: { "2": 70, "3": 80, "4": 90, "5": 100, "6": 110, "7": 120, "8": 130 },
          residential_fees: { ground: 5.50, home: 6.00 },
          remote_area_fees: {
            das: { ground: 4.50, home: 5.00 },
            extend: { ground: 7.50, home: 8.00 },
            remote: { ground: 12.00, home: 13.00 },
          },
          dim_factor: 139,
          fuel_charge: 15.5,
          unauthorized_fee: 3.50,
          peak_surcharges: {
            economy: 0.50,
            hd_ground: 1.00,
            ahs: 2.50,
            oversize: 3.00,
            unauthorized: 1.50,
            residential: 1.00,
          },
        },
      },
      {
        id: "2",
        name: "FedEx账号B",
        config: {
          base_prices: { "2": 14.00, "3": 16.50, "4": 20.00, "5": 23.00, "6": 26.00, "7": 30.00, "8": 33.00 },
          ahs_weight: { "2": 40, "3": 45, "4": 50, "5": 55, "6": 60, "7": 65, "8": 70 },
          ahs_dim: { "2": 35, "3": 40, "4": 45, "5": 50, "6": 55, "7": 60, "8": 65 },
          ahs_packing: { "2": 25, "3": 30, "4": 35, "5": 40, "6": 45, "7": 50, "8": 55 },
          oversize_commercial: { "2": 45, "3": 55, "4": 65, "5": 75, "6": 85, "7": 95, "8": 105 },
          oversize_residential: { "2": 65, "3": 75, "4": 85, "5": 95, "6": 105, "7": 115, "8": 125 },
          residential_fees: { ground: 5.00, home: 5.50 },
          remote_area_fees: {
            das: { ground: 4.00, home: 4.50 },
            extend: { ground: 7.00, home: 7.50 },
            remote: { ground: 11.00, home: 12.00 },
          },
          dim_factor: 139,
          fuel_charge: 14.8,
          unauthorized_fee: 3.00,
          peak_surcharges: {
            economy: 0.45,
            hd_ground: 0.95,
            ahs: 2.30,
            oversize: 2.80,
            unauthorized: 1.40,
            residential: 0.95,
          },
        },
      },
      {
        id: "official",
        name: "FedEx官方价",
        config: {
          base_prices: { "2": 18.00, "3": 21.00, "4": 25.00, "5": 29.00, "6": 33.00, "7": 38.00, "8": 42.00 },
          ahs_weight: { "2": 50, "3": 55, "4": 60, "5": 65, "6": 70, "7": 75, "8": 80 },
          ahs_dim: { "2": 45, "3": 50, "4": 55, "5": 60, "6": 65, "7": 70, "8": 75 },
          ahs_packing: { "2": 35, "3": 40, "4": 45, "5": 50, "6": 55, "7": 60, "8": 65 },
          oversize_commercial: { "2": 60, "3": 70, "4": 80, "5": 90, "6": 100, "7": 110, "8": 120 },
          oversize_residential: { "2": 80, "3": 90, "4": 100, "5": 110, "6": 120, "7": 130, "8": 140 },
          residential_fees: { ground: 6.00, home: 6.50 },
          remote_area_fees: {
            das: { ground: 5.00, home: 5.50 },
            extend: { ground: 8.50, home: 9.00 },
            remote: { ground: 13.50, home: 14.50 },
          },
          dim_factor: 139,
          fuel_charge: 16.0,
          unauthorized_fee: 4.00,
          peak_surcharges: {
            economy: 0.60,
            hd_ground: 1.10,
            ahs: 2.80,
            oversize: 3.30,
            unauthorized: 1.60,
            residential: 1.10,
          },
        },
      },
    ];
    const calculator = new PriceCalculator(mockAccounts[0].config);
    const comparisonResults = calculator.compareAccounts(packageInfo, mockAccounts);
    setResults(comparisonResults);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">价格比较</h1>
          <p className="text-muted-foreground">输入包裹信息，对比不同账号和官方价格</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCalculate}><Calculator className="h-4 w-4 mr-2" />计算价格</Button>
          {results.length > 0 && (<Button variant="outline" onClick={handleSaveHistory}><Save className="h-4 w-4 mr-2" />保存历史</Button>)}
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>包裹信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <div className="space-y-2"><Label>重量 (lbs)</Label><Input type="number" value={packageInfo.weight} onChange={(e) => setPackageInfo({ ...packageInfo, weight: parseFloat(e.target.value) })} /></div>
          <div className="space-y-2"><Label>长 (in)</Label><Input type="number" value={packageInfo.length} onChange={(e) => setPackageInfo({ ...packageInfo, length: parseFloat(e.target.value) })} /></div>
          <div className="space-y-2"><Label>宽 (in)</Label><Input type="number" value={packageInfo.width} onChange={(e) => setPackageInfo({ ...packageInfo, width: parseFloat(e.target.value) })} /></div>
          <div className="space-y-2"><Label>高 (in)</Label><Input type="number" value={packageInfo.height} onChange={(e) => setPackageInfo({ ...packageInfo, height: parseFloat(e.target.value) })} /></div>
          <div className="space-y-2"><Label>分区</Label><Select value={packageInfo.zone} onValueChange={(val) => setPackageInfo({ ...packageInfo, zone: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["2", "3", "4", "5", "6", "7", "8"].map((zone) => (<SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label>地址类型</Label><Select value={packageInfo.addressType} onValueChange={(val: any) => setPackageInfo({ ...packageInfo, addressType: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="commercial">商业地址</SelectItem><SelectItem value="residential">住宅地址</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>服务类型</Label><Select value={packageInfo.serviceType} onValueChange={(val) => setPackageInfo({ ...packageInfo, serviceType: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ground">Ground</SelectItem><SelectItem value="home">Home Delivery</SelectItem></SelectContent></Select></div>
        </CardContent>
      </Card>
      {results.length > 0 && (
        <>
          <Card><CardHeader><CardTitle>添加备注（可选）</CardTitle></CardHeader><CardContent><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="为这次计算添加备注，方便后续查找..." rows={3} /></CardContent></Card>
          <Card><CardHeader><CardTitle>价格对比结果</CardTitle></CardHeader><CardContent className="space-y-4">{results.map((result) => {const officialResult = results.find(r => r.accountName === "FedEx官方价");const diff = officialResult ? result.breakdown.total - officialResult.breakdown.total : 0;const diffPercent = officialResult ? ((diff / officialResult.breakdown.total) * 100).toFixed(1) : 0;return (<div key={result.accountId} className="border rounded-lg p-4 space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold text-lg">{result.accountName}</h3><div className="flex items-center gap-2"><span className="text-2xl font-bold">${result.breakdown.total.toFixed(2)}</span>{result.accountName !== "FedEx官方价" && (<Badge variant={diff < 0 ? "default" : "destructive"}>{diff > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}{diff > 0 ? '+' : ''}{diff.toFixed(2)} ({diffPercent}%)</Badge>)}</div></div><div className="grid grid-cols-2 gap-4 text-sm"><div className="space-y-1"><div className="flex justify-between"><span className="text-muted-foreground">基础价格：</span><span>${result.breakdown.basePrice.toFixed(2)}</span></div>{result.breakdown.ahsWeight > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">AHS-Weight：</span><span>${result.breakdown.ahsWeight.toFixed(2)}</span></div>)}{result.breakdown.ahsDim > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">AHS-Dim：</span><span>${result.breakdown.ahsDim.toFixed(2)}</span></div>)}{result.breakdown.oversizeCharge > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">Oversize：</span><span>${result.breakdown.oversizeCharge.toFixed(2)}</span></div>)}</div><div className="space-y-1">{result.breakdown.residentialFee > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">住宅费用：</span><span>${result.breakdown.residentialFee.toFixed(2)}</span></div>)}<div className="flex justify-between"><span className="text-muted-foreground">燃油附加费：</span><span>${result.breakdown.fuelCharge.toFixed(2)}</span></div>{result.breakdown.peakSurcharge > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">旺季附加费：</span><span>${result.breakdown.peakSurcharge.toFixed(2)}</span></div>)}</div></div>{result.breakdown.triggers.length > 0 && (<div className="flex gap-2 flex-wrap">{result.breakdown.triggers.map((trigger: string, idx: number) => (<Badge key={idx} variant="outline">{trigger}</Badge>))}</div>)}</div>);})}</CardContent></Card>
        </>
      )}
    </div>
  );
}
