// 测试订单列表功能的简单脚本
// 在浏览器控制台中运行

console.log('=== 订单列表功能测试脚本 ===');

// 1. 检查当前页面
console.log('当前页面URL:', window.location.href);
if (window.location.href.includes('/orders/express')) {
  console.log('✓ 在快递订单页面');
} else {
  console.log('❌ 不在快递订单页面，请先导航到 /dashboard/orders/express');
}

// 2. 检查组件是否加载
console.log('检查DOM元素...');
const tabsElement = document.querySelector('[role="tablist"]');
const tableElement = document.querySelector('table');
const filterButton = document.querySelector('button:has(.filter-icon)');

if (tabsElement) {
  console.log('✓ 找到状态标签页');
} else {
  console.log('❌ 未找到状态标签页');
}

if (tableElement) {
  console.log('✓ 找到数据表格');
} else {
  console.log('❌ 未找到数据表格');
}

// 3. 模拟点击查询按钮
const queryButton = document.querySelector('button:has(.search-icon)');
if (queryButton) {
  console.log('✓ 找到查询按钮');
  console.log('提示：点击查询按钮开始测试API调用');
} else {
  console.log('❌ 未找到查询按钮');
}

// 4. 监听网络请求
console.log('开始监听网络请求...');
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  if (typeof url === 'string' && url.includes('/api/v1/Order/GetList')) {
    console.log('🔍 检测到订单列表API请求:', url);
    console.log('请求参数:', options ? JSON.parse(options.body) : 'N/A');
    
    return originalFetch.apply(this, args).then(response => {
      console.log('📥 API响应状态:', response.status);
      return response.clone().json().then(data => {
        console.log('📥 API响应数据:', data);
        return response;
      });
    }).catch(error => {
      console.error('❌ API请求失败:', error);
      throw error;
    });
  }
  return originalFetch.apply(this, args);
};

console.log('=== 测试脚本启动完成 ===');
console.log('操作指南：');
console.log('1. 点击"高级筛选"展开筛选面板');
console.log('2. 设置筛选条件（可选）');
console.log('3. 点击"查询"按钮测试API调用');
console.log('4. 观察控制台输出和网络请求');
console.log('5. 测试分页、排序、状态切换等功能');