import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CouponSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    express_amount: 2,
    truck_amount: 7
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'registration_coupons')
        .single();

      if (data) {
        setSettings(data.setting_value as any);
      }
    } catch (error: any) {
      toast.error("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: settings })
        .eq('setting_key', 'registration_coupons');

      if (error) throw error;
      toast.success("保存成功");
    } catch (error: any) {
      toast.error("保存失败: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>注册优惠券设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>启用注册优惠券</Label>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
          />
        </div>
        <div>
          <Label>快递优惠券金额 ($)</Label>
          <Input
            type="number"
            value={settings.express_amount}
            onChange={(e) => setSettings({ ...settings, express_amount: Number(e.target.value) })}
            disabled={!settings.enabled}
          />
        </div>
        <div>
          <Label>卡车优惠券金额 ($)</Label>
          <Input
            type="number"
            value={settings.truck_amount}
            onChange={(e) => setSettings({ ...settings, truck_amount: Number(e.target.value) })}
            disabled={!settings.enabled}
          />
        </div>
        <Button onClick={handleSave}>保存设置</Button>
      </CardContent>
    </Card>
  );
}