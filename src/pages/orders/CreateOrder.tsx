import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Package, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupAddress: "",
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    pickupContact: "",
    pickupPhone: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryContact: "",
    deliveryPhone: "",
    cargoType: "",
    weight: "",
    dimensions: "",
    pallets: "",
    specialRequirements: "",
    preferredDate: "",
    urgency: "standard"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里处理订单提交逻辑
    console.log("订单数据:", formData);
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
        {/* 发货信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              发货信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">发货地址</Label>
                <Input
                  id="pickupAddress"
                  placeholder="详细地址"
                  value={formData.pickupAddress}
                  onChange={(e) => handleInputChange("pickupAddress", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupContact">联系人</Label>
                <Input
                  id="pickupContact"
                  placeholder="联系人姓名"
                  value={formData.pickupContact}
                  onChange={(e) => handleInputChange("pickupContact", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupCity">城市</Label>
                <Input
                  id="pickupCity"
                  placeholder="城市"
                  value={formData.pickupCity}
                  onChange={(e) => handleInputChange("pickupCity", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupState">州/省</Label>
                <Input
                  id="pickupState"
                  placeholder="州/省"
                  value={formData.pickupState}
                  onChange={(e) => handleInputChange("pickupState", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupZip">邮编</Label>
                <Input
                  id="pickupZip"
                  placeholder="邮编"
                  value={formData.pickupZip}
                  onChange={(e) => handleInputChange("pickupZip", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupPhone">联系电话</Label>
              <Input
                id="pickupPhone"
                placeholder="联系电话"
                value={formData.pickupPhone}
                onChange={(e) => handleInputChange("pickupPhone", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 收货信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary" />
              收货信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">收货地址</Label>
                <Input
                  id="deliveryAddress"
                  placeholder="详细地址"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange("deliveryAddress", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryContact">联系人</Label>
                <Input
                  id="deliveryContact"
                  placeholder="联系人姓名"
                  value={formData.deliveryContact}
                  onChange={(e) => handleInputChange("deliveryContact", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">城市</Label>
                <Input
                  id="deliveryCity"
                  placeholder="城市"
                  value={formData.deliveryCity}
                  onChange={(e) => handleInputChange("deliveryCity", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">州/省</Label>
                <Input
                  id="deliveryState"
                  placeholder="州/省"
                  value={formData.deliveryState}
                  onChange={(e) => handleInputChange("deliveryState", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">邮编</Label>
                <Input
                  id="deliveryZip"
                  placeholder="邮编"
                  value={formData.deliveryZip}
                  onChange={(e) => handleInputChange("deliveryZip", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryPhone">联系电话</Label>
              <Input
                id="deliveryPhone"
                placeholder="联系电话"
                value={formData.deliveryPhone}
                onChange={(e) => handleInputChange("deliveryPhone", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 货物信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              货物信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargoType">货物类型</Label>
                <Select value={formData.cargoType} onValueChange={(value) => handleInputChange("cargoType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择货物类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">电子产品</SelectItem>
                    <SelectItem value="clothing">服装</SelectItem>
                    <SelectItem value="furniture">家具</SelectItem>
                    <SelectItem value="machinery">机械设备</SelectItem>
                    <SelectItem value="food">食品</SelectItem>
                    <SelectItem value="chemicals">化工产品</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">重量 (磅)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="总重量"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dimensions">尺寸 (长x宽x高, 英寸)</Label>
                <Input
                  id="dimensions"
                  placeholder="例: 48x40x42"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange("dimensions", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pallets">托盘数量</Label>
                <Input
                  id="pallets"
                  type="number"
                  placeholder="托盘数量"
                  value={formData.pallets}
                  onChange={(e) => handleInputChange("pallets", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">特殊要求</Label>
              <Textarea
                id="specialRequirements"
                placeholder="例: 冷藏运输、易碎物品、危险品等"
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 运输要求 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-warning" />
              运输要求
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">期望提货日期</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">紧急程度</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">标准 (5-7天)</SelectItem>
                    <SelectItem value="expedited">加急 (2-4天)</SelectItem>
                    <SelectItem value="emergency">紧急 (24-48小时)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

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