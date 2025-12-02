// 登录测试文件 - 验证错误处理和加密
import { authApi } from './api';

// 测试登录错误处理
export const testLoginError = async () => {
  console.log('开始测试登录错误处理...');
  
  try {
    // 使用错误的用户名密码测试
    const result = await authApi.login({
      userName: 'wrong@example.com',
      password: 'wrongpassword'
    });
    console.log('意外成功:', result);
  } catch (error) {
    console.log('✅ 成功捕获登录错误:');
    console.log('错误信息:', error.message);
    console.log('错误状态:', (error as any).status);
    
    // 检查是否正确处理了 {"code":"504","message":" 账号或者密码错误,请重试","data":null,"isSuccess":false}
    if (error.message.includes('账号或者密码错误')) {
      console.log('✅ 正确识别了账号密码错误');
    } else {
      console.log('❌ 未能正确识别错误信息');
    }
  }
};

// 测试密码加密
export const testPasswordEncryption = () => {
  console.log('测试密码加密...');
  
  const testPassword = 'test123';
  console.log('原始密码:', testPassword);
  
  // 模拟API调用中的加密过程
  const encrypted = require('./crypto').encryptPassword(testPassword);
  console.log('加密后:', encrypted);
  
  // 验证加密结果
  if (encrypted && encrypted.length > 0) {
    console.log('✅ 密码加密成功');
  } else {
    console.log('❌ 密码加密失败');
  }
};

// 完整测试
export const runLoginTests = async () => {
  console.log('=== 开始登录功能测试 ===');
  
  // 测试加密
  testPasswordEncryption();
  
  // 测试错误处理
  await testLoginError();
  
  console.log('=== 登录功能测试完成 ===');
};

export default runLoginTests;