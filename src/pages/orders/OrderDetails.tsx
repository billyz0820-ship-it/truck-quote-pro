import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, User, Phone, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const OrderDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const quote = location.state?.quote;

  const [pickupDetails, setPickupDetails] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: ""
  });

  const [deliveryDetails, setDeliveryDetails] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: ""
  });

  const handlePickupChange = (field: string, value: string) => {
    setPickupDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryChange = (field: string, value: string) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      quote,
      pickupDetails,
      deliveryDetails
    };
    console.log("订单详情:", orderData);
    // 这里可以提交订单或导航到确认页面
    navigate("/dashboard/orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">填写详细信息</h1>
          <p className="text-muted-foreground">完善收发货地址和联系信息</p>
        </div>
      </div>

      {/* 选中的报价摘要 */}
      {quote && (
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{quote.name}</h3>
                <p className="text-sm text-muted-foreground">运输时间: {quote.transitTime}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">${quote.totalCost}</p>
                <p className="text-sm text-muted-foreground">总费用</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 发货地址详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              发货地址详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pickupAddress">详细地址</Label>
                <Input
                  id="pickupAddress"
                  placeholder="街道地址"
                  value={pickupDetails.address}
                  onChange={(e) => handlePickupChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupCity">城市</Label>
                <Input
                  id="pickupCity"
                  placeholder="城市"
                  value={pickupDetails.city}
                  onChange={(e) => handlePickupChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupState">州</Label>
                <Input
                  id="pickupState"
                  placeholder="州"
                  value={pickupDetails.state}
                  onChange={(e) => handlePickupChange("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupZip">邮编</Label>
                <Input
                  id="pickupZip"
                  placeholder="邮编"
                  value={pickupDetails.zip}
                  onChange={(e) => handlePickupChange("zip", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                发货联系人
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupContactName">联系人姓名</Label>
                  <Input
                    id="pickupContactName"
                    placeholder="姓名"
                    value={pickupDetails.contactName}
                    onChange={(e) => handlePickupChange("contactName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupContactPhone">联系电话</Label>
                  <Input
                    id="pickupContactPhone"
                    placeholder="电话"
                    value={pickupDetails.contactPhone}
                    onChange={(e) => handlePickupChange("contactPhone", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupContactEmail">电子邮箱</Label>
                  <Input
                    id="pickupContactEmail"
                    type="email"
                    placeholder="邮箱"
                    value={pickupDetails.contactEmail}
                    onChange={(e) => handlePickupChange("contactEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupNotes">备注（可选）</Label>
              <Textarea
                id="pickupNotes"
                placeholder="特殊要求或备注"
                value={pickupDetails.notes}
                onChange={(e) => handlePickupChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 收货地址详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              收货地址详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryAddress">详细地址</Label>
                <Input
                  id="deliveryAddress"
                  placeholder="街道地址"
                  value={deliveryDetails.address}
                  onChange={(e) => handleDeliveryChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">城市</Label>
                <Input
                  id="deliveryCity"
                  placeholder="城市"
                  value={deliveryDetails.city}
                  onChange={(e) => handleDeliveryChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">州</Label>
                <Input
                  id="deliveryState"
                  placeholder="州"
                  value={deliveryDetails.state}
                  onChange={(e) => handleDeliveryChange("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">邮编</Label>
                <Input
                  id="deliveryZip"
                  placeholder="邮编"
                  value={deliveryDetails.zip}
                  onChange={(e) => handleDeliveryChange("zip", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                收货联系人
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryContactName">联系人姓名</Label>
                  <Input
                    id="deliveryContactName"
                    placeholder="姓名"
                    value={deliveryDetails.contactName}
                    onChange={(e) => handleDeliveryChange("contactName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryContactPhone">联系电话</Label>
                  <Input
                    id="deliveryContactPhone"
                    placeholder="电话"
                    value={deliveryDetails.contactPhone}
                    onChange={(e) => handleDeliveryChange("contactPhone", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryContactEmail">电子邮箱</Label>
                  <Input
                    id="deliveryContactEmail"
                    type="email"
                    placeholder="邮箱"
                    value={deliveryDetails.contactEmail}
                    onChange={(e) => handleDeliveryChange("contactEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">备注（可选）</Label>
              <Textarea
                id="deliveryNotes"
                placeholder="特殊要求或备注"
                value={deliveryDetails.notes}
                onChange={(e) => handleDeliveryChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            确认并提交订单
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderDetails;
