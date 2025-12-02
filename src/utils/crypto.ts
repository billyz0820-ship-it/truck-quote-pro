// 对称加密工具类
const SECRET_KEY = '0123456789abcdef';

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
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码
 */
export const encryptPassword = (password: string): string => {
  if (!password) return '';
  return xorEncrypt(password);
};

/**
 * 解密密码（仅用于测试，实际应用中不应该解密密码）
 * @param encryptedPassword 加密的密码
 * @returns 解密后的密码
 */
export const decryptPassword = (encryptedPassword: string): string => {
  if (!encryptedPassword) return '';
  return xorDecrypt(encryptedPassword);
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