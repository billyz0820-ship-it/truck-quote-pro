import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, Package, AlertCircle, FileText, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RechargeDialog } from "@/components/finance/RechargeDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string>("");

  useEffect(() => {
    fetchCustomerData();
  }, [user]);

  const fetchCustomerData = async () => {
    if (!user) return;
    
    try {
      const { data: customerUser } = await supabase
        .from("customer_users")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (customerUser) {
        setCustomerId(customerUser.customer_id);
        
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerUser.customer_id)
          .single();

        setCustomerData(customer);
      }
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
    }
  };

  const paymentDaysRemaining = customerData?.payment_due_date
    ? Math.ceil(
        (new Date(customerData.payment_due_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const availableCredit = customerData
    ? (customerData.credit_limit || 0) - (customerData.balance || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">首页</h1>
        <p className="text-muted-foreground">查看所有数据和系统统计</p>
      </div>

      {/* Customer Financial Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余账期</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentDaysRemaining > 0 ? `${paymentDaysRemaining} 天` : '已过期'}
            </div>
            <p className="text-xs text-muted-foreground">
              {customerData?.payment_due_date 
                ? `截止日期: ${new Date(customerData.payment_due_date).toLocaleDateString()}`
                : '未设置'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">应付金额</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${customerData?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              待付款金额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">余额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customerData?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              当前账户余额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用额度</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${availableCredit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              信用额度: ${customerData?.credit_limit?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardContent className="pt-6">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setRechargeDialogOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-2" />
              充值
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Statistics */}

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

// Customer Dashboard - 客户端首页
const CustomerDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string>("");

  useEffect(() => {
    fetchCustomerData();
  }, [user]);

  const fetchCustomerData = async () => {
    if (!user) return;
    
    try {
      const { data: customerUser } = await supabase
        .from("customer_users")
        .select("customer_id")
        .eq("user_id", user.id)
        .single();

      if (customerUser) {
        setCustomerId(customerUser.customer_id);
        const { data: customer } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerUser.customer_id)
          .single();

        setCustomerData(customer);
      }
    } catch (error: any) {
      console.error("获取客户数据失败:", error);
    }
  };

  const paymentDaysRemaining = customerData?.payment_due_date 
    ? Math.ceil((new Date(customerData.payment_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const availableCredit = (customerData?.credit_limit || 0) - (customerData?.balance || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客户首页 / Customer Dashboard</h1>
          <p className="text-muted-foreground">查看您的订单和账户信息</p>
        </div>
      </div>

      {/* 财务信息第一行 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">剩余账期</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentDaysRemaining} 天</div>
            <p className="text-xs text-muted-foreground">
              {customerData?.payment_due_date ? new Date(customerData.payment_due_date).toLocaleDateString() : "未设置"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">应付金额</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${(customerData?.balance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">待付款金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账户余额</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${(customerData?.balance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">当前余额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用额度</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              ${availableCredit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              总额度 ${(customerData?.credit_limit || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center">
          <CardContent className="p-6">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => setRechargeDialogOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-2" />
              充值
            </Button>
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
            </div>
          </CardContent>
        </Card>
      </div>

      <RechargeDialog 
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
        customerId={customerId}
        onSuccess={fetchCustomerData}
      />
    </div>
  );
};

export default Dashboard;