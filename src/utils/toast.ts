import { toast } from '@/hooks/use-toast';

// 全局提示工具函数
export const showToast = {
  error: (message: string) => {
    toast({
      title: '错误',
      description: message,
      variant: 'destructive',
    });
  },
  
  success: (message: string) => {
    toast({
      title: '成功',
      description: message,
    });
  },
  
  warning: (message: string) => {
    toast({
      title: '警告',
      description: message,
    });
  },
  
  info: (message: string) => {
    toast({
      title: '提示',
      description: message,
    });
  }
};

// 处理授权错误的专用函数
export const handleAuthError = (message: string) => {
  showToast.error(message);
  
  // 清除认证信息
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  
  // 跳转到登录页
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000); // 延迟1秒，让用户看到提示
};