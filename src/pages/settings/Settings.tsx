import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Users, 
  Plus,
  Edit,
  Trash2,
  MapPin,
  Truck
} from "lucide-react";

const Settings = () => {
  const consignees = [
    {
      id: "1",
      name: "ABC Electronics Inc.",
      address: "123 Tech Street, San Jose, CA 95110",
      contact: "John Smith",
      phone: "+1 (555) 123-4567"
    },
    {
      id: "2", 
      name: "XYZ Retail Corp.",
      address: "456 Commerce Ave, New York, NY 10001",
      contact: "Sarah Johnson",
      phone: "+1 (555) 987-6543"
    }
  ];

  const shippers = [
    {
      id: "1",
      name: "Global Manufacturing Ltd.",
      address: "789 Industrial Blvd, Detroit, MI 48201",
      contact: "Mike Wilson",
      phone: "+1 (555) 456-7890"
    }
  ];

  const subAccounts = [
    {
      id: "1",
      username: "operations_manager",
      name: "张经理",
      role: "订单管理员",
      status: "active",
      lastLogin: "2024-01-15"
    },
    {
      id: "2",
      username: "finance_clerk", 
      name: "李会计",
      role: "财务专员",
      status: "active",
      lastLogin: "2024-01-14"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">配置管理</h1>
        <p className="text-muted-foreground">管理收货人、发货人和子账号配置</p>
      </div>

      <Tabs defaultValue="consignees" className="w-full">
        <TabsList>
          <TabsTrigger value="consignees">收货人配置</TabsTrigger>
          <TabsTrigger value="shippers">发货人配置</TabsTrigger>
          <TabsTrigger value="subaccounts">子账号配置</TabsTrigger>
        </TabsList>

        <TabsContent value="consignees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  收货人管理
                </span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加收货人
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公司名称</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>联系人</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consignees.map((consignee) => (
                    <TableRow key={consignee.id}>
                      <TableCell className="font-medium">{consignee.name}</TableCell>
                      <TableCell>{consignee.address}</TableCell>
                      <TableCell>{consignee.contact}</TableCell>
                      <TableCell>{consignee.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shippers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  发货人管理
                </span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加发货人
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>公司名称</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>联系人</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippers.map((shipper) => (
                    <TableRow key={shipper.id}>
                      <TableCell className="font-medium">{shipper.name}</TableCell>
                      <TableCell>{shipper.address}</TableCell>
                      <TableCell>{shipper.contact}</TableCell>
                      <TableCell>{shipper.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subaccounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  子账号管理
                </span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加子账号
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell>
                        <Badge className="bg-success">活跃</Badge>
                      </TableCell>
                      <TableCell>{account.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;