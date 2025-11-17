import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Ban, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CarrierAccount {
  id: string;
  account_name: string;
  carrier: string;
  account_number: string;
  status: string;
  notes?: string;
  created_at: string;
}

export default function CarrierAccounts() {
  const [accounts, setAccounts] = useState<CarrierAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CarrierAccount | null>(null);
  const [statsTimeRange, setStatsTimeRange] = useState("week");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    account_name: "",
    carrier: "",
    account_number: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("carrier_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setAccounts(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAccount) {
      const { error } = await supabase
        .from("carrier_accounts")
        .update(formData)
        .eq("id", editingAccount.id);

      if (error) {
        toast({ title: "更新失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "更新成功" });
        setIsDialogOpen(false);
        setEditingAccount(null);
        resetForm();
        fetchAccounts();
      }
    } else {
      const { error } = await supabase.from("carrier_accounts").insert([formData]);

      if (error) {
        toast({ title: "创建失败", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "创建成功" });
        setIsDialogOpen(false);
        resetForm();
        fetchAccounts();
      }
    }
  };

  const handleEdit = (account: CarrierAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      carrier: account.carrier,
      account_number: account.account_number,
      status: account.status,
      notes: account.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleStatusToggle = async (account: CarrierAccount) => {
    const newStatus = account.status === "active" ? "disabled" : "active";
    const { error } = await supabase
      .from("carrier_accounts")
      .update({ status: newStatus })
      .eq("id", account.id);

    if (error) {
      toast({ title: "状态更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "状态已更新" });
      fetchAccounts();
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      carrier: "",
      account_number: "",
      status: "active",
      notes: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">快递账号管理</h1>
          <p className="text-muted-foreground mt-1">管理快递承运商账号</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAccount(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              新增账号
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "编辑账号" : "新增账号"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>账号名称 *</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>承运商 *</Label>
                  <Select
                    value={formData.carrier}
                    onValueChange={(value) => setFormData({ ...formData, carrier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择承运商" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>账号 *</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="disabled">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>备注</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">账号列表</TabsTrigger>
          <TabsTrigger value="stats">使用统计</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账号名称</TableHead>
                  <TableHead>承运商</TableHead>
                  <TableHead>账号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_name}</TableCell>
                    <TableCell>{account.carrier}</TableCell>
                    <TableCell>{account.account_number}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === "active" ? "default" : "secondary"}>
                        {account.status === "active" ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(account.created_at).toLocaleDateString("zh-CN")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusToggle(account)}
                        >
                          {account.status === "active" ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={statsTimeRange === "week" ? "default" : "outline"}
                onClick={() => setStatsTimeRange("week")}
              >
                本周
              </Button>
              <Button
                variant={statsTimeRange === "month" ? "default" : "outline"}
                onClick={() => setStatsTimeRange("month")}
              >
                本月
              </Button>
              <Button
                variant={statsTimeRange === "quarter" ? "default" : "outline"}
                onClick={() => setStatsTimeRange("quarter")}
              >
                本季度
              </Button>
              <Button
                variant={statsTimeRange === "year" ? "default" : "outline"}
                onClick={() => setStatsTimeRange("year")}
              >
                本年
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <CardTitle>{account.account_name}</CardTitle>
                    <CardDescription>{account.carrier}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">打单成本:</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">对外流水:</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">订单数量:</span>
                        <span className="font-medium">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
