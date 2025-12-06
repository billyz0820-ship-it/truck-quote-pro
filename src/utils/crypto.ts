// 对称加密工具类
const SECRET_KEY = '0123456789abcdef';
const AES_KEY = '0123456789abcdef'; // AES密钥 (16 bytes for AES-128)
const AES_IV = '0123456789abcdef';  // AES初始化向量 (16 bytes)

/**
 * 简单的XOR对称加密
 * @param text 要加密的文本
 * @param key 加密密钥
 * @returns 加密后的十六进制字符串
 */
export const xorEncrypt = (text: string, key: string = SECRET_KEY): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    const encrypted = charCode ^ keyChar;
    result += encrypted.toString(16).padStart(2, '0');
  }
  return result;
};

/**
 * 简单的XOR对称解密
 * @param hexText 加密的十六进制字符串
 * @param key 解密密钥
 * @returns 解密后的文本
 */
export const xorDecrypt = (hexText: string, key: string = SECRET_KEY): string => {
  let result = '';
  for (let i = 0; i < hexText.length; i += 2) {
    const hex = hexText.substr(i, 2);
    const charCode = parseInt(hex, 16);
    const keyChar = key.charCodeAt(Math.floor(i / 2) % key.length);
    const decrypted = charCode ^ keyChar;
    result += String.fromCharCode(decrypted);
  }
  return result;
};

/**
 * AES加密（Web Crypto API版本，与C#版本完全兼容）
 * @param plainText 需要加密的文本
 * @returns 加密后的Base64字符串
 */
export const aesEncrypt = async (plainText: string): Promise<string> => {
  if (!plainText) return '';
  
  try {
    // 将密钥和IV转换为字节数组（与C#的Encoding.UTF8.GetBytes对应）
    const keyData = new TextEncoder().encode(AES_KEY);
    const ivData = new TextEncoder().encode(AES_IV);
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );
    
    // 将明文转换为字节数组（与C#的Encoding.UTF8.GetBytes对应）
    const plainBytes = new TextEncoder().encode(plainText);
    
    // 执行加密（使用AES-CBC模式，与C#的AES.Create()默认设置对应）
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: ivData
      },
      cryptoKey,
      plainBytes
    );
    
    // 将结果转换为Base64（与C#的Convert.ToBase64String对应）
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    return btoa(String.fromCharCode(...encryptedBytes));
  } catch (error) {
    console.error('AES加密失败:', error);
    throw new Error('加密失败');
  }
};

/**
 * AES解密（Web Crypto API版本，与C#版本完全兼容）
 * @param encryptedText 需要解密的Base64文本
 * @returns 解密后的文本
 */
export const aesDecrypt = async (encryptedText: string): Promise<string> => {
  if (!encryptedText) return '';
  
  try {
    // 将密钥和IV转换为字节数组（与C#的Encoding.UTF8.GetBytes对应）
    const keyData = new TextEncoder().encode(AES_KEY);
    const ivData = new TextEncoder().encode(AES_IV);
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    // 将Base64字符串转换为字节数组（与C#的Convert.FromBase64String对应）
    const encryptedBytes = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // 执行解密
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: ivData
      },
      cryptoKey,
      encryptedBytes
    );
    
    // 将结果转换为UTF-8字符串（与C#的Encoding.UTF8.GetString对应）
    const decryptedBytes = new Uint8Array(decryptedBuffer);
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error('AES解密失败:', error);
    // 如果解密失败，返回原始文本（与C#的catch块对应）
    return encryptedText;
  }
};

/**
 * AES加密（同步版本，使用简单的实现作为fallback）
 * @param plainText 需要加密的文本
 * @returns 加密后的Base64字符串
 */
export const aesEncryptSync = (plainText: string): string => {
  if (!plainText) return '';
  
  // 简化的AES-like加密实现（作为fallback）
  // 注意：这不是真正的AES，但在没有Web Crypto API的环境中可以作为备选
  const key = AES_KEY;
  const iv = AES_IV;
  let result = '';
  
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    const ivChar = iv.charCodeAt(i % iv.length);
    const encrypted = charCode ^ keyChar ^ ivChar;
    result += String.fromCharCode(encrypted);
  }
  
  return btoa(result);
};

/**
 * 加密密码（使用AES加密，与C#后端完全兼容）
 * @param password 明文密码
 * @returns 加密后的密码（Base64字符串）
 */
export const encryptPassword = async (password: string): Promise<string> => {
  if (!password) return '';
  
  try {
    // 使用AES加密（与C#的AESHelper.Encrypt方法完全兼容）
    return await aesEncrypt(password);
  } catch (error) {
    console.error('AES加密失败:', error);
    throw new Error('密码加密失败');
  }
};

/**
 * 解密密码（用于测试验证，与C#的AESHelper.Decrypt方法完全兼容）
 * @param encryptedPassword 加密的Base64密码
 * @returns 解密后的明文密码
 */
export const decryptPassword = async (encryptedPassword: string): Promise<string> => {
  if (!encryptedPassword) return '';
  
  try {
    // 使用AES解密（与C#的AESHelper.Decrypt方法完全兼容）
    const decrypted = await aesDecrypt(encryptedPassword);
    // 移除可能的引号（与C#的.Replace("\"", "")对应）
    return decrypted.replace(/"/g, '');
  } catch (error) {
    console.error('AES解密失败:', error);
    // 如果解密失败，返回原始文本（与C#的catch块对应）
    return encryptedPassword;
  }
};



/**
 * 生成随机盐值
 * @param length 盐值长度
 * @returns 随机盐值
 */
export const generateSalt = (length: number = 16): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 密码加盐加密
 * @param password 明文密码
 * @param salt 盐值
 * @returns 加密后的密码
 */
export const encryptPasswordWithSalt = (password: string, salt?: string): { encrypted: string; salt: string } => {
  const actualSalt = salt || generateSalt();
  const passwordWithSalt = password + actualSalt;
  const encrypted = xorEncrypt(passwordWithSalt);
  return { encrypted, salt: actualSalt };
};