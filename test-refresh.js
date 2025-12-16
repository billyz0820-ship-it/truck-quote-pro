// 测试页面刷新时的用户信息获取
// 在浏览器控制台中运行此脚本来测试

console.log('=== 测试页面刷新 ===');

// 检查 localStorage 状态
const token = localStorage.getItem('authToken');
const userInfo = localStorage.getItem('userInfo');

console.log('Token 存在:', !!token);
console.log('UserInfo 存在:', !!userInfo);

if (token && userInfo) {
  console.log('用户信息:', JSON.parse(userInfo));
  
  // 模拟调用 API 获取用户信息
  fetch('/api/v1/User/GetLoginUserInfo', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('API 响应状态:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API 响应数据:', data);
  })
  .catch(error => {
    console.error('API 调用失败:', error);
  });
} else {
  console.log('用户未登录，无法测试');
}

console.log('=== 测试结束 ===');