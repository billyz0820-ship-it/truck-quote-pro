import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Clock, 
  Bell,
  TrendingUp,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-muted-foreground">欢迎回到您的管理后台</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单报表</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12%</span> 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账户余额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              可用余额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">信用额度</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$100,000</div>
            <p className="text-xs text-muted-foreground">
              已使用 $23,450
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账期</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30天</div>
            <p className="text-xs text-muted-foreground">
              付款周期
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              订单状态
            </CardTitle>
            <CardDescription>当前订单状态分布</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">运输中</span>
              <Badge variant="default">23</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">待提货</span>
              <Badge variant="secondary">12</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">已送达</span>
              <Badge className="bg-success">156</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">待审核</span>
              <Badge variant="outline">8</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              工单事项
            </CardTitle>
            <CardDescription>需要处理的工单</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">待处理</span>
              <Badge variant="destructive">5</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">处理中</span>
              <Badge className="bg-warning">12</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">已完成</span>
              <Badge className="bg-success">89</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">已关闭</span>
              <Badge variant="secondary">234</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            公告与通知
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-info pl-4">
            <h4 className="font-semibold">系统维护通知</h4>
            <p className="text-sm text-muted-foreground">
              系统将于本周六凌晨2:00-4:00进行维护升级，期间可能影响服务使用。
            </p>
            <p className="text-xs text-muted-foreground mt-1">2024-12-20</p>
          </div>
          
          <div className="border-l-4 border-success pl-4">
            <h4 className="font-semibold">新功能上线</h4>
            <p className="text-sm text-muted-foreground">
              批量导入SKU功能已上线，您现在可以通过Excel表格批量管理产品信息。
            </p>
            <p className="text-xs text-muted-foreground mt-1">2024-12-18</p>
          </div>
          
          <div className="border-l-4 border-warning pl-4">
            <h4 className="font-semibold">价格调整提醒</h4>
            <p className="text-sm text-muted-foreground">
              由于燃油价格上涨，部分路线运费将有小幅调整，具体请查看最新报价。
            </p>
            <p className="text-xs text-muted-foreground mt-1">2024-12-15</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;