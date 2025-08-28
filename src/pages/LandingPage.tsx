import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, MapPin, Calculator, Users, Phone, Mail, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-truck.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup: "",
    delivery: "",
    cargo: "",
    pallets: "",
    weight: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuoteRequest = () => {
    // 这里会跳转到登录页面或者报价页面
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">北美卡车经纪</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">首页</a>
            <a href="#partners" className="text-foreground hover:text-primary transition-colors">合作代理</a>
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
          <img src={heroImage} alt="卡车运输" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                北美最专业的<br />
                <span className="text-accent">卡车经纪平台</span>
              </h1>
              <p className="text-xl mb-8 text-primary-foreground/90">
                与北美数百家卡车公司合作，一键获取最优报价，
                让您的货物运输更高效、更经济。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90">
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
                  填写货物信息，即可获得所有合作卡车公司的报价
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup">提货地址</Label>
                    <Input 
                      id="pickup"
                      placeholder="输入提货城市"
                      value={formData.pickup}
                      onChange={(e) => handleInputChange("pickup", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery">送货地址</Label>
                    <Input 
                      id="delivery"
                      placeholder="输入送货城市"
                      value={formData.delivery}
                      onChange={(e) => handleInputChange("delivery", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cargo">货物描述</Label>
                  <Textarea 
                    id="cargo"
                    placeholder="描述您的货物类型"
                    value={formData.cargo}
                    onChange={(e) => handleInputChange("cargo", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pallets">托盘数量</Label>
                    <Input 
                      id="pallets"
                      placeholder="托盘数"
                      value={formData.pallets}
                      onChange={(e) => handleInputChange("pallets", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">重量 (磅)</Label>
                    <Input 
                      id="weight"
                      placeholder="总重量"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={handleQuoteRequest}>
                  获取报价
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>可靠安全</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  所有合作的卡车公司都经过严格筛选，确保货物运输安全可靠
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
                  一键获取多家报价，30秒内得到回复，节省您的宝贵时间
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>最优价格</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  比较多家报价，为您找到最经济实惠的运输方案
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">合作代理</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {["XPO Logistics", "J.B. Hunt", "Knight Transportation", "Schneider"].map((partner) => (
              <Card key={partner} className="text-center hover:shadow-medium transition-shadow">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">{partner}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    北美知名运输公司，提供可靠的货运服务
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-secondary/50">
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
                  <span>contact@truckbroker.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>123 Transport St, Logistics City, TX 12345</span>
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
            <Truck className="h-6 w-6" />
            <span className="text-xl font-bold">北美卡车经纪</span>
          </div>
          <p className="text-primary-foreground/80">
            © 2024 北美卡车经纪平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;