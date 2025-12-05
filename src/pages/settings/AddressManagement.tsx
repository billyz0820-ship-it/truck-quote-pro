import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useZipCodeLookup } from "@/hooks/useZipCodeLookup";

interface Address {
  id: string;
  customer_id: string;
  address_type: string;
  location_type: string;
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  address: string;
  zip: string;
  city: string;
  state: string;
  is_default: boolean | null;
  notes: string | null;
  customers?: {
    customer_code: string;
    company_name: string;
  };
}

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
}

const ADDRESS_TYPE_LABELS: Record<string, string> = {
  sender: "发货地址",
  receiver: "收货地址",
  both: "收发货地址"
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  commercial_with_dock: "商业地址(有装卸台)",
  commercial_without_dock: "商业地址(无装卸台)",
  residential: "住宅地址"
};

export default function AddressManagement() {
  const navigate = useNavigate();
  const { customerId, userRole } = useAuth();
  const { lookupZipCode, loading: zipLoading } = useZipCodeLookup();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    address_type: "both",
    location_type: "commercial_with_dock",
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    zip: "",
    city: "",
    state: "",
    is_default: false,
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [customerId, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customers for admin
      if (userRole === 'admin') {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, customer_code, company_name')
          .order('company_name');
        setCustomers(customersData || []);
      }

      // Fetch addresses
      let query = supabase
        .from('addresses')
        .select('*, customers(customer_code, company_name)');
      
      if (userRole !== 'admin' && customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses((data || []) as Address[]);
    } catch (error: any) {
      toast.error("加载地址失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZipCodeChange = async (zip: string) => {
    setFormData(prev => ({ ...prev, zip }));
    
    // Validate zip format (5 digits or 5+4)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (zipRegex.test(zip)) {
      const zipInfo = await lookupZipCode(zip.substring(0, 5));
      if (zipInfo) {
        setFormData(prev => ({
          ...prev,
          city: zipInfo.city,
          state: zipInfo.stateCode
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.customer_id || !formData.contact_name || !formData.address || !formData.zip || !formData.city || !formData.state) {
        toast.error("请填写所有必填项");
        return;
      }

      const addressData = {
        customer_id: formData.customer_id,
        address_type: formData.address_type,
        location_type: formData.location_type,
        name: formData.name || formData.contact_name,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email || null,
        address: formData.address,
        zip: formData.zip,
        city: formData.city,
        state: formData.state,
        is_default: formData.is_default,
        notes: formData.notes || null
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id);
        if (error) throw error;
        toast.success("地址已更新");
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert(addressData);
        if (error) throw error;
        toast.success("地址已添加，请配置邮编分区表");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此地址吗？")) return;
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("地址已删除");
      fetchData();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      customer_id: address.customer_id,
      address_type: address.address_type,
      location_type: address.location_type,
      name: address.name,
      contact_name: address.contact_name,
      contact_phone: address.contact_phone,
      contact_email: address.contact_email || "",
      address: address.address,
      zip: address.zip,
      city: address.city,
      state: address.state,
      is_default: address.is_default || false,
      notes: address.notes || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAddress(null);
    setFormData({
      customer_id: userRole !== 'admin' && customerId ? customerId : "",
      address_type: "both",
      location_type: "commercial_with_dock",
      name: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      address: "",
      zip: "",
      city: "",
      state: "",
      is_default: false,
      notes: ""
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">地址配置</h1>
          <p className="text-sm text-muted-foreground">管理收发货地址及邮编分区</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新增地址
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            地址列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无地址配置</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole === 'admin' && <TableHead>客户</TableHead>}
                  <TableHead>类型</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>邮编</TableHead>
                  <TableHead>城市/州</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((addr) => (
                  <TableRow key={addr.id}>
                    {userRole === 'admin' && (
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{addr.customers?.customer_code}</div>
                          <div className="text-xs text-muted-foreground">{addr.customers?.company_name}</div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">{ADDRESS_TYPE_LABELS[addr.address_type] || addr.address_type}</Badge>
                    </TableCell>
                    <TableCell>{addr.name || "-"}</TableCell>
                    <TableCell>{addr.contact_name}</TableCell>
                    <TableCell>{addr.contact_phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{addr.address}</TableCell>
                    <TableCell>{addr.zip}</TableCell>
                    <TableCell>{addr.city}, {addr.state}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/dashboard/settings/addresses/${addr.id}/zones`)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>配置邮编分区</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>编辑</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(addr.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>删除</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "编辑地址" : "新增地址"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {userRole === 'admin' && (
              <div className="space-y-2">
                <Label>客户 *</Label>
                <Select value={formData.customer_id} onValueChange={(v) => setFormData(prev => ({ ...prev, customer_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.customer_code} - {c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>收发货类型 *</Label>
              <Select value={formData.address_type} onValueChange={(v) => setFormData(prev => ({ ...prev, address_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">发货地址</SelectItem>
                  <SelectItem value="receiver">收货地址</SelectItem>
                  <SelectItem value="both">收发货地址</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>地址类型 *</Label>
              <Select value={formData.location_type} onValueChange={(v) => setFormData(prev => ({ ...prev, location_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial_with_dock">商业地址(有装卸台)</SelectItem>
                  <SelectItem value="commercial_without_dock">商业地址(无装卸台)</SelectItem>
                  <SelectItem value="residential">住宅地址</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>公司名称</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>联系人 *</Label>
              <Input value={formData.contact_name} onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>联系电话 *</Label>
              <Input value={formData.contact_phone} onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" value={formData.contact_email} onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>详细地址 *</Label>
              <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>邮编 * (5位或5+4位)</Label>
              <Input 
                value={formData.zip} 
                onChange={(e) => handleZipCodeChange(e.target.value)}
                placeholder="12345 或 12345-6789"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>城市 *</Label>
              <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} disabled={zipLoading} />
            </div>
            <div className="space-y-2">
              <Label>州 *</Label>
              <Input value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} disabled={zipLoading} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>备注</Label>
              <Input value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
