// API响应类型定义

// 固定格式的API响应
export interface ApiResponse<T = any> {
  code?: string;
  message: string;
  data: T | null;
  IsSuccess: boolean;
}

// 成功响应
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  IsSuccess: true;
  data: T;
}

// 失败响应
export interface ErrorResponse extends ApiResponse<null> {
  IsSuccess: false;
  data: null;
}

// 登录请求参数
export interface LoginRequest {
  userName: string;
  password: string;
}

// 登录响应数据
export interface LoginResponse {
  token?: string;
  userInfo?: {
    id: string;
    userName: string;
    email?: string;
    name?: string;
  };
}

// 注册请求参数
export interface RegisterRequest {
  company: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// 注册响应数据
export interface RegisterResponse {
  userId?: string;
  message?: string;
}

// API错误类型
export interface ApiError extends Error {
  status?: number;
  response?: Response;
  type?: 'network' | 'http' | 'business';
}