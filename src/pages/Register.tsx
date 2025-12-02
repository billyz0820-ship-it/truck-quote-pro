import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">北美卡车经纪</span>
          </div>
          <CardTitle className="text-2xl">创建账户</CardTitle>
          <CardDescription>
            注册您的账户以开始使用我们的服务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="company">公司名称</Label>
              <Input
                id="company"
                placeholder="请输入公司名称"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">联系人姓名</Label>
              <Input
                id="name"
                placeholder="请输入您的姓名"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入您的邮箱"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">电话号码</Label>
              <Input
                id="phone"
                placeholder="请输入您的电话"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
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
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent">
              注册
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              已有账户？{" "}
              <Link to="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;