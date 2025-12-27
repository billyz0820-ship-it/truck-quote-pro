import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";

interface LogisticsService {
  carrier: number;
  carrierStr: string;
  dropDownList: Array<{ 
    key: string; 
    value: string; 
    isChecked?: boolean;
    isDisabled?: boolean;
    sort?: number;
  }>;
}

interface ApiResponse {
  code: string;
  message: string;
  data: {
    allListItems: LogisticsService[];
  };
  isSuccess: boolean;
}

interface LogisticsServiceSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onServiceDataChange?: (serviceData: LogisticsService) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  mode?: "simple" | "detailed"; // simple: 基础选择, detailed: 快递订单模式
}

export function LogisticsServiceSelect({
  value,
  onValueChange,
  onServiceDataChange,
  label = "物流服务",
  placeholder = "选择物流服务",
  required = false,
  disabled = false,
  mode = "simple",
}: LogisticsServiceSelectProps) {
  const [logisticsServices, setLogisticsServices] = useState<LogisticsService[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogisticsServices();
  }, []);

  const fetchLogisticsServices = async () => {
    try {
      setLoading(true);
      console.log('=== 开始获取物流服务数据 ===');
      const response: ApiResponse = await api.get('/api/v1/LogisticsService/GetAllList');
      console.log('物流服务数据:', response);
      
      // 处理API响应结构
      if (response && response.isSuccess && response.data && response.data.allListItems) {
        const services = response.data.allListItems;
        setLogisticsServices(services);
        
        // 如果没有选中值且有选项，默认选择第一个服务的第一个选项
        if (!value && services.length > 0 && mode === "detailed") {
          const firstService = services[0];
          if (firstService.dropDownList && firstService.dropDownList.length > 0) {
            const sortedOptions = firstService.dropDownList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
            onValueChange(sortedOptions[0].key);
          }
        } else if (!value && services.length > 0) {
          onValueChange(services[0].carrier.toString());
        }
      }
    } catch (error) {
      console.error('获取物流服务失败:', error);
      // 如果API调用失败，提供默认选项
      const defaultServices: LogisticsService[] = [
        {
          carrier: 1,
          carrierStr: 'FedEx',
          dropDownList: [
            { key: 'FEDEX_GROUND', value: 'Ground', isChecked: false, isDisabled: false, sort: 0 },
            { key: 'FEDEX_2_DAY', value: '2 Day', isChecked: false, isDisabled: false, sort: 1 }
          ]
        },
        {
          carrier: 2,
          carrierStr: 'UPS',
          dropDownList: [
            { key: 'UPS_GROUND', value: 'Ground', isChecked: false, isDisabled: false, sort: 0 },
            { key: 'UPS_2_DAY', value: '2 Day', isChecked: false, isDisabled: false, sort: 1 }
          ]
        }
      ];
      setLogisticsServices(defaultServices);
      
      if (!value && mode === "detailed" && defaultServices[0].dropDownList) {
        onValueChange(defaultServices[0].dropDownList[0].key);
      } else if (!value) {
        onValueChange(defaultServices[0].carrier.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  // 根据服务key获取对应的承运商
  const getServiceCarrier = (serviceKey: string): string => {
    // 遍历所有物流服务
    for (const service of logisticsServices) {
      if (service.dropDownList) {
        // 查找匹配的dropdown项
        const matchedItem = service.dropDownList.find((item: any) => item.key === serviceKey);
        if (matchedItem) {
          // 使用API返回的carrier字段
          const carrierId = service.carrier;
          
          if (onServiceDataChange) {
            onServiceDataChange({
              ...service,
              carrierValue: carrierId.toString()
            });
          }
          
          console.log('找到匹配的服务:', {
            serviceKey,
            carrierId,
            carrierStr: service.carrierStr,
            serviceValue: matchedItem.value,
            finalValue: carrierId?.toString() || '0'
          });
          
          return carrierId?.toString() || '0';
        }
      }
    }
    console.warn('未找到服务对应的承运商:', serviceKey);
    return '0';
  };

  // 简单模式 - 用于新增报价等场景
  if (mode === "simple") {
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "加载中..." : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {logisticsServices.map((service) => (
              <SelectItem key={service.carrier} value={service.carrier.toString()}>
                {service.carrierStr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // 详细模式 - 用于快递订单等场景
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={(v) => {
        console.log('选择物流服务:', v);
        const carrierValue = getServiceCarrier(v);
        console.log('获取到的承运商:', carrierValue);
        
        // 通过回调函数同时更新服务值和承运商值
        if (onServiceDataChange) {
          const selectedService = logisticsServices.find(service => 
            service.dropDownList?.some(item => item.key === v)
          );
          if (selectedService) {
            onServiceDataChange({
              ...selectedService,
              carrierValue: carrierValue
            });
          }
        }
        
        onValueChange(v);
      }} disabled={disabled || loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "加载中..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {logisticsServices.flatMap((service) => 
            service.dropDownList
              ?.sort((a, b) => (a.sort || 0) - (b.sort || 0)) // 按sort字段排序
              ?.map((item: any) => (
                <SelectItem key={item.key} value={item.key}>
                  {service.carrierStr} - {item.value}
                </SelectItem>
              )) || []
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default LogisticsServiceSelect;