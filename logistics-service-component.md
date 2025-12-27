# 物流服务组件使用说明

## 组件概述

创建了可复用的 `LogisticsServiceSelect` 组件，用于统一管理物流服务选择功能。

### 组件位置
`src/components/ui/LogisticsServiceSelect.tsx`

## 组件特性

### 1. 双模式支持
- **简单模式 (simple)**: 用于新增报价等场景，直接选择物流服务商
- **详细模式 (detailed)**: 用于快递订单等场景，选择具体的服务类型

### 2. API 集成
- 自动调用 `/api/v1/LogisticsService/GetAllList` 获取物流服务数据
- 支持错误处理和默认选项

### 3. 数据结构支持
```typescript
interface LogisticsService {
  id: string;
  code: string;
  name: string;
  carrierId?: string;
  carrierStr?: string;
  carrier?: string;
  dropDownList?: Array<{ key: string; value: string }>;
}
```

## 组件属性

```typescript
interface LogisticsServiceSelectProps {
  value: string;                              // 选中的值
  onValueChange: (value: string) => void;     // 值变化回调
  onServiceDataChange?: (serviceData: LogisticsService) => void; // 服务数据变化回调（详细模式）
  label?: string;                              // 标签文本，默认"物流服务"
  placeholder?: string;                          // 占位符，默认"选择物流服务"
  required?: boolean;                            // 是否必填，默认false
  disabled?: boolean;                            // 是否禁用，默认false
  mode?: "simple" | "detailed";               // 模式，默认"simple"
}
```

## 使用示例

### 1. 简单模式 - 新增报价页面
```tsx
<LogisticsServiceSelect
  value={logisticsService}
  onValueChange={setLogisticsService}
  label="物流服务"
  required
  mode="simple"
/>
```

### 2. 详细模式 - 快递订单页面
```tsx
<LogisticsServiceSelect
  value={formData.service_type}
  onValueChange={(v) => {
    setFormData(prev => ({ 
      ...prev, 
      service_type: v
    }));
  }}
  onServiceDataChange={(serviceData) => {
    if (serviceData.carrierValue) {
      setFormData(prev => ({ 
        ...prev, 
        carrier: serviceData.carrierValue
      }));
    }
  }}
  label="物流服务"
  required
  mode="detailed"
/>
```

## 页面更新

### 1. 新增快递订单页面 (`CreateExpressOrderPage.tsx`)
- ✅ 使用新的 `LogisticsServiceSelect` 组件
- ✅ 移除旧的物流服务获取逻辑
- ✅ 支持详细模式，包含 carrier 值获取
- ✅ 简化代码，提高可维护性

### 2. 新增报价页面 (`CustomerPricingEdit.tsx`)
- ✅ 使用新的 `LogisticsServiceSelect` 组件
- ✅ 移除旧的物流服务获取逻辑
- ✅ 使用简单模式，直接选择物流服务商
- ✅ 统一组件使用，保持一致性

## 数据流

### 简单模式
```
用户选择 → onValueChange → 直接更新表单值
```

### 详细模式
```
用户选择 → getServiceCarrier → onServiceDataChange → 更新 carrier 字段
                     ↓
                  onValueChange → 更新 service_type 字段
```

## 优势

1. **代码复用**: 两个页面使用同一个组件，减少重复代码
2. **统一接口**: 所有物流服务选择都通过同一API获取数据
3. **错误处理**: 统一的错误处理和默认选项
4. **类型安全**: 完整的TypeScript类型定义
5. **灵活配置**: 支持不同模式，适应不同使用场景
6. **维护简单**: 物流服务相关逻辑集中在一个组件中

## 测试要点

1. **API调用**: 验证 `/api/v1/LogisticsService/GetAllList` 是否正常调用
2. **数据渲染**: 验证物流服务选项是否正确显示
3. **模式切换**: 验证简单模式和详细模式是否正常工作
4. **错误处理**: 验证API失败时是否显示默认选项
5. **表单提交**: 验证选择的数据是否正确传递给后端

## 注意事项

1. **向后兼容**: 数据库字段仍为 `carrier`，确保数据一致性
2. **默认值**: 组件会自动设置默认值，无需手动处理
3. **加载状态**: 组件内部处理加载状态，显示加载中提示
4. **调试信息**: 包含详细的控制台日志，便于调试