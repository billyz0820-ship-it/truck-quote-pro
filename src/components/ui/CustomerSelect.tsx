import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";

interface Customer {
  id: string;
  name: string;
  code?: string;
  companyName?: string;
}

interface CustomerSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showAllOption?: boolean; // 是否显示"全部"选项
}

export function CustomerSelect({
  value,
  onValueChange,
  label = "客户筛选",
  placeholder = "选择客户",
  required = false,
  disabled = false,
  showAllOption = true,
}: CustomerSelectProps) {
  const { user, userRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      let customerList: Customer[] = [];
      
      if (user?.customerList && user.customerList.length > 0) {
        // 使用登录用户返回的客户数据
        customerList = user.customerList.map((customer: any) => ({
          id: customer.customerId || customer.id,
          name: customer.customerName || customer.name,
          code: customer.customerCode || customer.code,
          companyName: customer.customerName || customer.companyName
        }));
        console.log('使用登录用户客户数据:', customerList);
      } else if (['admin', 'customer_service', 'operations'].includes(userRole || '')) {
        // 管理员角色，从API获取所有客户
        try {
          const allCustomers = await api.get('/api/v1/Customer/GetAllCustomers');
          if (allCustomers && Array.isArray(allCustomers)) {
            customerList = allCustomers.map((customer: any) => ({
              id: customer.id,
              name: customer.companyName || customer.customerName,
              code: customer.customerCode,
              companyName: customer.companyName
            }));
            console.log('管理员获取所有客户数据:', customerList);
          }
        } catch (adminError) {
          console.warn('管理员获取客户列表失败:', adminError);
        }
      }
      
      setCustomers(customerList);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className={required ? "after:content-['*'] after:ml-1 after:text-red-500" : ""}>
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              全部客户
            </SelectItem>
          )}
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
              {customer.code && ` (${customer.code})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && (
        <div className="text-xs text-muted-foreground mt-1">加载中...</div>
      )}
    </div>
  );
}