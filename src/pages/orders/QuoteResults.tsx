import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Package, Clock, Shield, Truck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface CarrierQuote {
  id: string;
  name: string;
  logo?: string;
  totalCost: number;
  transitTime: string;
  deliveryDate: string;
  rating: number;
  fees: {
    baseFee: number;
    fuelSurcharge: number;
    pickupFee: number;
    deliveryAppointmentFee: number;
    liftgateFee: number;
  };
  freeInsurance: number;
}

const QuoteResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.orderData;

  // 模拟报价数据
  const [quotes] = useState<CarrierQuote[]>([
    {
      id: "1",
      name: "快速物流",
      totalCost: 1250,
      transitTime: "2-3个工作日",
      deliveryDate: "2024-01-15",
      rating: 4.8,
      fees: {
        baseFee: 980,
        fuelSurcharge: 120,
        pickupFee: 50,
        deliveryAppointmentFee: 75,
        liftgateFee: 25
      },
      freeInsurance: 50000
    },
    {
      id: "2", 
      name: "可靠运输",
      totalCost: 1180,
      transitTime: "3-4个工作日",
      deliveryDate: "2024-01-16",
      rating: 4.6,
      fees: {
        baseFee: 920,
        fuelSurcharge: 110,
        pickupFee: 50,
        deliveryAppointmentFee: 75,
        liftgateFee: 25
      },
      freeInsurance: 40000
    },
    {
      id: "3",
      name: "经济货运",
      totalCost: 1080,
      transitTime: "4-5个工作日",
      deliveryDate: "2024-01-18",
      rating: 4.3,
      fees: {
        baseFee: 850,
        fuelSurcharge: 95,
        pickupFee: 45,
        deliveryAppointmentFee: 65,
        liftgateFee: 25
      },
      freeInsurance: 30000
    }
  ]);

  const distance = "875英里";
  const route = `${orderData?.pickupZip} → ${orderData?.deliveryZip}`;

  const handleSelectQuote = (quote: CarrierQuote) => {
    console.log("选择报价:", quote);
    // 导航到填写详细信息页面
    navigate("/dashboard/orders/details", { state: { quote } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard/orders/create")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">运输报价</h1>
          <p className="text-muted-foreground">为您找到了{quotes.length}个报价选项</p>
        </div>
      </div>

      {/* 路线信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            运输路线
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-lg font-medium">{route}</p>
              <p className="text-muted-foreground">总距离: {distance}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 托盘详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            托盘详情
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orderData?.pallets?.map((pallet: any, index: number) => (
              <div key={pallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">托盘 #{index + 1}</span>
                  <Badge variant="outline">数量: {pallet.count}</Badge>
                  <Badge variant="outline">重量: {pallet.weight}磅</Badge>
                  <Badge variant="outline">尺寸: {pallet.dimensions}</Badge>
                  <Badge variant="outline">等级: Class {pallet.class}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 承运商报价 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">承运商报价</h2>
        {quotes.map((quote) => (
          <Card key={quote.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{quote.name}</h3>
                    <p className="text-sm text-muted-foreground">评分: {quote.rating}/5.0</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${quote.totalCost}</p>
                  <p className="text-sm text-muted-foreground">总费用</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 运输时间信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">运输时间</p>
                    <p className="font-medium">{quote.transitTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">预计送达</p>
                    <p className="font-medium">{quote.deliveryDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">免费保额</p>
                    <p className="font-medium">${quote.freeInsurance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 费用详情 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">费用详情</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">基础费:</span>
                    <span>${quote.fees.baseFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">燃油费:</span>
                    <span>${quote.fees.fuelSurcharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">上门取件费:</span>
                    <span>${quote.fees.pickupFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">派送预约费:</span>
                    <span>${quote.fees.deliveryAppointmentFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">升降装置费:</span>
                    <span>${quote.fees.liftgateFee}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>总计:</span>
                    <span>${quote.totalCost}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSelectQuote(quote)}
                  className="bg-primary hover:bg-primary/90"
                >
                  选择此报价
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuoteResults;