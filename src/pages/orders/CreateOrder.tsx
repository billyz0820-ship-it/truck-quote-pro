import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Pallet {
  id: string;
  count: number;
  weight: number;
  dimensions: string;
  class: string;
}

const CreateOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupZip: "",
    deliveryZip: "",
  });
  
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: "1", count: 1, weight: 0, dimensions: "", class: "" }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPallet = () => {
    const newPallet: Pallet = {
      id: Date.now().toString(),
      count: 1,
      weight: 0,
      dimensions: "",
      class: ""
    };
    setPallets(prev => [...prev, newPallet]);
  };

  const removePallet = (id: string) => {
    setPallets(prev => prev.filter(pallet => pallet.id !== id));
  };

  const updatePallet = (id: string, field: keyof Pallet, value: string | number) => {
    setPallets(prev => prev.map(pallet => 
      pallet.id === id ? { ...pallet, [field]: value } : pallet
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      pallets
    };
    console.log("订单数据:", orderData);
    navigate("/dashboard/orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/orders")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">创建新订单</h1>
          <p className="text-muted-foreground">输入运输详情获取实时报价</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 运输路线 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              运输路线
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupZip">发货邮编</Label>
                <Input
                  id="pickupZip"
                  placeholder="发货邮编"
                  value={formData.pickupZip}
                  onChange={(e) => handleInputChange("pickupZip", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">收货邮编</Label>
                <Input
                  id="deliveryZip"
                  placeholder="收货邮编"
                  value={formData.deliveryZip}
                  onChange={(e) => handleInputChange("deliveryZip", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 托盘信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                托盘信息
              </div>
              <Button type="button" onClick={addPallet} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加托盘
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pallets.map((pallet, index) => (
              <div key={pallet.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">托盘 #{index + 1}</h4>
                  {pallets.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePallet(pallet.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>托盘数量</Label>
                    <Input
                      type="number"
                      placeholder="数量"
                      value={pallet.count}
                      onChange={(e) => updatePallet(pallet.id, "count", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>重量 (磅)</Label>
                    <Input
                      type="number"
                      placeholder="重量"
                      value={pallet.weight}
                      onChange={(e) => updatePallet(pallet.id, "weight", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>尺寸 (长x宽x高)</Label>
                    <Input
                      placeholder="例: 48x40x42"
                      value={pallet.dimensions}
                      onChange={(e) => updatePallet(pallet.id, "dimensions", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>货物等级</Label>
                    <Select 
                      value={pallet.class} 
                      onValueChange={(value) => updatePallet(pallet.id, "class", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">Class 50</SelectItem>
                        <SelectItem value="55">Class 55</SelectItem>
                        <SelectItem value="60">Class 60</SelectItem>
                        <SelectItem value="65">Class 65</SelectItem>
                        <SelectItem value="70">Class 70</SelectItem>
                        <SelectItem value="77.5">Class 77.5</SelectItem>
                        <SelectItem value="85">Class 85</SelectItem>
                        <SelectItem value="92.5">Class 92.5</SelectItem>
                        <SelectItem value="100">Class 100</SelectItem>
                        <SelectItem value="110">Class 110</SelectItem>
                        <SelectItem value="125">Class 125</SelectItem>
                        <SelectItem value="150">Class 150</SelectItem>
                        <SelectItem value="175">Class 175</SelectItem>
                        <SelectItem value="200">Class 200</SelectItem>
                        <SelectItem value="250">Class 250</SelectItem>
                        <SelectItem value="300">Class 300</SelectItem>
                        <SelectItem value="400">Class 400</SelectItem>
                        <SelectItem value="500">Class 500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/dashboard/orders")}
          >
            取消
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            获取报价并下单
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;