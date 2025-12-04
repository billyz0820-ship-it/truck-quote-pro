import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Truck, Package, Zap, ArrowRight, Activity, TrendingUp, 
  Globe, Shield, Clock, Users, BarChart3, LineChart, Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
};

// Animated bar chart component
const AnimatedBarChart = () => {
  const bars = [65, 85, 45, 92, 78, 88, 95];
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-end justify-between h-32 gap-2">
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-1000 ease-out"
          style={{
            height: isVisible ? `${height}%` : '0%',
            background: `linear-gradient(180deg, hsl(var(--glow-cyan)), hsl(var(--glow-cyan) / 0.3))`,
            boxShadow: '0 0 10px hsl(var(--glow-cyan) / 0.5)',
            transitionDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
};

// Animated line chart component
const AnimatedLineChart = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const points = "0,80 40,60 80,70 120,40 160,50 200,30 240,35 280,15";
  
  return (
    <div ref={ref} className="relative h-24 w-full">
      <svg className="w-full h-full" viewBox="0 0 280 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--glow-magenta))" />
            <stop offset="100%" stopColor="hsl(var(--glow-cyan))" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--glow-cyan) / 0.3)" />
            <stop offset="100%" stopColor="hsl(var(--glow-cyan) / 0)" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 280,100`}
          fill="url(#areaGradient)"
          className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        />
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--glow-cyan)))'
          }}
        />
      </svg>
    </div>
  );
};

// Flow diagram component
const FlowDiagram = () => {
  return (
    <div className="relative h-20 flex items-center justify-between">
      {['仓库', '分拣', '运输', '配送'].map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-secondary border border-glow-cyan/30 flex items-center justify-center glow-cyan">
              {i === 0 && <Box className="w-5 h-5 text-glow-cyan" />}
              {i === 1 && <Activity className="w-5 h-5 text-glow-cyan" />}
              {i === 2 && <Truck className="w-5 h-5 text-glow-cyan" />}
              {i === 3 && <Package className="w-5 h-5 text-glow-cyan" />}
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">{label}</span>
          </div>
          {i < 3 && (
            <div className="w-12 h-0.5 mx-2 relative overflow-hidden bg-border">
              <div className="absolute inset-0 data-flow" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<"truck" | "express">("truck");
  const [scrollY, setScrollY] = useState(0);
  const [truckFormData, setTruckFormData] = useState({
    pickup: "",
    delivery: "",
    pallets: "",
    weight: ""
  });
  const [expressFormData, setExpressFormData] = useState({
    senderZip: "",
    receiverZip: "",
    weight: ""
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTruckInputChange = (field: string, value: string) => {
    setTruckFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpressInputChange = (field: string, value: string) => {
    setExpressFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuoteRequest = () => navigate("/login");

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-32 bg-gradient-to-b from-glow-cyan/5 via-glow-cyan/10 to-transparent animate-scan-line" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Truck className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30" />
            </div>
            <span className="text-xl font-bold text-foreground">
              <span className="text-glow-cyan">北美</span>综合物流
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            {['首页', '服务', '数据', '合作', '关于'].map((item) => (
              <a 
                key={item}
                href={`#${item}`} 
                className="text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="border-glow-cyan/50 text-glow-cyan hover:bg-glow-cyan/10 hover:border-glow-cyan"
              onClick={() => navigate("/login")}
            >
              登录
            </Button>
            <Button 
              className="bg-gradient-to-r from-glow-cyan to-glow-magenta text-background font-semibold hover:opacity-90"
              onClick={() => navigate("/register")}
            >
              注册
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Parallax */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Parallax background layers */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        
        {/* Floating elements */}
        <div 
          className="absolute top-40 left-20 w-32 h-32 rounded-full bg-glow-cyan/10 blur-3xl animate-float"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute top-60 right-40 w-48 h-48 rounded-full bg-glow-magenta/10 blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div 
          className="absolute bottom-40 left-1/3 w-40 h-40 rounded-full bg-glow-yellow/10 blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-glow-cyan/30 bg-glow-cyan/5">
                <span className="w-2 h-2 rounded-full bg-glow-cyan animate-pulse" />
                <span className="text-sm text-glow-cyan">实时数据驱动</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-foreground">北美领先的</span>
                <br />
                <span className="text-glow-cyan text-glow-cyan">智能物流</span>
                <br />
                <span className="text-glow-magenta text-glow-magenta">控制中心</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                整合卡车运输与快递配送，AI驱动的智能调度系统，
                <span className="text-glow-cyan">实时追踪</span>、
                <span className="text-glow-magenta">精准报价</span>、
                <span className="text-glow-yellow">高效配送</span>
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-glow-cyan to-glow-magenta text-background font-bold px-8 hover:opacity-90 glow-cyan"
                  onClick={handleQuoteRequest}
                >
                  立即体验
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-glow-cyan/50 text-glow-cyan hover:bg-glow-cyan/10"
                >
                  观看演示
                </Button>
              </div>
            </div>

            {/* Right - Quote Form */}
            <div 
              className="relative"
              style={{ transform: `translateY(${scrollY * -0.1}px)` }}
            >
              <Card className="cyber-card backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-glow-cyan/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-glow-cyan" />
                    </div>
                    <CardTitle className="text-xl">智能报价系统</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">服务类型</Label>
                    <RadioGroup value={serviceType} onValueChange={(value) => setServiceType(value as "truck" | "express")}>
                      <div className="grid grid-cols-2 gap-3">
                        <label 
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            serviceType === 'truck' 
                              ? 'border-glow-cyan bg-glow-cyan/10 text-glow-cyan' 
                              : 'border-border hover:border-glow-cyan/50'
                          }`}
                        >
                          <RadioGroupItem value="truck" className="sr-only" />
                          <Truck className="w-4 h-4" />
                          <span>卡车运输</span>
                        </label>
                        <label 
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            serviceType === 'express' 
                              ? 'border-glow-magenta bg-glow-magenta/10 text-glow-magenta' 
                              : 'border-border hover:border-glow-magenta/50'
                          }`}
                        >
                          <RadioGroupItem value="express" className="sr-only" />
                          <Package className="w-4 h-4" />
                          <span>快递配送</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {serviceType === "truck" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">提货地</Label>
                          <Input 
                            placeholder="城市/州" 
                            className="bg-secondary/50 border-border focus:border-glow-cyan"
                            value={truckFormData.pickup}
                            onChange={(e) => handleTruckInputChange('pickup', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">送货地</Label>
                          <Input 
                            placeholder="城市/州" 
                            className="bg-secondary/50 border-border focus:border-glow-cyan"
                            value={truckFormData.delivery}
                            onChange={(e) => handleTruckInputChange('delivery', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">托盘数</Label>
                          <Input 
                            type="number" 
                            placeholder="数量" 
                            className="bg-secondary/50 border-border focus:border-glow-cyan"
                            value={truckFormData.pallets}
                            onChange={(e) => handleTruckInputChange('pallets', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">重量(lbs)</Label>
                          <Input 
                            type="number" 
                            placeholder="磅" 
                            className="bg-secondary/50 border-border focus:border-glow-cyan"
                            value={truckFormData.weight}
                            onChange={(e) => handleTruckInputChange('weight', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">寄件邮编</Label>
                          <Input 
                            placeholder="ZIP" 
                            className="bg-secondary/50 border-border focus:border-glow-magenta"
                            value={expressFormData.senderZip}
                            onChange={(e) => handleExpressInputChange('senderZip', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">收件邮编</Label>
                          <Input 
                            placeholder="ZIP" 
                            className="bg-secondary/50 border-border focus:border-glow-magenta"
                            value={expressFormData.receiverZip}
                            onChange={(e) => handleExpressInputChange('receiverZip', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">包裹重量(lbs)</Label>
                        <Input 
                          type="number" 
                          placeholder="磅" 
                          className="bg-secondary/50 border-border focus:border-glow-magenta"
                          value={expressFormData.weight}
                          onChange={(e) => handleExpressInputChange('weight', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    className={`w-full font-bold ${
                      serviceType === 'truck' 
                        ? 'bg-gradient-to-r from-glow-cyan to-primary glow-cyan' 
                        : 'bg-gradient-to-r from-glow-magenta to-accent glow-magenta'
                    } text-background`}
                    onClick={handleQuoteRequest}
                  >
                    获取实时报价
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-glow-cyan/20 rounded-lg -z-10" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 border border-glow-magenta/20 rounded-lg -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="text-glow-cyan text-glow-cyan">实时</span>数据仪表盘
            </h2>
            <p className="text-muted-foreground">数据驱动的智能物流决策</p>
          </div>

          {/* Dashboard-style stats grid */}
          <div className="grid lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: '日处理订单', value: 15847, suffix: '+', icon: Package, color: 'cyan' },
              { label: '合作承运商', value: 500, suffix: '+', icon: Truck, color: 'magenta' },
              { label: '准时率', value: 99.2, suffix: '%', icon: Clock, color: 'yellow' },
              { label: '客户满意度', value: 98.5, suffix: '%', icon: Users, color: 'green' },
            ].map((stat, i) => (
              <Card key={i} className="cyber-card overflow-hidden group hover:scale-105 transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      stat.color === 'cyan' ? 'bg-glow-cyan/10 text-glow-cyan' :
                      stat.color === 'magenta' ? 'bg-glow-magenta/10 text-glow-magenta' :
                      stat.color === 'yellow' ? 'bg-glow-yellow/10 text-glow-yellow' :
                      'bg-glow-green/10 text-glow-green'
                    }`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      stat.color === 'cyan' ? 'bg-glow-cyan' :
                      stat.color === 'magenta' ? 'bg-glow-magenta' :
                      stat.color === 'yellow' ? 'bg-glow-yellow' :
                      'bg-glow-green'
                    }`} />
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${
                    stat.color === 'cyan' ? 'text-glow-cyan' :
                    stat.color === 'magenta' ? 'text-glow-magenta' :
                    stat.color === 'yellow' ? 'text-glow-yellow' :
                    'text-glow-green'
                  }`}>
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="cyber-card lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-glow-cyan" />
                    周订单趋势
                  </CardTitle>
                  <span className="text-xs text-glow-cyan px-2 py-1 bg-glow-cyan/10 rounded">+12.5%</span>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatedBarChart />
                <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                  {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-glow-magenta" />
                  配送效率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatedLineChart />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">平均时效</span>
                    <span className="text-glow-cyan">2.3天</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">最快配送</span>
                    <span className="text-glow-magenta">4小时</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              双核<span className="text-glow-magenta text-glow-magenta">驱动</span>服务
            </h2>
            <p className="text-muted-foreground">整车运输 + 快递配送，一站式物流解决方案</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Truck Service */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-glow-cyan/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <Card className="cyber-card h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-glow-cyan/5 rounded-full blur-3xl" />
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl bg-glow-cyan/10 flex items-center justify-center mb-4 glow-cyan">
                    <Truck className="w-8 h-8 text-glow-cyan" />
                  </div>
                  <CardTitle className="text-2xl">
                    卡车运输 <span className="text-glow-cyan">FTL/LTL</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    整合北美500+卡车公司资源，AI智能调度，实时追踪，价格透明
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['整车运输', '零担配送', '平台仓专送', '特种运输'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-glow-cyan" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Express Service */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-glow-magenta/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <Card className="cyber-card h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-glow-magenta/5 rounded-full blur-3xl" />
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl bg-glow-magenta/10 flex items-center justify-center mb-4 glow-magenta">
                    <Package className="w-8 h-8 text-glow-magenta" />
                  </div>
                  <CardTitle className="text-2xl">
                    快递配送 <span className="text-glow-magenta">Parcel</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    整合FedEx、UPS、USPS等主流快递，批量折扣价格，一键比价下单
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['多渠道比价', '自动打单', '批量处理', '实时追踪'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-glow-magenta" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="mt-16">
            <Card className="cyber-card p-8">
              <h3 className="text-xl font-bold mb-8 text-center">智能物流流程</h3>
              <FlowDiagram />
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              为什么选择<span className="text-glow-yellow text-glow-yellow">我们</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: '全美覆盖', desc: '覆盖美国50州及加拿大主要城市', color: 'cyan' },
              { icon: Shield, title: '安全保障', desc: '全程保险，货损无忧', color: 'magenta' },
              { icon: TrendingUp, title: '价格优势', desc: '批量采购，比官方价格低30%+', color: 'yellow' },
              { icon: Clock, title: '准时交付', desc: '99.2%准时率，延误赔付', color: 'green' },
              { icon: Activity, title: '实时追踪', desc: 'GPS定位，全程可视化', color: 'cyan' },
              { icon: Users, title: '专属客服', desc: '7x24小时中英文客服支持', color: 'magenta' },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="cyber-card group hover:scale-105 transition-transform cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all ${
                    feature.color === 'cyan' ? 'bg-glow-cyan/10 text-glow-cyan group-hover:glow-cyan' :
                    feature.color === 'magenta' ? 'bg-glow-magenta/10 text-glow-magenta group-hover:glow-magenta' :
                    feature.color === 'yellow' ? 'bg-glow-yellow/10 text-glow-yellow group-hover:glow-yellow' :
                    'bg-glow-green/10 text-glow-green group-hover:glow-green'
                  }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-glow-cyan/20 via-glow-magenta/20 to-glow-cyan/20 rounded-full blur-3xl animate-glow-pulse" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Card className="cyber-card p-12 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              开启<span className="text-glow-cyan text-glow-cyan">智能物流</span>新时代
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              立即注册，享受首单优惠，体验数据驱动的现代物流服务
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-glow-cyan to-glow-magenta text-background font-bold px-12 glow-cyan hover:opacity-90"
                onClick={() => navigate("/register")}
              >
                免费注册
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-glow-cyan/50 text-glow-cyan hover:bg-glow-cyan/10 px-12"
                onClick={() => navigate("/login")}
              >
                登录系统
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-6 h-6 text-glow-cyan" />
                <span className="font-bold">北美综合物流</span>
              </div>
              <p className="text-sm text-muted-foreground">
                数据驱动的智能物流平台，让物流更简单、更高效
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">服务</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>卡车运输</li>
                <li>快递配送</li>
                <li>仓储服务</li>
                <li>报关清关</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>帮助中心</li>
                <li>API文档</li>
                <li>服务条款</li>
                <li>隐私政策</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@logistics.com</li>
                <li>+1 (888) 888-8888</li>
                <li>周一至周日 24小时</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2024 北美综合物流平台. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
