import { api } from '@/utils/api';
import type { 
  UserInfoResponseResponseEntity, 
  UserInfoResponse, 
  ResourceInfoForMenuResponse 
} from '@/types/user';

// 用户服务
export const userService = {
  // 获取登录用户信息
  getLoginUserInfo: async (): Promise<UserInfoResponse> => {
    const response = await api.get<UserInfoResponseResponseEntity>('/api/v1/User/GetLoginUserInfo');
    
    // 添加调试日志
    console.log('=== 后端返回的用户信息 ===');
    console.log('完整响应:', response);
    console.log('用户基本信息:', {
      id: response.id,
      name: response.name,
      role: response.role,
      isAdmin: response.isAdmin
    });
    console.log('菜单权限数量:', response.menus?.length || 0);
    console.log('菜单权限详情:', response.menus?.map(menu => ({
      code: menu.code,
      title: menu.title,
      resourceType: menu.resourceType,
      parentId: menu.parentId,
      orderIndex: menu.orderIndex
    })));
    console.log('功能点权限数量:', response.functionPoints?.length || 0);
    console.log('功能点权限详情:', response.functionPoints);
    console.log('=== 用户信息调试结束 ===');
    
    return response;
  },

  // 获取菜单列表
  getUserMenus: async (): Promise<ResourceInfoForMenuResponse[]> => {
    const userInfo = await userService.getLoginUserInfo();
    return userInfo.menus || [];
  },

  // 获取功能点权限
  getUserFunctionPoints: async (): Promise<string[]> => {
    const userInfo = await userService.getLoginUserInfo();
    return userInfo.functionPoints || [];
  },

  // 检查是否有指定功能点权限
  hasFunctionPoint: async (functionPoint: string): Promise<boolean> => {
    const functionPoints = await userService.getUserFunctionPoints();
    return functionPoints.includes(functionPoint);
  },

  // 检查是否有指定菜单权限
  hasMenuPermission: async (menuCode: string): Promise<boolean> => {
    const menus = await userService.getUserMenus();
    return menus.some(menu => menu.code === menuCode);
  },

  // 获取客户列表
  getCustomerList: async () => {
    const userInfo = await userService.getLoginUserInfo();
    return userInfo.customerList || [];
  },

  // 切换客户
  switchCustomer: async (customerId: string) => {
    return api.post('/api/v1/User/SwitchCustomer', { customerId });
  },
};