import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search, History } from "lucide-react";
import { format } from "date-fns";

export default function PriceHistory() {
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("price_calculation_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
    } else if (data) {
      setHistory(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("price_calculation_history")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "删除成功" });
      fetchHistory();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredHistory = history.filter((item) =>
    item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(item.package_info).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedHistory = selectedItems.map(id => history.find(h => h.id === id)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">价格计算历史</h1>
          <p className="text-muted-foreground">查看和对比历史计算结果</p>
        </div>
        {selectedItems.length > 0 && (
          <Badge variant="secondary">已选择 {selectedItems.length} 项</Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索备注或包裹信息..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedItems.length >= 2 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">对比结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {selectedHistory.map((item) => (
                <div key={item.id} className="space-y-2 border rounded-lg p-4">
                  <div className="font-medium">
                    {format(new Date(item.created_at), "yyyy-MM-dd HH:mm")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.notes || "无备注"}
                  </div>
                  <div className="space-y-1">
                    {Array.isArray(item.results) && item.results.map((result: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{result.accountName}</span>
                        <span className="font-medium">${result.breakdown?.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredHistory.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-colors ${
              selectedItems.includes(item.id) ? "border-primary" : ""
            }`}
            onClick={() => toggleSelection(item.id)}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </CardTitle>
                  <Badge variant="outline">{item.calculation_type}</Badge>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">包裹信息</h4>
                  <div className="space-y-1 text-sm">
                    <div>重量: {item.package_info.weight} lbs</div>
                    <div>尺寸: {item.package_info.length} × {item.package_info.width} × {item.package_info.height} in</div>
                    <div>分区: {item.package_info.zone}</div>
                    <div>地址类型: {item.package_info.addressType === "commercial" ? "商业" : "住宅"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">计算结果</h4>
                  <div className="space-y-1">
                    {Array.isArray(item.results) && item.results.map((result: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{result.accountName}</span>
                        <span className="font-medium">${result.breakdown?.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无历史记录</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
