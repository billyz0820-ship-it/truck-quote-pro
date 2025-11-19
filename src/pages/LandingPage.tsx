import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Truck, MapPin, Calculator, Users, Phone, Mail, Clock, Shield, User, TrendingUp, 
  Package, Box, Zap, Target, ArrowRight, CheckCircle2, FileSearch, CreditCard, 
  Printer, MapPinned, RefreshCw, Users2, HeartHandshake, Lightbulb, Globe, Star 
} from "lucide-react";
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
            <a href="#about" className="text-foreground hover:text-primary transition-colors">关于我们</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">联系我们</a>
          </nav>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate("/login")}>登录</Button>
            <Button onClick={() => navigate("/register")}>注册</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="物流运输" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
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
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleQuoteRequest}>
                立即获取报价
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Quick Quote Form */}
            <Card className="bg-background/95 backdrop-blur animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl">快速报价</CardTitle>
                <CardDescription>选择服务类型并填写信息获取报价</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>服务类型</Label>
                  <RadioGroup value={serviceType} onValueChange={(value) => setServiceType(value as "truck" | "express")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="truck" id="truck" />
                      <Label htmlFor="truck" className="cursor-pointer">卡车整车运输</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="cursor-pointer">快递配送</Label>
                    </div>
                  </RadioGroup>
                </div>

                {serviceType === "truck" ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <Label>提货地址</Label>
                      <Input 
                        placeholder="例如：纽约，NY" 
                        value={truckFormData.pickup}
                        onChange={(e) => handleTruckInputChange('pickup', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>送货地址</Label>
                      <Input 
                        placeholder="例如：洛杉矶，CA" 
                        value={truckFormData.delivery}
                        onChange={(e) => handleTruckInputChange('delivery', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>货物描述</Label>
                      <Input 
                        placeholder="简要描述货物类型" 
                        value={truckFormData.cargo}
                        onChange={(e) => handleTruckInputChange('cargo', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>托盘数</Label>
                        <Input 
                          type="number" 
                          placeholder="例如：10" 
                          value={truckFormData.pallets}
                          onChange={(e) => handleTruckInputChange('pallets', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>重量（磅）</Label>
                        <Input 
                          type="number" 
                          placeholder="例如：5000" 
                          value={truckFormData.weight}
                          onChange={(e) => handleTruckInputChange('weight', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>寄件邮编</Label>
                        <Input 
                          placeholder="例如：10001" 
                          value={expressFormData.senderZip}
                          onChange={(e) => handleExpressInputChange('senderZip', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>收件邮编</Label>
                        <Input 
                          placeholder="例如：90001" 
                          value={expressFormData.receiverZip}
                          onChange={(e) => handleExpressInputChange('receiverZip', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>包裹尺寸（英寸）</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input 
                          placeholder="长" 
                          value={expressFormData.length}
                          onChange={(e) => handleExpressInputChange('length', e.target.value)}
                        />
                        <Input 
                          placeholder="宽" 
                          value={expressFormData.width}
                          onChange={(e) => handleExpressInputChange('width', e.target.value)}
                        />
                        <Input 
                          placeholder="高" 
                          value={expressFormData.height}
                          onChange={(e) => handleExpressInputChange('height', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>包裹重量（磅）</Label>
                      <Input 
                        type="number" 
                        placeholder="例如：5" 
                        value={expressFormData.weight}
                        onChange={(e) => handleExpressInputChange('weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>服务类型</Label>
                      <RadioGroup 
                        value={expressFormData.serviceLevel} 
                        onValueChange={(value) => handleExpressInputChange('serviceLevel', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ground" id="ground" />
                          <Label htmlFor="ground" className="cursor-pointer">地面运输（经济）</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="2day" id="2day" />
                          <Label htmlFor="2day" className="cursor-pointer">2日达</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="overnight" id="overnight" />
                          <Label htmlFor="overnight" className="cursor-pointer">隔日达</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg" onClick={handleQuoteRequest}>
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
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">我们的服务</h2>
            <p className="text-muted-foreground">双重业务，全面保障您的物流需求</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Truck Service */}
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in">
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
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>适合大批量货物运输</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>专车运输，更安全可靠</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>价格透明，多家比价</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>全程GPS跟踪定位</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Express Service */}
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in">
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

          {/* Service Process */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-12">服务流程</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSearch className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-primary mb-2">第一步</div>
                  <CardTitle className="text-lg">查询与比较</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    输入运输信息，获取实时报价和时效预估，多家承运商一键比价
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-primary mb-2">第二步</div>
                  <CardTitle className="text-lg">选择与下单</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    选择最适合您的服务方案，一键创建运单，确认订单信息
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Printer className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-primary mb-2">第三步</div>
                  <CardTitle className="text-lg">打印与发货</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    在线打印运输标签，生成面单，安排提货或送货上门
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinned className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-primary mb-2">第四步</div>
                  <CardTitle className="text-lg">追踪与管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    实时追踪所有包裹状态，统一管理运输记录和财务账单
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Enhanced */}
      <section id="features" className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择我们</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
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

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>全口径比价</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  无需在多个承运商网站间反复切换，一次查询即可获得FedEx、UPS、USPS及主流卡车公司的全口径报价
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>批量折扣优惠</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  我们凭借聚合的货量与各大承运商达成了协议价格，您即使发货量不大，也能享受大客户的折扣优惠
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Users2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>统一账户管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  一个账户管理所有运输需求。统一的账单、统一的地址簿、统一的包裹追踪界面，极大提升物流管理效率
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>智能推荐</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  系统会根据您的货物信息（尺寸、目的地、时效要求）智能推荐最合适的服务，帮您做出最优决策
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <HeartHandshake className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>专业中文客服</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  我们提供专业的中文客服团队，随时解答您在运输过程中遇到的任何问题，处理异常情况
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>API集成</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  为有技术能力的电商卖家、ERP系统提供API接口，实现批量打单、自动同步物流信息
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>快速响应</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  卡车30秒获取多家报价，快递即时下单打印标签，7×24小时客服支持，随时为您服务
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>可靠安全</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  合作承运商均经过严格筛选，全程保险保障，GPS实时跟踪，确保货物安全送达
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">数据说话</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">200+</div>
                <div className="text-muted-foreground">合作卡车公司</div>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-accent mb-2">6+</div>
                <div className="text-muted-foreground">主流快递渠道</div>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">5000+</div>
                <div className="text-muted-foreground">服务客户数</div>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-all hover:scale-105">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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

      {/* Partners */}
      <section id="partners" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">合作伙伴</h2>

          <div className="space-y-16">
            {/* Truck Partners */}
            <div>
              <h3 className="text-2xl font-bold text-center mb-4">卡车运输合作伙伴</h3>
              <p className="text-center text-muted-foreground mb-12">与北美领先的卡车公司深度合作</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {["XPO Logistics", "J.B. Hunt", "Knight Transportation", "Schneider", "Old Dominion", "YRC Freight", 
                  "Estes Express", "ABF Freight", "R+L Carriers", "Saia", "TForce Freight", "Holland"].map((partner) => (
                  <Card key={partner} className="text-center hover:shadow-lg transition-all hover:scale-105">
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
              <h3 className="text-2xl font-bold text-center mb-4">快递服务合作伙伴</h3>
              <p className="text-center text-muted-foreground mb-12">对接主流快递公司，享受批量折扣</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {["FedEx", "UPS", "USPS", "Amazon Shipping", "OnTrac", "DHL"].map((partner) => (
                  <Card key={partner} className="text-center hover:shadow-lg transition-all hover:scale-105">
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
        </div>
      </section>

      {/* Agency Partners Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">合作代理</h2>
          <p className="text-center text-muted-foreground mb-12">欢迎其他公司代理我们的业务，共创共赢</p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
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
            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
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
            <Card className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
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

          {/* Partnership Process */}
          <div>
            <h3 className="text-2xl font-bold text-center mb-12">合作流程</h3>
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">提交申请</h4>
                  <p className="text-sm text-muted-foreground">填写代理申请表</p>
                </div>

                <ArrowRight className="hidden md:block text-muted-foreground" />

                <div className="flex-1 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">资质审核</h4>
                  <p className="text-sm text-muted-foreground">审核企业资质</p>
                </div>

                <ArrowRight className="hidden md:block text-muted-foreground" />

                <div className="flex-1 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">签订协议</h4>
                  <p className="text-sm text-muted-foreground">签署合作协议</p>
                </div>

                <ArrowRight className="hidden md:block text-muted-foreground" />

                <div className="flex-1 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">接受培训</h4>
                  <p className="text-sm text-muted-foreground">系统和业务培训</p>
                </div>

                <ArrowRight className="hidden md:block text-muted-foreground" />

                <div className="flex-1 text-center hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-accent">5</span>
                  </div>
                  <h4 className="font-semibold mb-2">开始业务</h4>
                  <p className="text-sm text-muted-foreground">正式开展业务</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">关于我们</h2>

          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">我们的故事</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  我们是一支深耕北美跨境物流多年的专业团队，见证了无数跨境电商从零起步到蓬勃发展的历程。在服务客户的过程中，我们深刻理解物流成本和效率对企业发展的重要性。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  为了帮助更多企业降低物流成本、提升运营效率，我们整合了北美数百家卡车公司和主流快递渠道资源，搭建了这个综合物流服务平台。通过技术创新和资源整合，我们让客户能够享受到原本只有大企业才能获得的优质服务和优惠价格。
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">我们的团队</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  我们是一支充满活力的90后团队，平均年龄28岁，拥有物流、技术、客服等多元化背景。年轻不代表不专业，恰恰相反，我们以更开放的思维、更敏锐的市场洞察力和更强的执行力，为客户提供超越期待的服务。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  我们相信技术的力量，持续投入研发，用自动化和智能化提升服务效率；我们重视客户体验，7×24小时在线，用专业和热情解决每一个问题；我们追求长期价值，与客户共同成长，实现互利共赢。
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">90后</div>
                    <p className="text-sm text-muted-foreground">年轻团队</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-accent mb-2">5年+</div>
                    <p className="text-sm text-muted-foreground">行业经验</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">100%</div>
                    <p className="text-sm text-muted-foreground">客户满意度</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">联系我们</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
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
                  <span>info@logistics-platform.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>123 Main Street, New York, NY 10001</span>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>留言咨询</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">姓名</Label>
                    <Input id="name" placeholder="请输入您的姓名" />
                  </div>
                  <div>
                    <Label htmlFor="email">邮箱</Label>
                    <Input id="email" type="email" placeholder="请输入您的邮箱" />
                  </div>
                  <div>
                    <Label htmlFor="message">留言</Label>
                    <Textarea id="message" placeholder="请输入您的留言" rows={4} />
                  </div>
                  <Button className="w-full">提交</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">&copy; 2024 北美综合物流平台. All rights reserved.</p>
          <p className="text-sm text-primary-foreground/80">专业 · 可靠 · 高效</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
