// API配置文件
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

// 根据环境变量获取不同的配置
const getApiConfig = (): ApiConfig => {
  // Vite 使用 import.meta.env 而不是 process.env
  const env = import.meta.env.MODE;
  const buildMode = import.meta.env.VITE_BUILD_MODE; // Vite 环境变量需要 VITE_ 前缀

  switch (buildMode || env) {
    case 'development':
      return {
        baseURL: 'http://161.189.32.160:4188',
        timeout: 10000,
      };
    case 'staging':
      return {
        baseURL: 'https://staging-api.truckquote.com/api',
        timeout: 10000,
      };
    case 'production':
      return {
        baseURL: 'https://api.truckquote.com/api',
        timeout: 10000,
      };
    default:
      // 默认配置
      return {
        baseURL: env === 'development' 
          ? 'http://localhost:3001/api' 
          : 'https://api.truckquote.com/api',
        timeout: 10000,
      };
  }
};

export const apiConfig = getApiConfig();

// 导出当前环境信息
export const currentEnv = {
  nodeEnv: import.meta.env.MODE,
  buildMode: import.meta.env.VITE_BUILD_MODE || 'default',
};