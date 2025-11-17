import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, TrendingDown, TrendingUp } from "lucide-react";
import { PriceCalculator } from "@/lib/priceCalculator";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PriceComparison() {
  const [formData, setFormData] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
    originZip: "",
    destZip: "",
    zone: "2",
    addressType: "commercial" as "commercial" | "residential",
    serviceType: "ground",
  });

  const [calculations, setCalculations] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    // 模拟多个账号的价格计算
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
          fuel_charge: 14.5,
          unauthorized_fee: 3.00,
          peak_surcharges: {
            economy: 0.40,
            hd_ground: 0.90,
            ahs: 2.00,
            oversize: 2.50,
            unauthorized: 1.20,
            residential: 0.90,
          },
        },
      },
      {
        id: "official",
        name: "FedEx官方价",
        config: {
          base_prices: { "2": 18.00, "3": 21.00, "4": 25.00, "5": 29.00, "6": 33.00, "7": 38.00, "8": 42.00 },
          ahs_weight: { "2": 60, "3": 65, "4": 70, "5": 75, "6": 80, "7": 85, "8": 90 },
          ahs_dim: { "2": 55, "3": 60, "4": 65, "5": 70, "6": 75, "7": 80, "8": 85 },
          ahs_packing: { "2": 45, "3": 50, "4": 55, "5": 60, "6": 65, "7": 70, "8": 75 },
          oversize_commercial: { "2": 70, "3": 80, "4": 90, "5": 100, "6": 110, "7": 120, "8": 130 },
          oversize_residential: { "2": 90, "3": 100, "4": 110, "5": 120, "6": 130, "7": 140, "8": 150 },
          residential_fees: { ground: 6.50, home: 7.00 },
          remote_area_fees: {
            das: { ground: 5.50, home: 6.00 },
            extend: { ground: 9.00, home: 9.50 },
            remote: { ground: 15.00, home: 16.00 },
          },
          dim_factor: 139,
          fuel_charge: 17.5,
          unauthorized_fee: 4.50,
          peak_surcharges: {
            economy: 0.75,
            hd_ground: 1.50,
            ahs: 3.50,
            oversize: 4.00,
            unauthorized: 2.00,
            residential: 1.50,
          },
        },
      },
    ];

    const packageInfo = {
      weight: parseFloat(formData.weight) || 0,
      length: parseFloat(formData.length) || 0,
      width: parseFloat(formData.width) || 0,
      height: parseFloat(formData.height) || 0,
      zone: formData.zone,
      addressType: formData.addressType,
      serviceType: formData.serviceType,
    };

    const results = mockAccounts.map(account => {
      const calculator = new PriceCalculator(account.config);
      return {
        accountName: account.name,
        breakdown: calculator.calculate(packageInfo),
      };
    });

    setCalculations(results);
    setShowResults(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">价格比较</h1>
        <p className="text-muted-foreground mt-1">比较不同账号和官方价格</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>包裹信息</CardTitle>
          <CardDescription>输入包裹信息进行价格比较</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>重量 (lbs) *</Label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>长度 (in) *</Label>
              <Input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>宽度 (in) *</Label>
              <Input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>高度 (in) *</Label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>起始邮编</Label>
              <Input
                value={formData.originZip}
                onChange={(e) => setFormData({ ...formData, originZip: e.target.value })}
              />
            </div>
            <div>
              <Label>目的地邮编</Label>
              <Input
                value={formData.destZip}
                onChange={(e) => setFormData({ ...formData, destZip: e.target.value })}
              />
            </div>
            <div>
              <Label>分区 *</Label>
              <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2", "3", "4", "5", "6", "7", "8"].map(zone => (
                    <SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>地址类型 *</Label>
              <Select value={formData.addressType} onValueChange={(value: any) => setFormData({ ...formData, addressType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">商业</SelectItem>
                  <SelectItem value="residential">住宅</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            计算价格
          </Button>
        </CardContent>
      </Card>

      {showResults && calculations.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>价格对比结果</CardTitle>
              <CardDescription>各账号费用明细对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>账号名称</TableHead>
                      <TableHead>基础费用</TableHead>
                      <TableHead>AHS费用</TableHead>
                      <TableHead>超大件</TableHead>
                      <TableHead>住宅费</TableHead>
                      <TableHead>偏远地址</TableHead>
                      <TableHead>小计</TableHead>
                      <TableHead>燃油费</TableHead>
                      <TableHead>旺季费</TableHead>
                      <TableHead className="font-bold">总计</TableHead>
                      <TableHead>差异</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc, index) => {
                      const officialPrice = calculations.find(c => c.accountName === "FedEx官方价")?.breakdown.total || 0;
                      const diff = calc.breakdown.total - officialPrice;
                      const diffPercent = officialPrice > 0 ? ((diff / officialPrice) * 100).toFixed(1) : "0";
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{calc.accountName}</TableCell>
                          <TableCell>${calc.breakdown.basePrice.toFixed(2)}</TableCell>
                          <TableCell>
                            ${(calc.breakdown.ahsWeight + calc.breakdown.ahsDim + calc.breakdown.ahsPacking).toFixed(2)}
                          </TableCell>
                          <TableCell>${calc.breakdown.oversizeCharge.toFixed(2)}</TableCell>
                          <TableCell>${calc.breakdown.residentialFee.toFixed(2)}</TableCell>
                          <TableCell>${calc.breakdown.remoteAreaFee.toFixed(2)}</TableCell>
                          <TableCell>${calc.breakdown.subtotal.toFixed(2)}</TableCell>
                          <TableCell>${calc.breakdown.fuelCharge.toFixed(2)}</TableCell>
                          <TableCell>${calc.breakdown.peakSurcharge.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-lg">${calc.breakdown.total.toFixed(2)}</TableCell>
                          <TableCell>
                            {calc.accountName !== "FedEx官方价" && (
                              <div className="flex items-center gap-1">
                                {diff < 0 ? (
                                  <>
                                    <TrendingDown className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                      ${Math.abs(diff).toFixed(2)} ({diffPercent}%)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="h-4 w-4 text-red-600" />
                                    <span className="text-red-600 font-medium">
                                      +${diff.toFixed(2)} (+{diffPercent}%)
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculations.map((calc, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{calc.accountName}</CardTitle>
                  <CardDescription>费用明细</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>基础费用:</span>
                    <span className="font-medium">${calc.breakdown.basePrice.toFixed(2)}</span>
                  </div>
                  {calc.breakdown.ahsWeight > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>AHS-Weight:</span>
                      <span className="font-medium">${calc.breakdown.ahsWeight.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.breakdown.ahsDim > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>AHS-Dim:</span>
                      <span className="font-medium">${calc.breakdown.ahsDim.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.breakdown.oversizeCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>超大件:</span>
                      <span className="font-medium">${calc.breakdown.oversizeCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.breakdown.residentialFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>住宅费:</span>
                      <span className="font-medium">${calc.breakdown.residentialFee.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>小计:</span>
                    <span className="font-medium">${calc.breakdown.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>燃油费:</span>
                    <span className="font-medium">${calc.breakdown.fuelCharge.toFixed(2)}</span>
                  </div>
                  {calc.breakdown.peakSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>旺季费:</span>
                      <span className="font-medium">${calc.breakdown.peakSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>总计:</span>
                    <span>${calc.breakdown.total.toFixed(2)}</span>
                  </div>
                  {calc.breakdown.triggers.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">触发规则:</div>
                        <div className="flex flex-wrap gap-1">
                          {calc.breakdown.triggers.map((trigger, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
