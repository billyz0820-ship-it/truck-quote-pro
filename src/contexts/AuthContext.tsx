import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
}

interface AuthContextType {
  user: CustomUser | null;
  token: string | null;
  loading: boolean;
  signIn: (user: CustomUser, token: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查localStorage中是否有已保存的token和用户信息
    const savedToken = localStorage.getItem('authToken');
    const savedUserInfo = localStorage.getItem('userInfo');
    
    if (savedToken && savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        setUser(userInfo);
        setToken(savedToken);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        // 清除无效的数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('refreshToken');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (user: CustomUser, token: string) => {
    setUser(user);
    setToken(token);
    
    // 保存到localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user));
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    
    // 清除localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('refreshToken');
    
    navigate("/login");
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