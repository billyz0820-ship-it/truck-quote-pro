import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Edit, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Address {
  id: string;
  customer_id: string;
  address_type: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  location_type: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

export const AddressManagement = () => {
  const { userRole, customerId } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [addressForm, setAddressForm] = useState({
    customer_id: "",
    address_type: "pickup",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    location_type: "commercial",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    notes: "",
    is_default: false
  });

  useEffect(() => {
    fetchData();
  }, [customerId, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 如果是管理员，加载客户列表
      if (userRole === "admin") {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, customer_code, company_name')
          .eq('status', 'active')
          .order('company_name');

        if (customersError) throw customersError;
        setCustomers(customersData || []);
      }

      // 加载地址列表
      let query = supabase.from('addresses').select('*').order('created_at', { ascending: false });

      if (userRole !== 'admin' && customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data: addressesData, error: addressesError } = await query;
      if (addressesError) throw addressesError;
      setAddresses(addressesData || []);

    } catch (error: any) {
      toast.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAddressForm({
      customer_id: userRole === "admin" ? "" : customerId || "",
      address_type: "pickup",
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      location_type: "commercial",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      notes: "",
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      customer_id: address.customer_id,
      address_type: address.address_type,
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      zip: address.zip,
      location_type: address.location_type,
      contact_name: address.contact_name,
      contact_phone: address.contact_phone,
      contact_email: address.contact_email || "",
      notes: address.notes || "",
      is_default: address.is_default
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!addressForm.name || !addressForm.address || !addressForm.city || !addressForm.state || !addressForm.zip) {
      toast.error("请填写所有必填字段");
      return;
    }

    if (userRole === "admin" && !addressForm.customer_id) {
      toast.error("请选择客户");
      return;
    }

    try {
      const saveData: any = {
        ...addressForm,
        customer_id: userRole === "admin" ? addressForm.customer_id : customerId,
        contact_email: addressForm.contact_email || null,
        notes: addressForm.notes || null
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(saveData)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success("地址更新成功！");
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert([saveData]);

        if (error) throw error;
        toast.success("地址创建成功！");
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
      toast.success("地址删除成功！");
      fetchData();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const handleSetDefault = async (id: string, customerId: string, addressType: string) => {
    try {
      // 先取消该客户该类型的所有默认地址
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('address_type', addressType);

      // 设置新的默认地址
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success("已设置为默认地址！");
      fetchData();
    } catch (error: any) {
      toast.error("设置默认地址失败: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">地址配置</h2>
          <p className="text-muted-foreground">管理常用的发货和收货地址</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加地址
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "编辑地址" : "添加新地址"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label>客户 *</Label>
                  <Select
                    value={addressForm.customer_id}
                    onValueChange={(value) => setAddressForm({ ...addressForm, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_code} - {customer.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>地址类型 *</Label>
                  <Select
                    value={addressForm.address_type}
                    onValueChange={(value) => setAddressForm({ ...addressForm, address_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">发货地址</SelectItem>
                      <SelectItem value="delivery">收货地址</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>地址名称 *</Label>
                  <Input
                    placeholder="例如：仓库A、办公室等"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>详细地址 *</Label>
                <Input
                  placeholder="街道地址"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>城市 *</Label>
                  <Input
                    placeholder="城市"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>州 *</Label>
                  <Input
                    placeholder="州"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>邮编 *</Label>
                  <Input
                    placeholder="邮编"
                    value={addressForm.zip}
                    onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>位置类型 *</Label>
                <Select
                  value={addressForm.location_type}
                  onValueChange={(value) => setAddressForm({ ...addressForm, location_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">住宅</SelectItem>
                    <SelectItem value="commercial">商业</SelectItem>
                    <SelectItem value="warehouse">仓库</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系人姓名 *</Label>
                  <Input
                    placeholder="姓名"
                    value={addressForm.contact_name}
                    onChange={(e) => setAddressForm({ ...addressForm, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系电话 *</Label>
                  <Input
                    placeholder="电话"
                    value={addressForm.contact_phone}
                    onChange={(e) => setAddressForm({ ...addressForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>电子邮箱</Label>
                <Input
                  type="email"
                  placeholder="邮箱（可选）"
                  value={addressForm.contact_email}
                  onChange={(e) => setAddressForm({ ...addressForm, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  placeholder="其他说明（可选）"
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            地址列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>位置类型</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>电话</TableHead>
                {userRole === "admin" && <TableHead>客户</TableHead>}
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === "admin" ? 9 : 8} className="text-center text-muted-foreground">
                    暂无地址
                  </TableCell>
                </TableRow>
              ) : (
                addresses.map((address) => (
                  <TableRow key={address.id}>
                    <TableCell className="font-medium">{address.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {address.address_type === "pickup" ? "发货" : "收货"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{address.address}</div>
                        <div className="text-muted-foreground">
                          {address.city}, {address.state} {address.zip}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {address.location_type === "residential" && "住宅"}
                      {address.location_type === "commercial" && "商业"}
                      {address.location_type === "warehouse" && "仓库"}
                    </TableCell>
                    <TableCell>{address.contact_name}</TableCell>
                    <TableCell>{address.contact_phone}</TableCell>
                    {userRole === "admin" && (
                      <TableCell>
                        {customers.find(c => c.id === address.customer_id)?.company_name}
                      </TableCell>
                    )}
                    <TableCell>
                      {address.is_default && (
                        <Badge className="bg-green-500">
                          <Star className="h-3 w-3 mr-1" />
                          默认
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!address.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(address.id, address.customer_id, address.address_type)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
