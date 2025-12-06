import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { authApi } from "@/utils/api";

// 密码强度验证函数
const validatePassword = (password: string): { isValid: boolean; strength: string; message: string } => {
  if (password.length < 6 || password.length > 18) {
    return {
      isValid: false,
      strength: "weak",
      message: "密码长度必须在6-18位之间"
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      strength: "weak",
      message: "密码必须包含字母和数字"
    };
  }

  // 计算密码强度
  if (hasLetter && hasNumber && hasSpecial && password.length >= 12) {
    return {
      isValid: true,
      strength: "strong",
      message: "密码强度：强"
    };
  } else if (hasLetter && hasNumber && password.length >= 8) {
    return {
      isValid: true,
      strength: "medium",
      message: "密码强度：中"
    };
  } else {
    return {
      isValid: true,
      strength: "weak",
      message: "密码强度：弱"
    };
  }
};

const Register = () => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
    invitationCode: ""
  });
  const [passwordStrength, setPasswordStrength] = useState<{ strength: string; message: string }>({ strength: "", message: "" });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 如果是密码字段，实时验证密码强度
    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordStrength({
        strength: validation.strength,
        message: validation.message
      });
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const registerUser = async (userData: any) => {
    try {
      const data = await authApi.register(userData);
      
      // 可以在这里保存token到localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 验证密码格式
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.message);
      setIsLoading(false);
      return;
    }

    // 验证密码是否匹配
    if (formData.password !== formData.confirmPassword) {
      alert("密码和确认密码不匹配");
      setIsLoading(false);
      return;
    }

    try {
      await registerUser(formData);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50" />
      
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">智运物流</span>
          </div>
          <CardTitle className="text-2xl text-slate-800">{t("register")}</CardTitle>
          <CardDescription className="text-slate-500">创建您的账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="companyName" className="text-slate-700">公司名称 *</Label>
              <Input
                id="companyName"
                placeholder="请输入公司名称"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-700">电话 *</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="flex-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={sendVerificationCode}
                  disabled={codeSent}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {codeSent ? "已发送" : "发送验证码"}
                </Button>
              </div>
            </div>
            {codeSent && (
              <div>
                <Label htmlFor="verificationCode" className="text-slate-700">验证码 *</Label>
                <Input
                  id="verificationCode"
                  placeholder="请输入验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-slate-700">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-700">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 'strong' ? 'w-full bg-green-500' :
                          passwordStrength.strength === 'medium' ? 'w-2/3 bg-yellow-500' :
                          passwordStrength.strength === 'weak' ? 'w-1/3 bg-red-500' : ''
                        }`}
                      />
                    </div>
                    <span className={`text-xs ${
                      passwordStrength.strength === 'strong' ? 'text-green-600' :
                      passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                      passwordStrength.strength === 'weak' ? 'text-red-600' : ''
                    }`}>
                      {passwordStrength.message}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    密码要求：6-18位，必须包含字母和数字
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-slate-700">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="invitationCode" className="text-slate-700">邀请码 (可选)</Label>
              <Input
                id="invitationCode"
                placeholder="如有邀请码请输入"
                value={formData.invitationCode}
                onChange={(e) => handleInputChange("invitationCode", e.target.value)}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
              disabled={loading}
            >
              {loading ? "注册中..." : t("register")}
            </Button>
            <div className="text-center text-sm text-slate-500 space-y-2">
              <Link to="/login" className="hover:text-blue-500 transition-colors block">
                已有账号？{t("login")}
              </Link>
              <Link to="/" className="hover:text-slate-600 transition-colors block text-slate-400">
                返回首页
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
