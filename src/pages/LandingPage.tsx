import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, MapPin, Calculator, Users, Phone, Mail, Clock, Shield, User, TrendingUp, Package, Box, Zap, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-truck.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<"truck" | "express">("truck");
  const [truckFormData, setTruckFormData] = useState({
    pickup: "",
    delivery: "",
    cargo: "",
    pallets: "",
    weight: ""
  });
  const [expressFormData, setExpressFormData] = useState({
    senderZip: "",
    receiverZip: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    serviceLevel: "ground"
  });

  const handleTruckInputChange = (field: string, value: string) => {
    setTruckFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpressInputChange = (field: string, value: string) => {
    setExpressFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuoteRequest = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-primary" />
              <Package className="h-6 w-6 text-accent -ml-2" />
            </div>
            <span className="text-2xl font-bold text-primary">北美综合物流平台</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">首页</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors">服务介绍</a>
            <a href="#features" className="text-foreground hover:text-primary transition-colors">服务优势</a>
            <a href="#partners" className="text-foreground hover:text-primary transition-colors">合作伙伴</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">联系我们</a>
          </nav>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate("/login")}>登录</Button>
            <Button onClick={() => navigate("/register")}>注册</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0">
          <img src={heroImage} alt="物流运输" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                北美领先的<br />
                <span className="text-accent">综合物流服务平台</span>
              </h1>
              <p className="text-xl mb-4 text-primary-foreground/90">
                提供卡车整车运输 + 快递配送服务
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-accent" />
                  <span className="text-lg">整车运输：与数百家卡车公司合作，覆盖全美</span>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-accent" />
                  <span className="text-lg">快递服务：对接FedEx、UPS、USPS等主流快递，价格优惠</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleQuoteRequest}>
                  立即获取报价
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  了解更多
                </Button>
              </div>
            </div>
            
            {/* Quote Form */}
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  快速报价
                </CardTitle>
                <CardDescription>
                  选择服务类型，填写信息获取报价
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Type Selection */}
                <div className="space-y-3">
                  <Label>服务类型</Label>
                  <RadioGroup value={serviceType} onValueChange={(value) => setServiceType(value as "truck" | "express")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="truck" id="truck" />
                      <Label htmlFor="truck" className="cursor-pointer flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        卡车整车运输
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="cursor-pointer flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        快递配送
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Truck Form */}
                {serviceType === "truck" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pickup">提货地址</Label>
                        <Input 
                          id="pickup"
                          placeholder="输入提货城市"
                          value={truckFormData.pickup}
                          onChange={(e) => handleTruckInputChange("pickup", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery">送货地址</Label>
                        <Input 
                          id="delivery"
                          placeholder="输入送货城市"
                          value={truckFormData.delivery}
                          onChange={(e) => handleTruckInputChange("delivery", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cargo">货物描述</Label>
                      <Textarea 
                        id="cargo"
                        placeholder="描述您的货物类型"
                        value={truckFormData.cargo}
                        onChange={(e) => handleTruckInputChange("cargo", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pallets">托盘数量</Label>
                        <Input 
                          id="pallets"
                          placeholder="托盘数"
                          value={truckFormData.pallets}
                          onChange={(e) => handleTruckInputChange("pallets", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">重量 (磅)</Label>
                        <Input 
                          id="weight"
                          placeholder="总重量"
                          value={truckFormData.weight}
                          onChange={(e) => handleTruckInputChange("weight", e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Express Form */}
                {serviceType === "express" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="senderZip">寄件地邮编</Label>
                        <Input 
                          id="senderZip"
                          placeholder="邮编"
                          value={expressFormData.senderZip}
                          onChange={(e) => handleExpressInputChange("senderZip", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="receiverZip">收件地邮编</Label>
                        <Input 
                          id="receiverZip"
                          placeholder="邮编"
                          value={expressFormData.receiverZip}
                          onChange={(e) => handleExpressInputChange("receiverZip", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="length">长 (英寸)</Label>
                        <Input 
                          id="length"
                          placeholder="长度"
                          value={expressFormData.length}
                          onChange={(e) => handleExpressInputChange("length", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="width">宽 (英寸)</Label>
                        <Input 
                          id="width"
                          placeholder="宽度"
                          value={expressFormData.width}
                          onChange={(e) => handleExpressInputChange("width", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">高 (英寸)</Label>
                        <Input 
                          id="height"
                          placeholder="高度"
                          value={expressFormData.height}
                          onChange={(e) => handleExpressInputChange("height", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expressWeight">重量 (磅)</Label>
                      <Input 
                        id="expressWeight"
                        placeholder="包裹重量"
                        value={expressFormData.weight}
                        onChange={(e) => handleExpressInputChange("weight", e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={handleQuoteRequest}>
                  获取报价
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Introduction */}
      <section id="services" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">我们的服务</h2>
          <p className="text-center text-muted-foreground mb-12">双重业务，全面保障您的物流需求</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Truck Service */}
            <Card className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">整车运输 (FTL)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  与北美数百家卡车公司合作，提供整车、零担、特种货物运输服务，覆盖全美及加拿大
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span>适合大批量货物运输</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>专车运输更安全可靠</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span>价格透明，多家比较</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>全程GPS跟踪监控</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Express Service */}
            <Card className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-accent" />
                </div>
                <CardTitle className="text-2xl">快递配送 (Parcel)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  整合FedEx、UPS、USPS、Amazon Shipping等主流快递渠道，享受批量折扣价格
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Box className="h-4 w-4 text-accent" />
                    <span>小包裹配送首选</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-accent" />
                    <span>多渠道比价，价格优惠30%+</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-accent" />
                    <span>自动打单，快速发货</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>实时跟踪物流状态</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择我们</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>一站式服务</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  无论是整车运输还是小包裹配送，在一个平台解决所有物流需求，简化您的物流管理
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>价格透明优惠</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  卡车多家报价对比，快递享受批量折扣，帮您节省30%以上运费成本
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>快速响应</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  卡车30秒获取多家报价，快递即时下单打印标签，7×24小时客服支持
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>可靠安全</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  合作承运商均经过严格筛选，全程保险保障，GPS实时跟踪，安全可靠
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">平台数据</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">200+</div>
                <div className="text-muted-foreground">合作卡车公司</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-accent mb-2">6+</div>
                <div className="text-muted-foreground">主流快递渠道</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">5000+</div>
                <div className="text-muted-foreground">服务客户数</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-accent mb-2">50000+</div>
                <div className="text-muted-foreground">月发货量</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">客户评价</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">张总</CardTitle>
                    <p className="text-sm text-muted-foreground">某电商公司</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "我们同时使用卡车和快递服务，一个平台就能管理所有物流，非常方便。卡车运输纽约到洛杉矶只需3天，快递享受批量折扣，节省成本20%！"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">李经理</CardTitle>
                    <p className="text-sm text-muted-foreground">某跨境电商</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "使用平台快递服务后，月发货5000单，运费降低35%。自动打单功能节省了大量时间，客服响应也很及时！"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">王女士</CardTitle>
                    <p className="text-sm text-muted-foreground">某制造业公司</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  "专业的团队，可靠的服务。大批量货物用卡车，小件用快递，都能实时追踪。供应链管理更加顺畅，强烈推荐！"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Carrier Partners Section */}
      <section id="partners" className="py-16">
        <div className="container mx-auto px-4">
          {/* Truck Partners */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-4">卡车运输合作伙伴</h2>
            <p className="text-center text-muted-foreground mb-12">与北美顶级承运商建立长期合作关系</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {["XPO Logistics", "J.B. Hunt", "Knight Transportation", "Schneider", "Old Dominion", "YRC Freight", "Estes Express", "ABF Freight", "R+L Carriers", "Saia", "TForce Freight", "Holland"].map((partner) => (
                <Card key={partner} className="text-center hover:shadow-medium transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Truck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-sm">{partner}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Express Partners */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-4">快递服务合作伙伴</h2>
            <p className="text-center text-muted-foreground mb-12">对接主流快递公司，享受批量折扣</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {["FedEx", "UPS", "USPS", "Amazon Shipping", "OnTrac", "DHL"].map((partner) => (
                <Card key={partner} className="text-center hover:shadow-medium transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Package className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-sm">{partner}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agency Partners Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">合作代理</h2>
          <p className="text-center text-muted-foreground mb-12">欢迎其他公司代理我们的业务，共创共赢</p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>丰厚佣金</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  提供行业领先的佣金比例，每笔订单都有可观收益，月结算，按时支付
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>完善支持</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  提供专业培训、营销物料、技术支持，帮助代理商快速开展业务
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>长期合作</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  建立长期战略合作关系，共同发展北美物流市场，实现互利共赢
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">联系我们</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>contact@logistics-platform.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>123 Logistics Ave, Transport City, TX 12345</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>发送消息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="您的姓名" />
                <Input placeholder="您的邮箱" />
                <Textarea placeholder="您的消息" rows={4} />
                <Button className="w-full">发送消息</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center">
              <Truck className="h-6 w-6" />
              <Package className="h-5 w-5 -ml-1" />
            </div>
            <span className="text-xl font-bold">北美综合物流平台</span>
          </div>
          <p className="text-primary-foreground/80">
            © 2024 北美综合物流服务平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;