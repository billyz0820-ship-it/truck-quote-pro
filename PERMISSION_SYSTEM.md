# 动态权限路由系统使用指南

## 概述

本系统实现了基于后端返回的用户权限的动态路由和菜单系统。系统会根据用户登录后获取的权限信息动态生成菜单和路由。

## 核心文件说明

### 1. 类型定义 (`src/types/user.ts`)
- `ResourceInfoForMenuResponse`: 菜单资源类型
- `UserInfoResponse`: 用户信息响应类型
- `ExtendedUserInfo`: 扩展的用户信息类型

### 2. 用户服务 (`src/services/userService.ts`)
- `getLoginUserInfo()`: 获取登录用户信息
- `getUserMenus()`: 获取用户菜单权限
- `getUserFunctionPoints()`: 获取用户功能点权限
- `hasFunctionPoint()`: 检查指定功能点权限
- `hasMenuPermission()`: 检查指定菜单权限

### 3. 路由工具 (`src/utils/routeUtils.ts`)
- `staticRoutes`: 所有可能的路由配置
- `filterRoutesByPermission()`: 根据权限过滤路由
- `generateSidebarMenus()`: 生成侧边栏菜单
- `hasRoutePermission()`: 检查路由权限

### 4. 认证上下文 (`src/contexts/AuthContext.tsx`)
- 扩展了原有的认证功能，新增权限相关方法和状态
- `refreshUserInfo()`: 刷新用户信息和权限
- `filteredRoutes`: 过滤后的路由列表
- `sidebarMenus`: 侧边栏菜单列表
- `hasPermission()`: 检查权限
- `hasRoutePermission()`: 检查路由权限

### 5. 动态路由组件 (`src/components/DynamicRoutes.tsx`)
- 根据过滤后的路由动态渲染路由组件
- 支持懒加载
- 自动权限检查

### 6. 权限组件 (`src/components/PermissionButton.tsx`)
- `PermissionButton`: 带权限控制的按钮组件
- `PermissionWrapper`: 权限包装器组件

## 使用方法

### 1. 在组件中使用权限检查

```tsx
import { usePermission } from '@/contexts/AuthContext';
import { PermissionButton } from '@/components/PermissionButton';

const MyComponent = () => {
  const { hasPermission, hasRoutePermission } = usePermission();

  // 检查功能点权限
  const canCreateOrder = hasPermission('create-order');

  // 检查路由权限
  const canAccessFinance = hasRoutePermission('/dashboard/finance');

  return (
    <div>
      {/* 条件渲染 */}
      {canCreateOrder && (
        <button>创建订单</button>
      )}

      {/* 使用权限按钮组件 */}
      <PermissionButton permission="delete-order" onClick={handleDelete}>
        删除订单
      </PermissionButton>

      {/* 使用权限包装器 */}
      <PermissionWrapper permission="edit-order">
        <OrderEditForm />
      </PermissionWrapper>
    </div>
  );
};
```

### 2. 受保护的路由

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

// 在路由配置中使用
<Route
  path="/dashboard/users"
  element={
    <ProtectedRoute requiredPermission="user-management">
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

### 3. 菜单配置

菜单数据来自后端API `/api/v1/User/GetLoginUserInfo`，格式如下：

```json
{
  "menus": [
    {
      "id": "1",
      "code": "dashboard",
      "title": "仪表板",
      "resourceType": 2,
      "path": "/dashboard",
      "icon": "Dashboard",
      "orderIndex": 1
    },
    {
      "id": "2",
      "code": "orders",
      "title": "订单管理",
      "resourceType": 1,
      "icon": "Package",
      "orderIndex": 2,
      "opened": true,
      "defaultPageId": "orders-list"
    }
  ],
  "functionPoints": [
    "create-order",
    "edit-order",
    "delete-order"
  ]
}
```

## 权限类型说明

### 资源类型 (resourceType)
- `1`: Group (菜单分组) - 不直接对应路由，作为父级容器
- `2`: Menu (菜单) - 对应具体页面路由
- `3`: Func (功能点) - 页面内具体操作的权限

### 权限检查逻辑
1. **菜单权限**: 检查用户是否可以访问某个页面
2. **功能点权限**: 检查用户是否可以执行某个操作
3. **路由权限**: 综合菜单和功能点权限检查

## 扩展新路由

### 1. 在 `src/utils/routeUtils.ts` 中添加路由配置

```typescript
export const staticRoutes = [
  // ... 现有路由
  {
    path: '/dashboard/new-feature',
    component: 'NewFeature',
    code: 'new-feature',
    title: '新功能',
    icon: 'Star',
    orderIndex: 15,
  }
];
```

### 2. 在 `src/components/DynamicRoutes.tsx` 中添加组件映射

```typescript
const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  // ... 现有组件
  NewFeature: lazy(() => import('@/pages/newFeature/NewFeature')),
};
```

### 3. 创建对应的页面组件

```typescript
// src/pages/newFeature/NewFeature.tsx
import React from 'react';
import { PermissionButton } from '@/components/PermissionButton';

const NewFeature = () => {
  return (
    <div>
      <h1>新功能页面</h1>
      <PermissionButton permission="new-feature-action">
        执行操作
      </PermissionButton>
    </div>
  );
};

export default NewFeature;
```

## 注意事项

1. **路由匹配**: 路由权限检查基于完整的路径（如 `/dashboard/orders/truck`）
2. **权限缓存**: 用户权限信息存储在 AuthContext 中，登录时自动加载
3. **权限刷新**: 可以通过 `refreshUserInfo()` 方法手动刷新权限
4. **懒加载**: 所有页面组件都使用懒加载，提高应用性能
5. **错误处理**: 权限不足时会自动重定向到仪表板页面

## 最佳实践

1. **统一权限标识**: 建议使用 `kebab-case` 格式的权限标识，如 `create-order`
2. **细粒度权限**: 功能点权限应尽可能细粒化，便于精确控制
3. **默认权限**: 新功能默认不开放权限，需要明确配置
4. **权限文档**: 维护权限标识和对应功能的文档，便于管理

这个权限系统提供了完整的 RBAC (基于角色的访问控制) 功能，支持动态菜单、路由权限和功能点权限控制。