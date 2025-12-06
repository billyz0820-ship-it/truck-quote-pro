import { apiConfig } from '@/config/api';
import { encryptPassword } from './crypto';
import { FinanceServiceResource } from '@/constants';
import { t } from './i18n';

// 统一错误处理函数
const handleApiError = async (response: Response, responseData?: any): Promise<never> => {
  let errorMessage = '请求失败';
  
  // 如果已经提供了响应数据，直接使用
  if (responseData && typeof responseData === 'object') {
    // 处理 {code, message, data, IsSuccess} 格式的错误
    if (('IsSuccess' in responseData && responseData.IsSuccess === false) || 
        ('isSuccess' in responseData && responseData.isSuccess === false)) {
      errorMessage = responseData.message || '程序繁忙，请稍后再试';
    }
    // 处理其他可能的错误格式
    else if (responseData.message) {
      errorMessage = responseData.message;
    }
    else if (responseData.error) {
      errorMessage = responseData.error;
    }
    else if (responseData.msg) {
      errorMessage = responseData.msg;
    }
  } else if (!responseData) {
    // 如果没有提供响应数据，尝试解析（但要处理可能的流已被读取的情况）
    try {
      const data = await response.json();
      
      // 检查是否是固定格式的错误响应
      if (data && typeof data === 'object') {
        // 处理 {code, message, data, IsSuccess} 格式的错误
        if (('IsSuccess' in data && data.IsSuccess === false) || 
            ('isSuccess' in data && data.isSuccess === false)) {
          errorMessage = data.message || '程序繁忙，请稍后再试';
        }
        // 处理其他可能的错误格式
        else if (data.message) {
          errorMessage = data.message;
        }
        else if (data.error) {
          errorMessage = data.error;
        }
        else if (data.msg) {
          errorMessage = data.msg;
        }
      }
    } catch (parseError) {
      // JSON解析失败或流已被读取，使用默认错误信息
      console.warn('解析错误响应失败:', parseError);
    }
  }

  // 如果没有从响应中获取到错误信息，使用HTTP状态码对应的默认信息
  if (errorMessage === '请求失败') {
    switch (response.status) {
      case 400:
        errorMessage = '请求参数错误';
        break;
      case 401:
        errorMessage = '未授权，请重新登录';
        break;
      case 403:
        errorMessage = '拒绝访问';
        break;
      case 404:
        errorMessage = '请求的资源不存在';
        break;
      case 500:
        errorMessage = '服务器内部错误';
        break;
      case 502:
        errorMessage = '网关错误';
        break;
      case 503:
        errorMessage = '服务不可用';
        break;
      default:
        errorMessage = `请求失败 (${response.status})`;
    }
  }

  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).response = response;
  throw error;
};

// 获取认证token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// 通用请求函数
export const request = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${apiConfig.baseURL}${endpoint}`;
  const token = getAuthToken();

  // 默认配置
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    signal: AbortSignal.timeout(apiConfig.timeout),
  };

  // 合并配置
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    // 检查HTTP状态码，如果不是成功状态则统一处理错误
    if (!response.ok) {
      // 如果是401错误，清除认证信息并跳转到登录页
      if (response.status === 401 && getAuthToken()) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
      
      let responseData;
      try {
        responseData = await response.clone().json();
      } catch {
        responseData = null;
      }
      await handleApiError(response, responseData);
    }
    
    return response;
  } catch (error) {
    // 如果是网络错误或其他非HTTP错误
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      const networkError = new Error('网络连接失败，请检查网络设置');
      (networkError as any).status = 0;
      (networkError as any).type = 'network';
      throw networkError;
    }
    
    console.error('API请求失败:', error);
    throw error;
  }
};

// 统一响应处理函数
const handleApiResponse = async (response: Response): Promise<any> => {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return response;
  }

  try {
    const data = await response.json();
    
    // 检查统一的响应结构
    if (data && typeof data === 'object') {
      // 处理 {code, message, data, isSuccess} 格式
      if ('isSuccess' in data) {
        if (data.isSuccess === false) {
          const errorMessage = data.message || '请求失败';
          const error = new Error(errorMessage);
          (error as any).code = data.code;
          (error as any).response = response;
          throw error;
        }
        // 返回data字段或者整个响应对象
        return data.data !== undefined ? data.data : data;
      }
      // 处理 {code, message, data, IsSuccess} 格式
      else if ('IsSuccess' in data) {
        if (data.IsSuccess === false) {
          const errorMessage = data.message || '请求失败';
          const error = new Error(errorMessage);
          (error as any).code = data.code;
          (error as any).response = response;
          throw error;
        }
        // 返回data字段或者整个响应对象
        return data.data !== undefined ? data.data : data;
      }
    }
    
    return data;
  } catch (error) {
    // 如果已经是抛出的错误，直接重新抛出
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      throw error;
    }
    // JSON解析失败，返回原始响应
    return response;
  }
};

// 便捷方法 - 返回解析后的JSON数据，统一处理业务状态
export const api = {
  get: async (endpoint: string, options?: RequestInit) => {
    const response = await request(endpoint, { ...options, method: 'GET' });
    return handleApiResponse(response);
  },

  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },

  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },

  delete: async (endpoint: string, options?: RequestInit) => {
    const response = await request(endpoint, { ...options, method: 'DELETE' });
    return handleApiResponse(response);
  },

  patch: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleApiResponse(response);
  },
};

// 认证相关API - 使用简化的请求方式
export const authApi = {
  login: async (credentials: { userName: string; password: string }) => {
    // 加密密码后再发送
    const encryptedPassword = await encryptPassword(credentials.password);
    const encryptedCredentials = {
      ...credentials,
      password: encryptedPassword
    };
    
    // 登录接口不需要Authorization头，直接使用request
    const url = `${apiConfig.baseURL}/auth/api/Auth/CoustomerValidate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encryptedCredentials),
      signal: AbortSignal.timeout(apiConfig.timeout),
    });
    
    if (!response.ok) {
      let responseData;
      try {
        responseData = await response.clone().json();
      } catch {
        responseData = null;
      }
      await handleApiError(response, responseData);
    }
    
    return handleApiResponse(response);
  },

  register: (userData: any) => {
    // 注册时密码不需要加密
    return api.post('/api/v1/User/Register', userData);
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  refreshToken: () => {
    return api.post('/auth/refresh-token');
  },

  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: (token: string, newPassword: string) => {
    return api.post('/auth/reset-password', { token, newPassword });
  },
};