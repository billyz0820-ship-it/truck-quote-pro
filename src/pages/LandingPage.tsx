import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Package, TrendingUp, Shield, Clock, Globe, ChevronRight, BarChart3, PieChart, MapPin, ArrowUpRight, Calculator, Users, Award, Headphones, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// 动态计数器组件
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

// 简约折线图组件
const SimpleLineChart = () => {
  const points = [20, 35, 25, 45, 30, 55, 40, 65, 50, 70];
  const maxVal = Math.max(...points);
  const width = 280;
  const height = 100;
  
  const pathData = points.map((val, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - (val / maxVal) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#lineGradient)"
      />
      <path
        d={pathData}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
      <circle cx={width} cy={height - (points[points.length - 1] / maxVal) * height} r="4" fill="hsl(var(--primary))" />
    </svg>
  );
};

// 简约饼图组件
const SimplePieChart = () => {
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <circle 
          cx="50" cy="50" r="40" fill="none" 
          stroke="hsl(var(--primary))" strokeWidth="12"
          strokeDasharray="175 251"
        />
        <circle 
          cx="50" cy="50" r="40" fill="none" 
          stroke="hsl(var(--primary) / 0.5)" strokeWidth="12"
          strokeDasharray="50 251"
          strokeDashoffset="-175"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">$540</span>
        <span className="text-xs text-muted-foreground">总支出(万)</span>
      </div>
    </div>
  );
};

// 仪表盘模拟组件
const DashboardMockup = () => {
  return (
    <div className="relative bg-card rounded-2xl shadow-xl border border-border p-6 max-w-lg">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">总订单</span>
            <TrendingUp className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-lg font-bold text-foreground">8,256</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">运输中</span>
            <Truck className="w-3 h-3 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">1,428</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">已送达</span>
            <Package className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-lg font-bold text-foreground">6,828</p>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">运单趋势</span>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <SimpleLineChart />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>周一</span>
            <span>周日</span>
          </div>
        </div>
        <div className="col-span-2 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">费用分析</span>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex justify-center">
            <SimplePieChart />
          </div>
        </div>
      </div>
      
      {/* 物流追踪示意 */}
      <div className="mt-4 bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">实时追踪</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-primary to-primary/70 rounded-full" />
          </div>
          <span className="text-xs text-muted-foreground">75%</span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>海外仓</span>
          <span>FBA</span>
        </div>
      </div>
    </div>
  );
};

// 运费测算组件
const FreightCalculator = () => {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<"truck" | "express">("truck");
  const [formData, setFormData] = useState({
    originZip: "",
    destZip: "",
    weight: "",
    pallets: "",
  });

  const handleCalculate = () => {
    if (!formData.originZip || !formData.destZip) {
      toast.error("请填写起始和目的地邮编");
      return;
    }
    if (serviceType === "truck" && !formData.pallets) {
      toast.error("请填写托盘数量");
      return;
    }
    if (serviceType === "express" && !formData.weight) {
      toast.error("请填写包裹重量");
      return;
    }
    // 跳转到注册页面引导用户注册
    navigate('/register');
    toast.info("注册后即可获取精准运费报价");
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">运费测算</h3>
          <p className="text-sm text-muted-foreground">快速获取运费报价</p>
        </div>
      </div>

      <RadioGroup 
        value={serviceType} 
        onValueChange={(v) => setServiceType(v as "truck" | "express")}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <div className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${serviceType === "truck" ? "border-primary bg-primary/5" : "border-border"}`}>
          <RadioGroupItem value="truck" id="truck" className="absolute top-3 right-3" />
          <Label htmlFor="truck" className="cursor-pointer">
            <Truck className="w-6 h-6 text-primary mb-2" />
            <p className="font-semibold text-foreground">卡车运输</p>
            <p className="text-xs text-muted-foreground">FTL / LTL</p>
          </Label>
        </div>
        <div className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${serviceType === "express" ? "border-primary bg-primary/5" : "border-border"}`}>
          <RadioGroupItem value="express" id="express" className="absolute top-3 right-3" />
          <Label htmlFor="express" className="cursor-pointer">
            <Package className="w-6 h-6 text-primary mb-2" />
            <p className="font-semibold text-foreground">快递服务</p>
            <p className="text-xs text-muted-foreground">FedEx / UPS / USPS</p>
          </Label>
        </div>
      </RadioGroup>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">起始邮编</Label>
            <Input 
              placeholder="如：90001" 
              value={formData.originZip}
              onChange={(e) => setFormData({...formData, originZip: e.target.value})}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">目的邮编</Label>
            <Input 
              placeholder="如：10001" 
              value={formData.destZip}
              onChange={(e) => setFormData({...formData, destZip: e.target.value})}
            />
          </div>
        </div>
        
        {serviceType === "truck" ? (
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">托盘数量</Label>
            <Input 
              type="number"
              placeholder="请输入托盘数量" 
              value={formData.pallets}
              onChange={(e) => setFormData({...formData, pallets: e.target.value})}
            />
          </div>
        ) : (
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">包裹重量 (lbs)</Label>
            <Input 
              type="number"
              placeholder="请输入重量" 
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
            />
          </div>
        )}

        <Button onClick={handleCalculate} className="w-full">
          立即测算
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "成本优化",
      description: "智能比价，自动选择最优物流方案，平均节省15%物流成本",
    },
    {
      icon: Shield,
      title: "安全保障",
      description: "货物保险全覆盖，全程实时追踪，安心托运无忧",
    },
    {
      icon: Clock,
      title: "时效保证",
      description: "准时送达率99%+，严格把控时效，承诺必达",
    },
    {
      icon: Globe,
      title: "全境覆盖",
      description: "北美全境配送网络，跨境物流一站式解决方案",
    },
  ];

  const partners = [
    "FedEx", "UPS", "USPS", "XPO Logistics", "Old Dominion", "Saia"
  ];

  const processSteps = [
    {
      step: "01",
      title: "在线下单",
      description: "填写收发货信息，系统自动匹配最优物流方案",
    },
    {
      step: "02",
      title: "智能报价",
      description: "多承运商实时比价，透明价格一目了然",
    },
    {
      step: "03",
      title: "确认支付",
      description: "选择心仪方案，安全便捷支付",
    },
    {
      step: "04",
      title: "全程追踪",
      description: "实时物流状态更新，货物动态尽在掌握",
    },
  ];

  const whyChooseUs = [
    {
      icon: Award,
      title: "专业团队",
      description: "10年+跨境物流经验，深耕北美市场",
    },
    {
      icon: Users,
      title: "优质服务",
      description: "200+企业客户信赖，口碑见证实力",
    },
    {
      icon: TrendingUp,
      title: "价格优势",
      description: "与主流承运商深度合作，享受批量折扣",
    },
    {
      icon: Headphones,
      title: "售后无忧",
      description: "7x24小时客服支持，问题快速响应",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">智运物流</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">运费测算</a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">核心功能</a>
              <a href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">服务流程</a>
              <a href="#why-us" className="text-sm text-muted-foreground hover:text-foreground transition-colors">为什么选择我们</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">关于我们</a>
            </nav>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-muted-foreground">
                登录
              </Button>
              <Button onClick={() => navigate('/register')}>
                免费试用
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左侧内容 */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  北美跨境物流
                  <br />
                  <span className="text-primary">一站式智能管理平台</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  专注卡车运输与快递服务，为跨境卖家提供高效、低成本的物流解决方案
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="px-8"
                >
                  立即免费试用
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  运费测算
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
            
            {/* 右侧仪表盘模拟 */}
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* 合作伙伴 */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-6">合作物流伙伴</p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {partners.map((partner) => (
              <div key={partner} className="text-lg font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={200} suffix="+" />
              </p>
              <p className="text-muted-foreground">服务客户</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={100000} suffix="+" />
              </p>
              <p className="text-muted-foreground">年运单量</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                99.5%
              </p>
              <p className="text-muted-foreground">准时送达率</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={15} suffix="%" />
              </p>
              <p className="text-muted-foreground">平均节省成本</p>
            </div>
          </div>
        </div>
      </section>

      {/* 运费测算区块 */}
      <section id="calculator" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">快速获取运费报价</h2>
              <p className="text-muted-foreground">
                选择卡车或快递服务，填写基本信息，即可获取多家承运商的实时报价。注册后可享受更多优惠。
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">多承运商比价</p>
                    <p className="text-sm text-muted-foreground">同时获取多家物流公司报价</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">透明定价</p>
                    <p className="text-sm text-muted-foreground">无隐藏费用，所见即所得</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">即时报价</p>
                    <p className="text-sm text-muted-foreground">实时计算，快速响应</p>
                  </div>
                </div>
              </div>
            </div>
            <FreightCalculator />
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">核心功能</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              一站式物流管理平台，涵盖订单管理、费用管理、数据分析等全流程
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务对比 */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">双轨物流服务</h2>
            <p className="text-muted-foreground">卡车 + 快递，满足您的所有物流需求</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 卡车服务 */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">卡车运输</h3>
                  <p className="text-sm text-muted-foreground">FTL / LTL 全覆盖</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  平台仓库配送优惠价
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  多承运商比价选择
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  住宅/商业地址全覆盖
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/register')}>
                立即体验 <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {/* 快递服务 */}
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">快递服务</h3>
                  <p className="text-sm text-muted-foreground">FedEx / UPS / USPS</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  批量下单，一键打单
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  智能选择最优渠道
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  退货标签便捷管理
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/register')}>
                立即体验 <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 服务流程 */}
      <section id="process" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">服务流程</h2>
            <p className="text-muted-foreground">简单四步，轻松完成物流下单</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 为什么选择我们 */}
      <section id="why-us" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">为什么选择我们</h2>
            <p className="text-muted-foreground">专业、可靠、高效的物流服务体验</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">关于我们</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              智运物流是一家专注于北美跨境物流的科技公司，致力于为跨境电商卖家提供一站式物流解决方案。
              我们整合了卡车运输（FTL/LTL）与快递服务（FedEx/UPS/USPS），通过智能比价系统帮助客户降低物流成本。
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              凭借多年的行业经验和与主流承运商的深度合作，我们已服务超过200家企业客户，
              年处理运单量超过10万件。选择智运物流，让跨境物流更简单、更高效。
            </p>
            <Button onClick={() => navigate('/register')} size="lg">
              加入我们
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            立即开始您的智能物流之旅
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            注册即送新人优惠券，体验智能物流管理带来的效率提升
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/register')}
            >
              免费注册
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              已有账号？立即登录
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">智运物流</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 智运物流. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
