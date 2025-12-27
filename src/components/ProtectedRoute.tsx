import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
  requireRoutePermission?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requiredPermission,
  requireRoutePermission
}: ProtectedRouteProps) => {
  const { user, loading, hasPermission, hasRoutePermission } = useAuth();
  const location = useLocation();

  console.log('=== ProtectedRoute 权限检查 ===');
  console.log('当前路径:', location.pathname);
  console.log('requireRoutePermission:', requireRoutePermission);
  console.log('用户:', user?.name);
  console.log('loading:', loading);

  if (loading) {
    console.log('权限检查: 正在加载中...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('权限检查: 用户未登录，跳转到登录页');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    console.log('权限检查: 需要管理员权限但用户不是管理员，跳转到首页');
    return <Navigate to="/dashboard" replace />;
  }

  // 检查指定权限
  if (requiredPermission) {
    const hasPermissionResult = hasPermission(requiredPermission);
    console.log(`权限检查: 检查权限 ${requiredPermission}: ${hasPermissionResult}`);
    if (!hasPermissionResult) {
      console.log(`权限检查: 权限 ${requiredPermission} 被拒绝，跳转到首页`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 检查路由权限
  if (requireRoutePermission) {
    const hasRoutePermissionResult = hasRoutePermission(requireRoutePermission);
    console.log(`权限检查: 检查路由权限 ${requireRoutePermission}: ${hasRoutePermissionResult}`);
    
    if (!hasRoutePermissionResult) {
      console.log(`权限检查: 路由权限 ${requireRoutePermission} 被拒绝，跳转到首页`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 检查当前路由权限
  if (requireRoutePermission === undefined) {
    const hasCurrentRoutePermission = hasRoutePermission(location.pathname);
    console.log(`权限检查: 检查当前路径权限 ${location.pathname}: ${hasCurrentRoutePermission}`);
    
    if (!hasCurrentRoutePermission) {
      console.log(`权限检查: 当前路径权限 ${location.pathname} 被拒绝，跳转到首页`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('权限检查: 所有权限验证通过，渲染组件');
  return <>{children}</>;
};