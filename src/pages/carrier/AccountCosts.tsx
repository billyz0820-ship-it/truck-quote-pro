import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CarrierAccount {
  id: string;
  account_name: string;
  carrier: string;
}

export default function AccountCosts() {
  const [accounts, setAccounts] = useState<CarrierAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("carrier_accounts")
      .select("id, account_name, carrier")
      .eq("status", "active")
      .order("account_name");

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setAccounts(data || []);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">账号成本维护</h1>
        <p className="text-muted-foreground mt-1">维护快递账号的成本价格</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择账号</CardTitle>
          <CardDescription>选择要配置成本的快递账号</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>快递账号</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="选择快递账号" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.carrier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedAccount}>
              配置成本
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">当前成本配置</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>生效日期</TableHead>
                <TableHead>体积除数</TableHead>
                <TableHead>燃油附加费</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置账号成本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              配置该账号的各项成本费用，包括基础价格、附加费用、旺季费用等
            </p>
            {/* 这里可以添加详细的成本配置表单 */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
