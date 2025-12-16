import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { filterRoutesByPermission, generateSidebarMenus, hasRoutePermission } from "@/utils/routeUtils";
import { staticRoutes } from "@/utils/routeUtils";
import type { 
  ExtendedUserInfo, 
  ResourceInfoForMenuResponse,
  UserInfoResponse 
} from "@/types/user";

// 自定义用户类型，基于JWT token中的信息
interface CustomUser {
  id: string;
  userName: string;
  displayName: string;
  email: string;
  company: string;
  customerId: string;
  customerName: string;
  isAdmin: boolean;
  systemType: string;
  role?: string;
  roleEn?: string;
  avatar?: string;
  menus?: ResourceInfoForMenuResponse[];
  functionPoints?: string[];
  customerList?: any[];
  balance?: number;
  freightBalance?: number;
  tenant?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  token: string | null;
  loading: boolean;
  signIn: (user: CustomUser, token: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  // 新增权限相关方法
  refreshUserInfo: () => Promise<void>;
  filteredRoutes: typeof staticRoutes;
  sidebarMenus: any[];
  hasPermission: (code: string) => boolean;
  hasRoutePermission: (routePath: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [filteredRoutes, setFilteredRoutes] = useState(staticRoutes);
  const [sidebarMenus, setSidebarMenus] = useState<any[]>([]);
  const navigate = useNavigate();

  // 刷新用户信息和权限
  const refreshUserInfo = async () => {
    try {
      console.log('=== 开始刷新用户信息 ===');
      const userInfo = await userService.getLoginUserInfo();
      setUserInfo(userInfo);
      
        // 更新用户信息
        if (userInfo) {
          const extendedUser: CustomUser = {
            id: userInfo.id || '',
            userName: userInfo.name || '',
            displayName: userInfo.displayName || userInfo.name || '',
            email: '',
            company: '',
            customerId: '',
            customerName: userInfo.customerName || '',
            isAdmin: userInfo.isAdmin || false,
            systemType: userInfo.sysType?.toString() || '',
            role: userInfo.role,
            roleEn: userInfo.roleEn,
            avatar: userInfo.avatar,
            menus: userInfo.menus,
            functionPoints: userInfo.functionPoints,
            customerList: userInfo.customerList,
            balance: userInfo.balance,
            freightBalance: userInfo.freightBalance,
            tenant: userInfo.tenant,
          };
        
        // 如果当前用户为空，设置新用户
        if (!user) {
          setUser(extendedUser);
        }
        
        // 根据权限过滤路由
        const filtered = filterRoutesByPermission(
          userInfo.menus || [], 
          userInfo.functionPoints || []
        );
        setFilteredRoutes(filtered);
        
        console.log('刷新后的过滤路由数量:', filtered.length);
        
        // 生成侧边栏菜单
        const menus = generateSidebarMenus(filtered);
        setSidebarMenus(menus);
        
        console.log('=== 用户信息刷新完成 ===');
        console.log('用户systemType:', userInfo.sysType, '类型:', typeof userInfo.sysType);
        console.log('设置到用户的systemType:', userInfo.sysType?.toString() || '');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果获取失败，重置权限信息
      setFilteredRoutes([]);
      setSidebarMenus([]);
      
      // 如果是401错误，清除认证信息
      if (error && (error as any).status === 401) {
        signOut();
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('=== AuthContext 初始化开始 ===');
      setLoading(true);
      
      // 检查localStorage中是否有已保存的token和用户信息
      const savedToken = localStorage.getItem('authToken');
      const savedUserInfo = localStorage.getItem('userInfo');
      
      console.log('localStorage状态:', {
        hasToken: !!savedToken,
        hasUserInfo: !!savedUserInfo
      });
      
      if (savedToken && savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          setUser(userInfo);
          setToken(savedToken);
          console.log('设置用户信息成功:', userInfo.name);
          
          // 获取完整的用户信息和权限
          await refreshUserInfo();
        } catch (error) {
          console.error('解析用户信息失败:', error);
          // 清除无效的数据
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('refreshToken');
        }
      } else {
        console.log('未找到有效的认证信息');
      }
      
      // 无论成功还是失败，都要结束加载状态
      setLoading(false);
      console.log('=== AuthContext 初始化完成 ===');
    };

    initializeAuth();
  }, []);

  const signIn = async (user: CustomUser, token: string) => {
    setUser(user);
    setToken(token);
    
    // 保存到localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user));
    
    // 获取完整的用户信息和权限
    await refreshUserInfo();
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    setUserInfo(null);
    setFilteredRoutes([]);
    setSidebarMenus([]);
    
    // 清除localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('refreshToken');
    
    navigate("/login");
  };

  // 检查权限
  const hasPermission = (code: string): boolean => {
    if (!userInfo) return false;
    
    // 检查菜单权限（包括分组、菜单、功能点）
    const hasMenuPermission = userInfo.menus?.some(menu => 
      menu.code === code && (menu.resourceType === 1 || menu.resourceType === 2 || menu.resourceType === 3)
    ) || false;
    
    // 检查功能点权限（包括 functionPoints 数组）
    const hasFunctionPermission = userInfo.functionPoints?.includes(code) || false;
    
    return hasMenuPermission || hasFunctionPermission;
  };

  // 检查路由权限
  const hasRoutePermissionFn = (routePath: string): boolean => {
    if (!userInfo) return false;
    return hasRoutePermission(
      routePath, 
      userInfo.menus || [], 
      userInfo.functionPoints || []
    );
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
        isAuthenticated,
        refreshUserInfo,
        filteredRoutes,
        sidebarMenus,
        hasPermission,
        hasRoutePermission: hasRoutePermissionFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// 导出权限检查Hook
export const usePermission = () => {
  const { hasPermission, hasRoutePermission } = useAuth();
  
  return {
    hasPermission,
    hasRoutePermission,
  };
};