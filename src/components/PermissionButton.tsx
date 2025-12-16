import React from 'react';
import { usePermission } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface PermissionButtonProps {
  children: React.ReactNode;
  permission?: string;
  requireRoutePermission?: string;
  fallback?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  permission,
  requireRoutePermission,
  fallback = null,
  className,
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  ...props
}) => {
  const { hasPermission, hasRoutePermission } = usePermission();

  // 检查权限
  const hasRequiredPermission = 
    (!permission || hasPermission(permission)) &&
    (!requireRoutePermission || hasRoutePermission(requireRoutePermission));

  if (!hasRequiredPermission) {
    return <>{fallback}</>;
  }

  return (
    <Button
      className={className}
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

// 权限检查包装器组件
interface PermissionWrapperProps {
  children: React.ReactNode;
  permission?: string;
  requireRoutePermission?: string;
  fallback?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permission,
  requireRoutePermission,
  fallback = null
}) => {
  const { hasPermission, hasRoutePermission } = usePermission();

  const hasRequiredPermission = 
    (!permission || hasPermission(permission)) &&
    (!requireRoutePermission || hasRoutePermission(requireRoutePermission));

  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
};