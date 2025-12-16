import type { ResourceInfoForMenuResponse, UserInfoResponse } from '@/types/user';

// 静态路由配置（所有可能的路由）
export const staticRoutes = [
  // 仪表板
  {
    path: '/dashboard',
    component: 'Dashboard',
    code: 'dashboard',
    title: '仪表板',
    icon: 'Dashboard',
    orderIndex: 1,
  },
  
  // 订单管理
  {
    path: '/dashboard/orders',
    code: 'orders',
    title: '订单管理',
    icon: 'ShoppingCart',
    orderIndex: 2,
    children: [
      { path: '/dashboard/orders/truck', component: 'TruckOrders', code: 'truck-orders', title: '货运订单' },
      { path: '/dashboard/orders/express', component: 'ExpressOrders', code: 'express-orders', title: '快递订单' },
      { path: '/dashboard/orders/express/new', component: 'CreateExpressOrderPage', code: 'create-express-order', title: '创建快递订单' },
      { path: '/dashboard/orders/return', component: 'ReturnOrders', code: 'return-orders', title: '退货订单' },
      { path: '/dashboard/orders/return/new', component: 'CreateReturnOrderPage', code: 'create-return-order', title: '创建退货订单' },
      { path: '/dashboard/orders/create', component: 'CreateOrder', code: 'create-order', title: '创建订单' },
      { path: '/dashboard/orders/quote', component: 'QuoteResults', code: 'quote-results', title: '报价结果' },
      { path: '/dashboard/orders/confirm', component: 'OrderDetails', code: 'order-details', title: '订单详情' },
      { path: '/dashboard/orders/order-confirm', component: 'OrderConfirmation', code: 'order-confirmation', title: '订单确认' },
      { path: '/dashboard/orders/:id', component: 'OrderDetailView', code: 'order-detail-view', title: '订单详情视图' },
    ]
  },
  
  // 财务管理
  {
    path: '/dashboard/finance',
    code: 'finance',
    title: '财务管理',
    icon: 'DollarSign',
    orderIndex: 3,
    children: [
      { path: '/dashboard/finance', component: 'Finance', code: 'finance-overview', title: '财务概览' },
      { path: '/dashboard/finance/quotations', component: 'FinanceQuotations', code: 'finance-quotations', title: '财务报价' },
      { path: '/dashboard/finance/transactions', component: 'TransactionRecords', code: 'finance-transactions', title: '交易记录' },
      { path: '/dashboard/finance/rebills', component: 'RebillManagement', code: 'finance-rebills', title: '重开账单' },
      { path: '/dashboard/finance/freight-difference', component: 'FreightDifference', code: 'freight-difference', title: '运费差异' },
    ]
  },
  
  // 优惠券管理
  {
    path: '/dashboard/coupons',
    component: 'CouponManagement',
    code: 'coupons',
    title: '优惠券管理',
    icon: 'Tag',
    orderIndex: 4,
  },
  
  // 工单系统
  {
    path: '/dashboard/tickets',
    code: 'tickets',
    title: '工单系统',
    icon: 'HelpCircle',
    orderIndex: 5,
    children: [
      { path: '/dashboard/tickets', component: 'TicketManagement', code: 'ticket-management', title: '工单管理' },
      { path: '/dashboard/tickets/:id', component: 'TicketDetail', code: 'ticket-detail', title: '工单详情' },
    ]
  },
  
  // 系统设置
  {
    path: '/dashboard/settings',
    code: 'settings',
    title: '系统设置',
    icon: 'Settings',
    orderIndex: 6,
    children: [
      { path: '/dashboard/settings', component: 'Settings', code: 'settings-overview', title: '设置概览' },
      { path: '/dashboard/settings/addresses', component: 'AddressManagement', code: 'address-management', title: '地址管理' },
      { path: '/dashboard/settings/addresses/:addressId/zones', component: 'AddressZoneConfig', code: 'address-zone-config', title: '地址区域配置' },
    ]
  },
  
  // 承运商管理
  {
    path: '/dashboard/carrier',
    code: 'carrier',
    title: '承运商管理',
    icon: 'Truck',
    orderIndex: 7,
    children: [
      { path: '/dashboard/carrier/accounts', component: 'CarrierAccounts', code: 'carrier-accounts', title: '承运商账户' },
      { path: '/dashboard/carrier/templates', component: 'PricingTemplates', code: 'carrier-templates', title: '定价模板' },
      { path: '/dashboard/carrier/templates/new', component: 'PricingTemplateEdit', code: 'carrier-template-new', title: '新建定价模板' },
      { path: '/dashboard/carrier/templates/:id', component: 'PricingTemplateEdit', code: 'carrier-template-edit', title: '编辑定价模板' },
      { path: '/dashboard/carrier/costs', component: 'AccountCosts', code: 'carrier-costs', title: '账户成本' },
      { path: '/dashboard/carrier/costs/:accountId/new', component: 'AccountCostEdit', code: 'carrier-cost-new', title: '新建账户成本' },
      { path: '/dashboard/carrier/costs/:accountId/:costId', component: 'AccountCostEdit', code: 'carrier-cost-edit', title: '编辑账户成本' },
      { path: '/dashboard/carrier/comparison', component: 'PriceComparison', code: 'carrier-comparison', title: '价格比较' },
      { path: '/dashboard/carrier/remote-areas', component: 'RemoteAreas', code: 'carrier-remote-areas', title: '偏远地区' },
      { path: '/dashboard/carrier/rules', component: 'ShippingRules', code: 'carrier-rules', title: '配送规则' },
      { path: '/dashboard/carrier/customer-pricing', component: 'CustomerPricing', code: 'carrier-customer-pricing', title: '客户定价' },
      { path: '/dashboard/carrier/customer-pricing/new', component: 'CustomerPricingEdit', code: 'carrier-customer-pricing-new', title: '新建客户定价' },
      { path: '/dashboard/carrier/customer-pricing/:id', component: 'CustomerPricingEdit', code: 'carrier-customer-pricing-edit', title: '编辑客户定价' },
      { path: '/dashboard/carrier/price-history', component: 'PriceHistory', code: 'carrier-price-history', title: '价格历史' },
    ]
  },
  
  // 物流管理
  {
    path: '/dashboard/logistics',
    code: 'logistics',
    title: '物流管理',
    icon: 'Package',
    orderIndex: 8,
    children: [
      { path: '/dashboard/logistics/triggers', component: 'LogisticsTriggers', code: 'logistics-triggers', title: '物流触发器' },
      { path: '/dashboard/logistics/services', component: 'LogisticsServices', code: 'logistics-services', title: '物流服务' },
      { path: '/dashboard/logistics/remote-areas', component: 'RemoteAreas', code: 'logistics-remote-areas', title: '偏远地区' },
      { path: '/dashboard/logistics/channels', component: 'ChannelConfigs', code: 'logistics-channels', title: '渠道配置' },
    ]
  },
  
  // 货运专项管理
  {
    path: '/dashboard/truck',
    code: 'truck',
    title: '货运专项',
    icon: 'Truck',
    orderIndex: 9,
    children: [
      { path: '/dashboard/truck/carriers', component: 'TruckCarrierManagement', code: 'truck-carriers', title: '货运承运商' },
      { path: '/dashboard/truck/pricing/:carrierId', component: 'TruckCarrierPricing', code: 'truck-pricing', title: '货运定价' },
      { path: '/dashboard/truck/platform-warehouse', component: 'PlatformWarehousePricing', code: 'truck-platform-warehouse', title: '平台仓库定价' },
      { path: '/dashboard/truck/platform-warehouse/:pricingName', component: 'PlatformWarehousePricingDetail', code: 'truck-platform-warehouse-detail', title: '平台仓库定价详情' },
      { path: '/dashboard/truck/zip-region', component: 'ZipRegionMapping', code: 'truck-zip-region', title: '邮编区域映射' },
    ]
  },
  
  // 合同管理
  {
    path: '/dashboard/contracts',
    code: 'contracts',
    title: '合同管理',
    icon: 'FileText',
    orderIndex: 10,
    children: [
      { path: '/dashboard/contracts', component: 'ContractManagement', code: 'contract-management', title: '合同管理' },
      { path: '/dashboard/agreements', component: 'AgreementManagement', code: 'agreement-management', title: '协议管理' },
    ]
  },
  
  // 知识库
  {
    path: '/dashboard/knowledge',
    component: 'KnowledgeBase',
    code: 'knowledge',
    title: '知识库',
    icon: 'Book',
    orderIndex: 11,
  },
  
  // 通知管理
  {
    path: '/dashboard/notifications',
    component: 'NotificationManagement',
    code: 'notifications',
    title: '通知管理',
    icon: 'Bell',
    orderIndex: 12,
  },
  
  // 邮件管理
  {
    path: '/dashboard/emails',
    component: 'EmailManagement',
    code: 'emails',
    title: '邮件管理',
    icon: 'Mail',
    orderIndex: 13,
  },
  
  // 用户管理
  {
    path: '/dashboard/users',
    component: 'UserManagement',
    code: 'users',
    title: '用户管理',
    icon: 'Users',
    orderIndex: 14,
  },
];

// 根据用户权限过滤路由
export const filterRoutesByPermission = (
  userMenus: ResourceInfoForMenuResponse[],
  userFunctionPoints: string[] = []
): typeof staticRoutes => {
  console.log('=== 路由权限过滤调试开始 ===');
  
  // 从 menus 数组中提取所有权限代码（包括菜单分组、菜单、功能点）
  const permittedMenuCodes = new Set(
    userMenus
      .filter(menu => menu.resourceType === 1 || menu.resourceType === 2 || menu.resourceType === 3) // 取所有类型
      .map(menu => menu.code)
      .filter(Boolean)
  );

  // 获取用户有权限的功能点（合并 functionPoints 数组和 menus 中的功能点）
  const permittedFunctionPoints = new Set([
    ...userFunctionPoints,
    // 从 menus 数组中提取功能点（resourceType === 3）
    ...userMenus
      .filter(menu => menu.resourceType === 3)
      .map(menu => menu.code)
      .filter(Boolean)
  ]);

  console.log('=== 前端路由配置对比 ===');
  console.log('前端静态路由数量:', staticRoutes.length);
  console.log('前端静态路由代码:', staticRoutes.map(r => r.code));
  console.log('');
  console.log('=== 后端权限数据分析 ===');
  console.log('menus 数组总数:', userMenus.length);
  console.log('menus 中分组数量 (resourceType=1):', userMenus.filter(m => m.resourceType === 1).length);
  console.log('menus 中菜单数量 (resourceType=2):', userMenus.filter(m => m.resourceType === 2).length);
  console.log('menus 中功能点数量 (resourceType=3):', userMenus.filter(m => m.resourceType === 3).length);
  console.log('functionPoints 数组数量:', userFunctionPoints.length);
  console.log('');
  console.log('=== 合并后的权限数据 ===');
  console.log('所有菜单权限代码:', Array.from(permittedMenuCodes));
  console.log('所有功能点权限:', Array.from(permittedFunctionPoints));
  console.log('');
  
  // 检查匹配情况
  const matchedRoutes = staticRoutes.filter(route => 
    route.code && permittedMenuCodes.has(route.code)
  );
  const unmatchedRoutes = staticRoutes.filter(route => 
    route.code && !permittedMenuCodes.has(route.code)
  );
  
  console.log('=== 权限匹配分析 ===');
  console.log('匹配的静态路由:', matchedRoutes.map(r => ({ code: r.code, title: r.title })));
  console.log('未匹配的静态路由:', unmatchedRoutes.map(r => ({ code: r.code, title: r.title })));
  console.log('=== 路由权限过滤调试结束 ===');

  const filteredRoutes = staticRoutes
    .filter(route => {
      // 检查菜单权限
      const hasMenuPermission = route.code ? permittedMenuCodes.has(route.code) : true;
      
      // 如果没有子路由，直接检查菜单权限
      if (!route.children) {
        return hasMenuPermission;
      }
      
      // 如果有子路由，递归过滤子路由
      route.children = route.children.filter(child => {
        const childHasPermission = child.code ? 
          (permittedMenuCodes.has(child.code) || permittedFunctionPoints.has(child.code)) : 
          true;
        
        // 临时绕过 create-express-order 权限检查
        if (child.code === 'create-express-order') {
          console.log('✅ 临时允许 create-express-order 路由通过权限检查');
          return true;
        }
        
        return childHasPermission;
      });
      
      // 父路由如果有权限的子路由，则保留
      return hasMenuPermission || route.children.length > 0;
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  // 生成侧边栏菜单用于调试
  const sidebarMenus = generateSidebarMenus(filteredRoutes);
  
  // 提取所有菜单代码（包括父菜单和子菜单）
  const allMenuCodes = [];
  filteredRoutes.forEach(route => {
    if (route.code) allMenuCodes.push(route.code);
    if (route.children) {
      route.children.forEach(child => {
        if (child.code) allMenuCodes.push(child.code);
      });
    }
  });

  // 调试信息
  console.log('过滤后的路由数量:', filteredRoutes.length);
  console.log('过滤后的路由:', filteredRoutes.map(r => ({ code: r.code, title: r.title, childrenCount: r.children?.length || 0 })));
  console.log('');
  console.log('=== 前端菜单代码列表 ===');
  console.log('父菜单代码:', filteredRoutes.filter(r => r.code).map(r => r.code));
  console.log('子菜单代码:', filteredRoutes.flatMap(r => r.children?.filter(c => c.code).map(c => c.code) || []));
  console.log('所有菜单代码:', allMenuCodes);
  console.log('生成侧边栏菜单结构:', JSON.stringify(sidebarMenus, null, 2));
  console.log('=== 前端菜单代码结束 ===');

  return filteredRoutes;
};

// 生成侧边栏菜单
export const generateSidebarMenus = (routes: typeof staticRoutes) => {
  return routes.map(route => {
    const menu: any = {
      title: route.title,
      icon: route.icon,
      code: route.code,
      orderIndex: route.orderIndex,
    };

    if (route.children && route.children.length > 0) {
      menu.children = route.children.map(child => ({
        title: child.title,
        path: child.path,
        code: child.code,
      }));
      menu.type = 'group';
    } else {
      menu.path = route.path;
      menu.type = 'menu';
    }

    return menu;
  });
};

// 检查路由权限
export const hasRoutePermission = (
  routePath: string,
  userMenus: ResourceInfoForMenuResponse[],
  userFunctionPoints: string[] = []
): boolean => {
  const route = staticRoutes.find(r => r.path === routePath || r.children?.some(c => c.path === routePath));
  
  if (!route) return false;

  const targetRoute = route.children?.find(c => c.path === routePath) || route;
  const routeCode = targetRoute.code;

  if (!routeCode) return true;

  // 检查菜单权限（包括分组、菜单、功能点）
  const hasMenuPermission = userMenus
    .filter(menu => menu.resourceType === 1 || menu.resourceType === 2 || menu.resourceType === 3)
    .some(menu => menu.code === routeCode);

  // 检查功能点权限（合并 functionPoints 和 menus 中的功能点）
  const allFunctionPoints = [
    ...userFunctionPoints,
    ...userMenus.filter(menu => menu.resourceType === 3).map(menu => menu.code).filter(Boolean)
  ];
  const hasFunctionPermission = allFunctionPoints.includes(routeCode);

  return hasMenuPermission || hasFunctionPermission;
};