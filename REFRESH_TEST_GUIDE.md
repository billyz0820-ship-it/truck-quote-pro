# 页面刷新测试指南

## 测试目的
验证页面刷新时能正确调用 `/api/v1/User/GetLoginUserInfo` 接口并重新加载菜单。

## 测试步骤

### 1. 登录测试
1. 打开应用并登录
2. 观察浏览器控制台，确认以下日志：
   - `=== AuthContext 初始化开始 ===`
   - `=== 后端返回的用户信息 ===`
   - `刷新后的过滤路由数量: X`
   - `=== 用户信息刷新完成 ===`
   - `=== AuthContext 初始化完成 ===`

### 2. 页面刷新测试
1. 在已登录状态下，刷新页面（F5 或 Ctrl+R）
2. 观察控制台日志，应该看到：
   - `=== AuthContext 初始化开始 ===`
   - `localStorage状态: {hasToken: true, hasUserInfo: true}`
   - `设置用户信息成功: [用户名]`
   - `=== 开始刷新用户信息 ===`
   - `=== 后端返回的用户信息 ===`
   - `刷新后的过滤路由数量: X`
   - `=== 用户信息刷新完成 ===`
   - `=== AuthContext 初始化完成 ===`

### 3. API 调用验证
在浏览器开发者工具的 Network 标签页中，应该能看到：
- 对 `/api/v1/User/GetLoginUserInfo` 的 GET 请求
- 请求头包含 `Authorization: Bearer [token]`
- 响应状态码为 200
- 响应体包含用户信息和权限数据

### 4. 菜单加载验证
1. 刷新后，侧边栏菜单应该正常显示
2. 点击各个菜单项，应该能正常跳转
3. 动态路由应该正常工作

## 常见问题排查

### 问题1：刷新后没有调用 API
**可能原因：**
- localStorage 中没有 token
- token 已过期
- 网络连接问题

**排查方法：**
- 检查控制台是否显示 `hasToken: false`
- 检查 Network 标签页是否有 API 请求
- 检查是否有 401 错误

### 问题2：API 调用成功但菜单未加载
**可能原因：**
- 后端返回的数据格式不正确
- 权限过滤逻辑有问题
- 组件映射失败

**排查方法：**
- 查看 `=== 后端返回的用户信息 ===` 日志
- 检查 `刷新后的过滤路由数量` 是否为 0
- 查看是否有组件不存在的错误日志

### 问题3：路由无法访问
**可能原因：**
- 路由权限检查失败
- 路由配置错误
- 组件懒加载失败

**排查方法：**
- 检查 `hasRoutePermission` 返回值
- 查看路由生成日志
- 检查是否有组件加载错误

## 手动测试脚本

在浏览器控制台运行以下脚本来手动测试：

```javascript
// 检查当前认证状态
console.log('当前认证状态:', {
  token: !!localStorage.getItem('authToken'),
  userInfo: !!localStorage.getItem('userInfo')
});

// 手动调用用户信息API
fetch('/api/v1/User/GetLoginUserInfo', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('用户信息:', data))
.catch(error => console.error('API错误:', error));
```

## 期望行为

1. **首次加载：** 正常初始化，调用 API，加载菜单
2. **页面刷新：** 自动从 localStorage 恢复认证状态，重新调用 API 更新权限，重新渲染菜单
3. **网络异常：** 优雅降级，显示错误信息，不会无限加载
4. **权限更新：** 后端权限变更后，刷新页面能立即生效