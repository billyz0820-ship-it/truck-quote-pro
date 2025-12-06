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
import { authApi } from "@/utils/api";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userName: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isLoading, setIsLoading] = useState(false);
  const loginUser = async (userName: string, password: string) => {
    try {
      const data = await authApi.login({ userName, password });
      
      // 可以在这里保存token到localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginUser(formData.userName, formData.password);
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
          <CardTitle className="text-2xl text-slate-800">{t("login")}</CardTitle>
          <CardDescription className="text-slate-500">
            欢迎回来，请登录您的账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入您的邮箱"
                value={formData.userName}
                onChange={(e) => handleInputChange("userName", e.target.value)}
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
            </div>
            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
              disabled={loading}
            >
              {loading ? t("loading") : t("login")}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              还没有账户？{" "}
              <Link to="/register" className="text-blue-500 hover:text-blue-600 hover:underline">
                {t("register")}
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
