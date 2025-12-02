# API配置说明

## 概述
项目已实现统一的API请求管理，支持根据不同打包命令配置不同的API域名。

## 文件结构
```
src/
├── config/
│   └── api.ts          # API配置文件
├── utils/
│   └── api.ts          # API工具函数
└── pages/
    ├── Login.tsx       # 登录页面
    └── Register.tsx    # 注册页面
```

## 环境配置

### 1. 环境变量设置
在项目根目录创建 `.env` 文件：
```bash
# 复制示例文件
cp .env.example .env
```

### 2. 打包命令配置

#### 开发环境
```bash
# 设置环境变量（在 .env 文件中）
VITE_BUILD_MODE=development

# 启动开发服务器
npm run dev
```
API地址：`http://localhost:3001/api`

#### 测试环境
```bash
# 设置环境变量（在 .env 文件中）
VITE_BUILD_MODE=staging

# 构建测试版本
npm run build:staging
```
API地址：`https://staging-api.truckquote.com/api`

#### 生产环境
```bash
# 设置环境变量（在 .env 文件中）
VITE_BUILD_MODE=production

# 构建生产版本
npm run build
```
API地址：`https://api.truckquote.com/api`

## 使用方法

### 1. 在package.json中的构建脚本
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview"
  }
}
```

### 2. 使用API工具函数
```typescript
import { authApi, api } from '@/utils/api';

// 登录
const response = await authApi.login({ email, password });

// 注册
const response = await authApi.register(userData);

// 通用请求
const response = await api.get('/users');
const response = await api.post('/data', payload);
```

## API工具函数说明

### 基础请求方法
- `api.get(endpoint, options?)` - GET请求
- `api.post(endpoint, data?, options?)` - POST请求
- `api.put(endpoint, data?, options?)` - PUT请求
- `api.delete(endpoint, options?)` - DELETE请求
- `api.patch(endpoint, data?, options?)` - PATCH请求

### 认证相关API
- `authApi.login(credentials)` - 用户登录
- `authApi.register(userData)` - 用户注册
- `authApi.logout()` - 用户登出
- `authApi.refreshToken()` - 刷新token
- `authApi.forgotPassword(email)` - 忘记密码
- `authApi.resetPassword(token, newPassword)` - 重置密码

## 特性

1. **统一配置**：所有API请求都通过统一的配置管理
2. **环境切换**：通过环境变量自动切换API域名
3. **错误处理**：统一的错误处理机制
4. **超时控制**：可配置的请求超时时间
5. **Token管理**：自动处理认证token的保存

## 注意事项

1. 确保`.env`文件中的配置正确
2. 不同环境的API地址需要提前配置好
3. 生产环境部署时记得设置正确的环境变量
4. API工具函数已经处理了基本的错误情况，可以根据需要进一步扩展