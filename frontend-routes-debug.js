// 前端实际路由代码列表（用于与后端权限数据对比）

// 一级菜单路由（父级路由）
const parentRoutes = [
  'dashboard',           // 仪表板
  'orders',              // 订单管理  
  'finance',             // 财务管理
  'coupons',             // 优惠券管理
  'tickets',             // 工单系统
  'settings',            // 系统设置
  'carrier',             // 承运商管理
  'logistics',           // 物流管理
  'truck',               // 货运专项
  'contracts',           // 合同管理
  'knowledge',           // 知识库
  'notifications',       // 通知管理
  'emails',              // 邮件管理
  'users',               // 用户管理
];

// 二级菜单路由（子级路由）
const childRoutes = [
  // 订单管理子菜单
  'truck-orders',                    // 货运订单
  'express-orders',                  // 快递订单
  'create-express-order',            // 创建快递订单
  'return-orders',                   // 退货订单
  'create-return-order',            // 创建退货订单
  'create-order',                   // 创建订单
  'quote-results',                  // 报价结果
  'order-details',                  // 订单详情
  'order-confirmation',             // 订单确认
  'order-detail-view',              // 订单详情视图
  
  // 财务管理子菜单
  'finance-overview',               // 财务概览
  'finance-quotations',             // 财务报价
  'finance-transactions',           // 交易记录
  'finance-rebills',                // 重开账单
  'freight-difference',             // 运费差异
  
  // 工单系统子菜单
  'ticket-management',              // 工单管理
  'ticket-detail',                  // 工单详情
  
  // 系统设置子菜单
  'settings-overview',              // 设置概览
  'address-management',             // 地址管理
  'address-zone-config',            // 地址区域配置
  
  // 承运商管理子菜单
  'carrier-accounts',              // 承运商账户
  'carrier-templates',              // 定价模板
  'carrier-template-new',           // 新建定价模板
  'carrier-template-edit',          // 编辑定价模板
  'carrier-costs',                  // 账户成本
  'carrier-cost-new',               // 新建账户成本
  'carrier-cost-edit',              // 编辑账户成本
  'carrier-comparison',             // 价格比较
  'carrier-remote-areas',           // 偏远地区
  'carrier-rules',                  // 配送规则
  'carrier-customer-pricing',       // 客户定价
  'carrier-customer-pricing-new',   // 新建客户定价
  'carrier-customer-pricing-edit',  // 编辑客户定价
  'carrier-price-history',          // 价格历史
  
  // 物流管理子菜单
  'logistics-triggers',             // 物流触发器
  'logistics-services',             // 物流服务
  'logistics-remote-areas',         // 偏远地区
  'logistics-channels',             // 渠道配置
  
  // 货运专项子菜单
  'truck-carriers',                 // 货运承运商
  'truck-pricing',                  // 货运定价
  'truck-platform-warehouse',       // 平台仓库定价
  'truck-platform-warehouse-detail', // 平台仓库定价详情
  'truck-zip-region',               // 邮编区域映射
  
  // 合同管理子菜单
  'contract-management',            // 合同管理
  'agreement-management',           // 协议管理
];

// 所有前端路由代码（用于对比）
const allFrontendRouteCodes = [
  ...parentRoutes,
  ...childRoutes
];

console.log('=== 前端路由代码列表 ===');
console.log('一级菜单路由代码:', parentRoutes);
console.log('二级菜单路由代码:', childRoutes);
console.log('所有前端路由代码:', allFrontendRouteCodes);
console.log('前端路由总数:', allFrontendRouteCodes.length);

export { parentRoutes, childRoutes, allFrontendRouteCodes };