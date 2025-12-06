export const translations = {
  zh: {
    // Common
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    search: "搜索",
    filter: "筛选",
    loading: "加载中...",
    noData: "暂无数据",
    
    // Auth
    login: "登录",
    register: "注册",
    logout: "退出登录",
    email: "邮箱",
    password: "密码",
    forgotPassword: "忘记密码",
    
    // Dashboard
    dashboard: "首页",
    orders: "订单列表",
    finance: "财务",
    settings: "配置",
    tickets: "工单管理",
    products: "产品模块",
    
    // Customer specific
    balance: "账户余额",
    creditLimit: "信用额度",
    paymentTerms: "账期",
    announcements: "公告与通知",
    
    // Admin specific
    customerManagement: "客户管理",
    userManagement: "用户配置",
    revenueExpenses: "收支看板",
    overduePayments: "欠款看板",
    costProfit: "成本与利润",
  },
  en: {
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    loading: "Loading...",
    noData: "No Data",
    
    // Auth
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password",
    
    // Dashboard
    dashboard: "Dashboard",
    orders: "Orders",
    finance: "Finance",
    settings: "Settings",
    tickets: "Tickets",
    products: "Products",
    
    // Customer specific
    balance: "Balance",
    creditLimit: "Credit Limit",
    paymentTerms: "Payment Terms",
    announcements: "Announcements",
    
    // Admin specific
    customerManagement: "Customer Management",
    userManagement: "User Management",
    revenueExpenses: "Revenue & Expenses",
    overduePayments: "Overdue Payments",
    costProfit: "Cost & Profit",
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.zh;