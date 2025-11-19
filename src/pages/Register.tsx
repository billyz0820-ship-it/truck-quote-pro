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
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendVerificationCode = async () => {
    if (!formData.phone) {
      toast({
        title: "请输入手机号",
        variant: "destructive",
      });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setCodeSent(true);
    
    console.log("验证码:", code);
    
    toast({
      title: "验证码已发送",
      description: `验证码: ${code} (开发模式)`,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.phone) {
      toast({
        title: "请填写必填项",
        description: "公司名称和电话为必填项",
        variant: "destructive",
      });
      return;
    }

    if (!codeSent || verificationCode !== sentCode) {
      toast({
        title: "验证码错误",
        description: "请输入正确的验证码",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "两次输入的密码不一致",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      let distributorId = null;
      if (formData.invitationCode) {
        const { data: distributor } = await supabase
          .from('distributors')
          .select('id')
          .eq('invitation_code', formData.invitationCode)
          .eq('status', 'active')
          .single();

        if (distributor) {
          distributorId = distributor.id;
        } else {
          toast({
            title: "邀请码无效",
            description: "请检查邀请码是否正确",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const authResult = await signUp(formData.email, formData.password);
      
      if (authResult.error) {
        toast({
          title: "注册失败",
          description: authResult.error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!authResult.data?.user) {
        toast({
          title: "注册失败",
          description: "无法创建用户",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const authData = authResult.data;

      const codeResult = await supabase.rpc('generate_customer_code');
      if (codeResult.error) throw codeResult.error;
      const customerCode = codeResult.data as string;

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          company_name: formData.companyName,
          phone: formData.phone,
          customer_code: customerCode || '',
          distributor_id: distributorId,
          customer_type: 'prepaid',
          status: 'active'
        })
        .select()
        .single();

      if (customerError) throw customerError;

      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'customer'
        });

      await supabase
        .from('customer_users')
        .insert({
          user_id: authData.user.id,
          customer_id: customer.id
        });

      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'registration_coupons')
        .single();

      interface CouponSettings {
        enabled: boolean;
        express_amount: number;
        truck_amount: number;
      }

      if (settings && (settings.setting_value as unknown as CouponSettings).enabled) {
        const couponSettings = settings.setting_value as unknown as CouponSettings;
        const generateCouponCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code = '';
          for (let i = 0; i < 12; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        };

        if (couponSettings.express_amount > 0) {
          await supabase
            .from('coupons')
            .insert({
              coupon_code: generateCouponCode(),
              amount: couponSettings.express_amount,
              customer_id: customer.id,
              coupon_type: 'express',
              created_by: authData.user.id,
              status: 'active'
            });
        }

        if (couponSettings.truck_amount > 0) {
          await supabase
            .from('coupons')
            .insert({
              coupon_code: generateCouponCode(),
              amount: couponSettings.truck_amount,
              customer_id: customer.id,
              coupon_type: 'truck',
              created_by: authData.user.id,
              status: 'active'
            });
        }
      }

      toast({
        title: "注册成功",
        description: "欢迎加入我们！",
      });

      navigate("/login");
      
    } catch (error: any) {
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">北美卡车经纪</span>
          </div>
          <CardTitle className="text-2xl">{t("register")}</CardTitle>
          <CardDescription>创建您的账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="companyName">公司名称 *</Label>
              <Input
                id="companyName"
                placeholder="请输入公司名称"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">电话 *</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={sendVerificationCode}
                  disabled={codeSent}
                >
                  {codeSent ? "已发送" : "发送验证码"}
                </Button>
              </div>
            </div>
            {codeSent && (
              <div>
                <Label htmlFor="verificationCode">验证码 *</Label>
                <Input
                  id="verificationCode"
                  placeholder="请输入验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="invitationCode">邀请码 (可选)</Label>
              <Input
                id="invitationCode"
                placeholder="如有邀请码请输入"
                value={formData.invitationCode}
                onChange={(e) => handleInputChange("invitationCode", e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={loading}>
              {loading ? "注册中..." : t("register")}
            </Button>
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <Link to="/login" className="hover:text-primary transition-colors block">
                已有账号？{t("login")}
              </Link>
              <Link to="/" className="hover:text-primary transition-colors block">
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