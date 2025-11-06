import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, Package, AlertCircle, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { userRole } = useAuth();

  if (userRole === "admin") {
    return <AdminDashboard />;
  } else {
    return <CustomerDashboard />;
  }
};

// Admin Dashboard - 管理端首页
const AdminDashboard = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理端首页 / Admin Dashboard</h1>
        <p className="text-muted-foreground">查看所有客户数据和系统统计</p>
      </div>

      {/* 客户账期与欠款概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              活跃客户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总欠款</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">$45,231.00</div>
            <p className="text-xs text-muted-foreground">
              15个客户未付款
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">$125,340.00</div>
            <p className="text-xs text-muted-foreground">
              +12.5% 比上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月支出</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">$95,200.00</div>
            <p className="text-xs text-muted-foreground">
              成本费用
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 成本与利润 */}
      <Card>
        <CardHeader>
          <CardTitle>成本与利润分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">本月总收入</span>
              <span className="font-bold">$125,340.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">本月总成本</span>
              <span className="font-bold text-red-500">$95,200.00</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-bold">本月净利润</span>
              <span className="font-bold text-green-500">$30,140.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">利润率</span>
              <span className="font-bold">24.0%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 平台订单统计 */}
      <Card>
        <CardHeader>
          <CardTitle>各平台订单统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Platform A</p>
                <p className="text-xs text-muted-foreground">本月 / 上月 / 半年</p>
              </div>
              <div className="text-right">
                <p className="font-bold">45 / 38 / 280</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Platform B</p>
                <p className="text-xs text-muted-foreground">本月 / 上月 / 半年</p>
              </div>
              <div className="text-right">
                <p className="font-bold">32 / 29 / 195</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Platform C</p>
                <p className="text-xs text-muted-foreground">本月 / 上月 / 半年</p>
              </div>
              <div className="text-right">
                <p className="font-bold">28 / 31 / 178</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 热门承运商排名 */}
      <Card>
        <CardHeader>
          <CardTitle>客户最常用承运商排名</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "XPO Logistics", orders: 145, percentage: "28%" },
              { name: "J.B. Hunt", orders: 132, percentage: "25%" },
              { name: "Old Dominion", orders: 98, percentage: "19%" },
              { name: "FedEx Freight", orders: 87, percentage: "17%" },
              { name: "YRC Freight", orders: 56, percentage: "11%" },
            ].map((carrier, index) => (
              <div key={carrier.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground">{index + 1}</span>
                  <div>
                    <p className="font-medium">{carrier.name}</p>
                    <p className="text-xs text-muted-foreground">{carrier.orders} 订单</p>
                  </div>
                </div>
                <span className="font-bold text-primary">{carrier.percentage}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 订单状态与工单 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>订单状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>运输中</span>
                <span className="font-bold">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span>待提货</span>
                <span className="font-bold">15</span>
              </div>
              <div className="flex items-center justify-between">
                <span>已送达</span>
                <span className="font-bold">231</span>
              </div>
              <div className="flex items-center justify-between">
                <span>待审核</span>
                <span className="font-bold">8</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工单事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>待处理</span>
                <span className="font-bold text-yellow-500">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span>处理中</span>
                <span className="font-bold text-blue-500">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span>已完成</span>
                <span className="font-bold text-green-500">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span>已关闭</span>
                <span className="font-bold">89</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Customer Dashboard - 用户端首页
const CustomerDashboard = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来 / Welcome Back</h1>
        <p className="text-muted-foreground">查看您的账户信息和订单状态</p>
      </div>

      {/* 账户信息 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("balance")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345.00</div>
            <p className="text-xs text-muted-foreground">
              可用余额
            </p>
            <Button size="sm" className="mt-2 w-full">充值 / Top Up</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("creditLimit")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$50,000.00</div>
            <p className="text-xs text-muted-foreground">
              剩余额度: $37,655.00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("paymentTerms")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30天</div>
            <p className="text-xs text-muted-foreground">
              剩余账期: 15天 | 截止: 2024-02-15
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">$5,234.00</div>
            <p className="text-xs text-muted-foreground">
              3笔订单待付款
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 订单状态与工单 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>订单状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>运输中</span>
                <span className="font-bold">5</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>待提货</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>已送达</span>
                <span className="font-bold">18</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>待审核</span>
                <span className="font-bold">1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工单事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>待处理</span>
                <span className="font-bold text-yellow-500">2</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>处理中</span>
                <span className="font-bold text-blue-500">1</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>已完成</span>
                <span className="font-bold text-green-500">12</span>
              </div>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/10 p-2 rounded transition-colors">
                <span>已关闭</span>
                <span className="font-bold">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 公告与通知 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("announcements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-2 border-primary pl-4">
              <p className="font-medium">系统升级通知</p>
              <p className="text-sm text-muted-foreground">
                系统将于本周六凌晨2:00-4:00进行升级维护...
              </p>
              <p className="text-xs text-muted-foreground mt-1">2024-01-15</p>
            </div>
            <div className="border-l-2 border-blue-500 pl-4">
              <p className="font-medium">新功能上线</p>
              <p className="text-sm text-muted-foreground">
                优惠券功能已上线，可在财务模块查看可用优惠券...
              </p>
              <p className="text-xs text-muted-foreground mt-1">2024-01-12</p>
            </div>
            <div className="border-l-2 border-yellow-500 pl-4">
              <p className="font-medium">重要提醒</p>
              <p className="text-sm text-muted-foreground">
                请及时关注您的账期,避免影响订单派送...
              </p>
              <p className="text-xs text-muted-foreground mt-1">2024-01-10</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;