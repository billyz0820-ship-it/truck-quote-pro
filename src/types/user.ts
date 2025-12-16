// 用户信息和权限相关类型定义

// 资源类型枚举
export enum ResourceTypeEnum {
  Group = 1,   // 菜单分组
  Menu = 2,    // 菜单
  Func = 3,    // 功能点
}

// 系统类型枚举
export enum SystemTypeEnum {
  System1 = 1,
  System2 = 2,
}

// 菜单导航实体
export interface ResourceInfoForMenuResponse {
  id?: string;
  code?: string;
  title?: string;
  title_En?: string;
  description?: string;
  resourceType?: ResourceTypeEnum;
  parentId?: string;
  opened?: boolean;
  path?: string;
  viewPath?: string;
  viewName?: string;
  viewCache?: boolean;
  icon?: string;
  orderIndex?: number;
  isHidden?: boolean;
  closable?: boolean;
  moduleId?: string;
  defaultPageId?: string;
}

// 客户信息
export interface LoginCustomerInfo {
  customerId?: string;
  customerName?: string;
}

// 用户信息响应
export interface UserInfoResponse {
  id?: string;
  name?: string;
  role?: string;
  roleEn?: string;
  isAdmin?: boolean;
  displayName?: string;
  avatar?: string;
  menus?: ResourceInfoForMenuResponse[];
  logo?: string;
  systemName?: string;
  sysType?: SystemTypeEnum;
  tenant?: string;
  functionPoints?: string[];
  customerList?: LoginCustomerInfo[];
  balance?: number;
  customerName?: string;
  freightBalance?: number;
  nowTime?: string;
}

// 用户信息接口响应
export interface UserInfoResponseResponseEntity {
  code?: string;
  message?: string;
  data?: UserInfoResponse;
  isSuccess?: boolean;
}

// 扩展的用户信息
export interface ExtendedUserInfo {
  id: string;
  userName: string;
  displayName: string;
  email: string;
  company: string;
  customerId: string;
  customerName: string;
  isAdmin: boolean;
  systemType: string;
  // 新增权限相关字段
  role?: string;
  roleEn?: string;
  avatar?: string;
  menus?: ResourceInfoForMenuResponse[];
  functionPoints?: string[];
  customerList?: LoginCustomerInfo[];
  balance?: number;
  freightBalance?: number;
  tenant?: string;
}