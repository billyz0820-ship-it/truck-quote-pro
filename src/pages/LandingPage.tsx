import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Package, TrendingUp, Shield, Clock, Globe, ChevronRight, BarChart3, PieChart, MapPin, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#lineGradient)"
      />
      <path
        d={pathData}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
      />
      <circle cx={width} cy={height - (points[points.length - 1] / maxVal) * height} r="4" fill="#3b82f6" />
    </svg>
  );
};

// 简约饼图组件
const SimplePieChart = () => {
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle 
          cx="50" cy="50" r="40" fill="none" 
          stroke="#3b82f6" strokeWidth="12"
          strokeDasharray="175 251"
        />
        <circle 
          cx="50" cy="50" r="40" fill="none" 
          stroke="#93c5fd" strokeWidth="12"
          strokeDasharray="50 251"
          strokeDashoffset="-175"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-800">$540</span>
        <span className="text-xs text-slate-500">总支出(万)</span>
      </div>
    </div>
  );
};

// 仪表盘模拟组件
const DashboardMockup = () => {
  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 max-w-lg">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">总订单</span>
            <TrendingUp className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">8,256</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">运输中</span>
            <Truck className="w-3 h-3 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">1,428</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">已送达</span>
            <Package className="w-3 h-3 text-green-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">6,828</p>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">运单趋势</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <SimpleLineChart />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>周一</span>
            <span>周日</span>
          </div>
        </div>
        <div className="col-span-2 bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">费用分析</span>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex justify-center">
            <SimplePieChart />
          </div>
        </div>
      </div>
      
      {/* 物流追踪示意 */}
      <div className="mt-4 bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700">实时追踪</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
          </div>
          <span className="text-xs text-slate-500">75%</span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>上海仓库</span>
          <span>洛杉矶FBA</span>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Truck,
      title: "卡车运输",
      description: "FTL/LTL全覆盖，智能报价，实时追踪",
    },
    {
      icon: Package,
      title: "快递服务",
      description: "FedEx/UPS/USPS多渠道，一站式发货",
    },
    {
      icon: TrendingUp,
      title: "成本优化",
      description: "智能比价，自动选择最优物流方案",
    },
    {
      icon: Shield,
      title: "安全保障",
      description: "货物保险，全程追踪，安心托运",
    },
    {
      icon: Clock,
      title: "时效保证",
      description: "准时送达率99%+，时效有保障",
    },
    {
      icon: Globe,
      title: "全球覆盖",
      description: "北美全境配送，跨境物流无忧",
    },
  ];

  const partners = [
    "FedEx", "UPS", "USPS", "Amazon", "Walmart", "Wayfair"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">智运物流</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">产品</a>
              <a href="#pricing" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">价格</a>
              <a href="#cases" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">案例</a>
              <a href="#about" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">关于</a>
            </nav>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-600">
                登录
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-blue-500 hover:bg-blue-600 text-white">
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
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
                  北美跨境物流
                  <br />
                  <span className="text-blue-500">一站式智能管理平台</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-md">
                  <span className="text-blue-500 font-semibold">50,000+</span> 跨境卖家的共同选择，
                  支持 <span className="text-blue-500 font-semibold">10+</span> 主流物流渠道，
                  助力卖家降本增效
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                >
                  立即免费试用
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  查看成功案例
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <p className="text-xs text-slate-400">
                来源：2024年北美跨境物流SaaS市场调研报告
              </p>
            </div>
            
            {/* 右侧仪表盘模拟 */}
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl" />
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* 合作伙伴 */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-12">
            {partners.map((partner) => (
              <div key={partner} className="text-xl font-bold text-slate-300 hover:text-slate-400 transition-colors">
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
              <p className="text-4xl font-bold text-blue-500 mb-2">
                <AnimatedCounter end={50000} suffix="+" />
              </p>
              <p className="text-slate-500">服务客户</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">
                <AnimatedCounter end={1000000} suffix="+" />
              </p>
              <p className="text-slate-500">年运单量</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">
                99.5%
              </p>
              <p className="text-slate-500">准时送达率</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">
                <AnimatedCounter end={15} suffix="%" />
              </p>
              <p className="text-slate-500">平均节省成本</p>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section id="features" className="py-20 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">核心功能</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              一站式物流管理平台，涵盖卡车运输、快递发货、费用管理等全流程
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务对比 */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">双轨物流服务</h2>
            <p className="text-slate-500">卡车 + 快递，满足您的所有物流需求</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 卡车服务 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">卡车运输</h3>
                  <p className="text-sm text-slate-500">FTL / LTL 全覆盖</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  平台仓库配送优惠价
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  多承运商比价选择
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  住宅/商业地址全覆盖
                </li>
              </ul>
              <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
                了解更多 <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {/* 快递服务 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">快递服务</h3>
                  <p className="text-sm text-slate-500">FedEx / UPS / USPS</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  批量下单，一键打单
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  智能选择最优渠道
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  退货标签便捷管理
                </li>
              </ul>
              <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
                了解更多 <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            立即开始您的智能物流之旅
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            注册即送新人优惠券，体验智能物流管理带来的效率提升
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-500 hover:bg-blue-50"
            >
              免费注册
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-white/30 text-white hover:bg-white/10"
            >
              已有账号？立即登录
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800">智运物流</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2024 智运物流. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
