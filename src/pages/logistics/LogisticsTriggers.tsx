import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown } from "lucide-react";

const LogisticsTriggers = () => {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const triggerTypes = [
    { value: "overweight", label: "超重附加费" },
    { value: "overlength", label: "超长附加费" },
    { value: "oversize", label: "超尺寸附加费" },
    { value: "peak", label: "超峰值" }
  ];

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from("logistics_triggers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error: any) {
      toast.error("加载物流触发规则失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrigger = async (triggerType: string) => {
    try {
      const { error } = await supabase
        .from("logistics_triggers")
        .insert({
          trigger_type: triggerType,
          carrier: "FedEx",
          conditions: {},
          fee_amount: 0
        });

      if (error) throw error;
      toast.success("添加成功");
      fetchTriggers();
    } catch (error: any) {
      toast.error("添加失败: " + error.message);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    try {
      const { error } = await supabase
        .from("logistics_triggers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("删除成功");
      fetchTriggers();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    }
  };

  const groupedTriggers = triggerTypes.map(type => ({
    ...type,
    items: triggers.filter(t => t.trigger_type === type.value)
  }));

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">物流触发规则</h1>
        <p className="text-muted-foreground">配置各项附加费的触发条件</p>
      </div>

      <div className="space-y-4">
        {groupedTriggers.map((group) => (
          <Collapsible key={group.value} defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {group.label}
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  </CardTitle>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTrigger(group.value);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加规则
                  </Button>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    {group.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        暂无规则
                      </p>
                    ) : (
                      group.items.map((trigger, index) => (
                        <div key={trigger.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <span className="font-medium">{index + 1}.</span>
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <div>
                              <Label>承运商</Label>
                              <Select defaultValue={trigger.carrier}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FedEx">FedEx</SelectItem>
                                  <SelectItem value="UPS">UPS</SelectItem>
                                  <SelectItem value="USPS">USPS</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>条件范围</Label>
                              <Input placeholder="例: >105 lbs" />
                            </div>
                            <div>
                              <Label>费用</Label>
                              <Input type="number" defaultValue={trigger.fee_amount} />
                            </div>
                            <div>
                              <Label>单位</Label>
                              <Select defaultValue="lbs">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lbs">lbs</SelectItem>
                                  <SelectItem value="in">in</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteTrigger(trigger.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default LogisticsTriggers;
