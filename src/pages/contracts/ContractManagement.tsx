import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContractFileUpload } from "@/components/contracts/ContractFileUpload";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Contract {
  id: string;
  contract_number: string;
  contract_type: string;
  party_id: string;
  party_name: string;
  title: string;
  content: string | null;
  file_url: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  signed_at: string | null;
  created_at: string;
}

const ContractManagement = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("customer");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  
  const [formData, setFormData] = useState({
    contract_number: "",
    contract_type: "customer",
    party_id: "",
    party_name: "",
    title: "",
    content: "",
    file_url: "",
    start_date: "",
    end_date: "",
    status: "active"
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);

  useEffect(() => {
    fetchContracts();
    fetchParties();
  }, [activeTab]);

  const fetchParties = async () => {
    const { data: customersData } = await supabase
      .from("customers")
      .select("id, company_name, customer_code");
    if (customersData) setCustomers(customersData);

    const { data: distributorsData } = await supabase
      .from("distributors")
      .select("id, company_name");
    if (distributorsData) setDistributors(distributorsData);
  };

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("contract_type", activeTab)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("获取合同列表失败");
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const generateContractNumber = () => {
    const prefix = activeTab === "customer" ? "C" : activeTab === "distributor" ? "D" : "CH";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${date}${random}`;
  };

  const handleSubmit = async () => {
    if (!formData.party_name || !formData.title || !formData.start_date) {
      toast.error("请填写必填字段");
      return;
    }

    const contractData = {
      ...formData,
      contract_type: activeTab,
      contract_number: editingContract?.contract_number || generateContractNumber(),
      created_by: user?.id
    };

    if (editingContract) {
      const { error } = await supabase
        .from("contracts")
        .update(contractData)
        .eq("id", editingContract.id);

      if (error) {
        toast.error("更新合同失败");
      } else {
        toast.success("合同已更新");
        fetchContracts();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("contracts")
        .insert(contractData);

      if (error) {
        toast.error("创建合同失败: " + error.message);
      } else {
        toast.success("合同已创建");
        fetchContracts();
        setDialogOpen(false);
      }
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此合同吗？")) return;
    
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("删除失败");
    } else {
      toast.success("合同已删除");
      fetchContracts();
    }
  };

  const resetForm = () => {
    setFormData({
      contract_number: "",
      contract_type: activeTab,
      party_id: "",
      party_name: "",
      title: "",
      content: "",
      file_url: "",
      start_date: "",
      end_date: "",
      status: "active"
    });
    setEditingContract(null);
  };

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      contract_number: contract.contract_number,
      contract_type: contract.contract_type,
      party_id: contract.party_id,
      party_name: contract.party_name,
      title: contract.title,
      content: contract.content || "",
      file_url: contract.file_url || "",
      start_date: contract.start_date,
      end_date: contract.end_date || "",
      status: contract.status
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      expired: "outline",
      terminated: "destructive"
    };
    const labels: Record<string, string> = {
      active: "生效中",
      draft: "草稿",
      expired: "已过期",
      terminated: "已终止"
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const filteredContracts = contracts.filter(c => 
    c.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const partyOptions = activeTab === "customer" 
    ? customers.map(c => ({ id: c.id, name: `${c.company_name} (${c.customer_code})` }))
    : distributors.map(d => ({ id: d.id, name: d.company_name }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">合同管理</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customer">客户合同</TabsTrigger>
          <TabsTrigger value="distributor">分销商合同</TabsTrigger>
          <TabsTrigger value="channel">渠道合同</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {activeTab === "customer" ? "客户" : activeTab === "distributor" ? "分销商" : "渠道"}合同列表
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索合同..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        新增合同
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingContract ? "编辑合同" : "新增合同"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>签约方 *</Label>
                          <Select
                            value={formData.party_id}
                            onValueChange={(value) => {
                              const party = partyOptions.find(p => p.id === value);
                              setFormData({ ...formData, party_id: value, party_name: party?.name || "" });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择签约方" />
                            </SelectTrigger>
                            <SelectContent>
                              {partyOptions.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>合同标题 *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="输入合同标题"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>开始日期 *</Label>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>结束日期</Label>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>状态</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">草稿</SelectItem>
                              <SelectItem value="active">生效中</SelectItem>
                              <SelectItem value="expired">已过期</SelectItem>
                              <SelectItem value="terminated">已终止</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>合同内容</Label>
                          <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="输入合同内容或条款"
                            rows={4}
                          />
                        </div>
                        <div className="col-span-2">
                          <ContractFileUpload
                            contractId={editingContract?.id || "new"}
                            currentFileUrl={formData.file_url}
                            onUploadComplete={(url) => setFormData({ ...formData, file_url: url })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSubmit}>保存</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>签约方</TableHead>
                    <TableHead>合同标题</TableHead>
                    <TableHead>开始日期</TableHead>
                    <TableHead>结束日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>合同文件</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">加载中...</TableCell>
                    </TableRow>
                  ) : filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-mono text-sm">{contract.contract_number}</TableCell>
                        <TableCell>{contract.party_name}</TableCell>
                        <TableCell>{contract.title}</TableCell>
                        <TableCell>{contract.start_date}</TableCell>
                        <TableCell>{contract.end_date || "-"}</TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>
                          {contract.file_url ? (
                            <a 
                              href={contract.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              查看
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(contract)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>编辑</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(contract.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>删除</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractManagement;