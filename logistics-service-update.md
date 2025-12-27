# 物流服务更新说明

## 修改内容

### 1. 将"承运商"改为"物流服务"
- 字段标签从"承运商"改为"物流服务"
- 状态变量从 `carrier` 改为 `logisticsService`
- 设置函数从 `setCarrier` 改为 `setLogisticsService`

### 2. 通过API获取物流服务数据
```typescript
// 新增API调用
const response = await api.get('/api/v1/LogisticsService/GetAllList');

// 如果API调用失败，提供默认选项
const defaultServices = [
  { id: 'FedEx', name: 'FedEx' },
  { id: 'UPS', name: 'UPS' },
  { id: 'USPS', name: 'USPS' },
  { id: 'DHL', name: 'DHL' }
];
```

### 3. 动态生成物流服务选项
```jsx
<Select value={logisticsService} onValueChange={setLogisticsService}>
  <SelectContent>
    {logisticsServices.map((service) => (
      <SelectItem key={service.id || service.code} value={service.id || service.code}>
        {service.name || service.code}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## API响应格式预期

```typescript
// 预期的API响应格式
interface LogisticsService {
  id: string;
  code: string;
  name: string;
  // 其他可能的服务相关字段
}

// 数组格式
LogisticsService[]
```

## 功能说明

1. **自动获取物流服务**：页面加载时自动调用 `/api/v1/LogisticsService/GetAllList` 获取服务列表
2. **默认选项**：如果API调用失败，提供默认的物流服务选项
3. **动态渲染**：根据API返回的数据动态生成选择选项
4. **向后兼容**：数据库中的字段名仍为 `carrier`，保持数据一致性

## 测试步骤

1. 访问 `/dashboard/carrier/customer-pricing/new` 页面
2. 检查"物流服务"下拉菜单是否正常显示
3. 检查浏览器控制台中的API调用日志
4. 测试不同的物流服务选择是否正常工作
5. 测试保存功能是否正常

## 调试信息

在浏览器控制台中查看以下日志：

```
=== 开始获取物流服务数据 ===
物流服务数据: [Array]
```

如果API调用失败：

```
获取物流服务失败: [Error]
```

## 注意事项

1. **API字段兼容性**：支持 `id` 和 `code` 字段，`name` 字段用于显示
2. **错误处理**：API调用失败时有默认选项，不影响用户体验
3. **数据一致性**：后端数据库字段仍为 `carrier`，确保数据完整性