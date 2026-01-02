# 邮编分区模板管理 API 文档

## API 接口说明

### 获取邮编分区模板列表

**接口地址：** `POST /api/v1/ZipZoneTemplate/GetTemplateList`

**请求参数：**
```typescript
{
  pageIndex: number;     // 页码（从1开始，API内部会转换为从0开始）
  pageSize: number;      // 每页数量（可选，默认10，支持10,20,50,100）
  sortField: string;      // 排序字段（可选）
  sortValue: boolean;     // 排序方向（可选，true为升序）
  sorting: string;        // 排序方式（可选）
  name: string[];         // 模板名称数组（可选，支持多选，用逗号分隔传入）
  customerId: string;     // 客户ID（可选，用于筛选特定客户的模板）
}
```

**返回数据：**
```typescript
{
  code: string;
  message: string;
  data: {
    items: {
      id: string;           // 模板ID
      name: string;         // 模板名称
      remark: string;       // 备注
      isRelevance: boolean; // 是否关联
      customerId: string;   // 客户ID
      customerName: string; // 客户名称
    }[];
    totalCount: number;     // 总记录数
  };
  isSuccess: boolean;
}
```

## 前端实现

### 1. API 封装

在 `src/utils/api.ts` 中添加了 `zipZoneTemplateApi`：

```typescript
export const zipZoneTemplateApi = {
  getTemplateList: async (params: {
    pageIndex?: number;
    pageSize?: number;
    sortField?: string;
    sortValue?: boolean;
    sorting?: string;
    name?: string[];
    customerId?: string;
  }) => {
    const processedParams = {
      pageIndex: params.pageIndex ? params.pageIndex - 1 : 0, // 转换为从0开始
      pageSize: params.pageSize || 10,
      sortField: params.sortField || '',
      sortValue: params.sortValue ?? true,
      sorting: params.sorting || '',
      name: params.name || [],
      customerId: params.customerId || ''
    };

    return api.post('/api/v1/ZipZoneTemplate/GetTemplateList', processedParams);
  }
};
```

### 2. 页面组件

创建了 `src/pages/settings/ZipZoneTemplateManagement.tsx` 组件，包含：

- **筛选功能：**
  - 模板名称支持多选（用逗号分隔）
  - 客户下拉筛选
  - 搜索和重置功能

- **表格显示：**
  - 显示模板名称、客户名称、备注、关联状态
  - 支持查看、编辑、删除操作

- **分页功能：**
  - 支持 10, 20, 50, 100 条/页
  - 页码从1开始显示

### 3. 路由配置

在 `src/utils/routeUtils.ts` 中添加了路由：

```typescript
{ 
  path: '/dashboard/settings/zip-zone-templates', 
  component: 'ZipZoneTemplateManagement', 
  code: 'zip-zone-template-management', 
  title: '邮编分区模板管理' 
}
```

在 `src/App.tsx` 中添加了组件映射：

```typescript
ZipZoneTemplateManagement: lazy(() => import('@/pages/settings/ZipZoneTemplateManagement')),
```

## 使用方式

### 基本调用

```typescript
import { zipZoneTemplateApi } from '@/utils/api';

// 获取第一页数据，每页10条
const result = await zipZoneTemplateApi.getTemplateList({
  pageIndex: 1,
  pageSize: 10
});
```

### 带筛选条件

```typescript
// 获取特定客户的模板，按名称筛选
const result = await zipZoneTemplateApi.getTemplateList({
  pageIndex: 1,
  pageSize: 20,
  name: ['模板1', '模板2'],  // 多个模板名称
  customerId: 'customer123', // 特定客户
  sortField: 'name',
  sortValue: true
});
```

### 在组件中使用

```typescript
const fetchTemplates = async () => {
  try {
    const response = await zipZoneTemplateApi.getTemplateList({
      pageIndex: currentPage,
      pageSize: pageSize,
      name: searchName.split(',').map(n => n.trim()).filter(n => n),
      customerId: selectedCustomer
    });
    
    setTemplates(response.items);
    setTotalCount(response.totalCount);
  } catch (error) {
    console.error('获取模板列表失败:', error);
  }
};
```

## 注意事项

1. **页码处理：** 前端页码从1开始，API内部会自动转换为从0开始
2. **名称筛选：** 支持多选，传入数组格式，用户输入时用逗号分隔
3. **客户筛选：** 支持空值（表示全部客户）
4. **分页选项：** 支持每页 10, 20, 50, 100 条记录
5. **错误处理：** API 已集成统一的错误处理机制

## 测试

创建了测试文件 `test-zip-zone-template-api.js` 用于验证API调用：

```bash
node test-zip-zone-template-api.js
```

## 权限配置

需要在后端权限系统中配置 `zip-zone-template-management` 权限码，用户才能访问此功能。