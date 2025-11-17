import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator } from "lucide-react";

export default function PriceComparison() {
  const [formData, setFormData] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
    originZip: "",
    destZip: "",
  });

  const handleCalculate = () => {
    // 计算价格逻辑
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>重量 (lbs)</Label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div>
              <Label>起始邮编</Label>
              <Input
                value={formData.originZip}
                onChange={(e) => setFormData({ ...formData, originZip: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>长度 (in)</Label>
              <Input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              />
            </div>
            <div>
              <Label>宽度 (in)</Label>
              <Input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              />
            </div>
            <div>
              <Label>高度 (in)</Label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>目的地邮编</Label>
            <Input
              value={formData.destZip}
              onChange={(e) => setFormData({ ...formData, destZip: e.target.value })}
            />
          </div>
          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            计算价格
          </Button>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账号名称</TableHead>
              <TableHead>基础费用</TableHead>
              <TableHead>附加费用</TableHead>
              <TableHead>燃油费</TableHead>
              <TableHead>总计</TableHead>
              <TableHead>官方价</TableHead>
              <TableHead>差异</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                请输入包裹信息并计算
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
