// API测试文件 - 用于验证修复和加密功能
import { api, authApi } from './api';
import { encryptPassword, decryptPassword, encryptPasswordWithSalt } from './crypto';

// 测试加密功能
export const testCrypto = () => {
  console.log('开始测试加密功能...');
  
  const testPassword = 'mypassword123';
  console.log('原始密码:', testPassword);
  
  // 测试基本加密
  const encrypted = encryptPassword(testPassword);
  console.log('加密后:', encrypted);
  
  const decrypted = decryptPassword(encrypted);
  console.log('解密后:', decrypted);
  
  // 验证加密解密是否正确
  const isCorrect = testPassword === decrypted;
  console.log('加密解密测试:', isCorrect ? '✅ 通过' : '❌ 失败');
  
  // 测试加盐加密
  const saltResult = encryptPasswordWithSalt(testPassword);
  console.log('加盐加密结果:', saltResult);
  
  return isCorrect;
};

// 测试API修复和加密
export const testApiFix = async () => {
  try {
    console.log('开始测试API修复和加密...');
    
    // 先测试加密功能
    const cryptoTest = testCrypto();
    if (!cryptoTest) {
      console.error('加密功能测试失败');
      return;
    }
    
    // 测试登录接口（密码会被自动加密）
    console.log('测试登录接口（密码已加密）...');
    const loginData = await authApi.login({
      userName: 'test@example.com',
      password: 'password123'
    });
    console.log('登录成功:', loginData);
    
    // 测试通用API
    console.log('测试通用GET接口...');
    const getData = await api.get('/test');
    console.log('GET成功:', getData);
    
    console.log('所有测试通过！');
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.message.includes('程序繁忙')) {
      console.log('✅ 成功捕获到固定格式错误:', error.message);
    }
  }
};

// 导出测试函数供开发时使用
export default testApiFix;