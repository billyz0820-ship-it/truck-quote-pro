import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Edit, Star, Settings, Truck } from "lucide-react";
import { toast } from "sonner";

interface TruckCarrier {
  id: string;
  carrier_name: string;
  avatar_url: string | null;
  is_system: boolean;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CarrierRating {
  id: string;
  carrier_id: string;
  pickup_punctuality: number;
  transit_timeliness: number;
  delivery_timeliness: number;
  loss_rate: number;
  overall_score: number;
}

const TruckCarrierManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<TruckCarrier | null>(null);
  const [formData, setFormData] = useState({
    carrier_name: "",
    avatar_url: "",
    notes: "",
  });
  const [ratingData, setRatingData] = useState({
    pickup_punctuality: 80,
    transit_timeliness: 80,
    delivery_timeliness: 80,
    loss_rate: 5,
  });

  const queryClient = useQueryClient();

  const { data: carriers, isLoading } = useQuery({
    queryKey: ["truck-carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("truck_carriers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TruckCarrier[];
    },
  });

  const { data: ratings } = useQuery({
    queryKey: ["truck-carrier-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("truck_carrier_ratings")
        .select("*");
      if (error) throw error;
      return data as CarrierRating[];
    },
  });

  const addCarrierMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("truck_carriers").insert({
        carrier_name: data.carrier_name,
        avatar_url: data.avatar_url || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truck-carriers"] });
      setIsAddDialogOpen(false);
      setFormData({ carrier_name: "", avatar_url: "", notes: "" });
      toast.success("承运商添加成功");
    },
    onError: () => toast.error("添加失败"),
  });

  const updateCarrierMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("truck_carriers")
        .update({
          carrier_name: data.carrier_name,
          avatar_url: data.avatar_url || null,
          notes: data.notes || null,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truck-carriers"] });
      setIsAddDialogOpen(false);
      setSelectedCarrier(null);
      setFormData({ carrier_name: "", avatar_url: "", notes: "" });
      toast.success("承运商更新成功");
    },
    onError: () => toast.error("更新失败"),
  });

  const saveRatingMutation = useMutation({
    mutationFn: async (data: { carrier_id: string } & typeof ratingData) => {
      // Check if rating exists
      const { data: existing } = await supabase
        .from("truck_carrier_ratings")
        .select("id")
        .eq("carrier_id", data.carrier_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("truck_carrier_ratings")
          .update({
            pickup_punctuality: data.pickup_punctuality,
            transit_timeliness: data.transit_timeliness,
            delivery_timeliness: data.delivery_timeliness,
            loss_rate: data.loss_rate,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("truck_carrier_ratings").insert({
          carrier_id: data.carrier_id,
          pickup_punctuality: data.pickup_punctuality,
          transit_timeliness: data.transit_timeliness,
          delivery_timeliness: data.delivery_timeliness,
          loss_rate: data.loss_rate,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["truck-carrier-ratings"] });
      setIsRatingDialogOpen(false);
      setSelectedCarrier(null);
      toast.success("评分保存成功");
    },
    onError: () => toast.error("保存失败"),
  });

  const getRating = (carrierId: string) => {
    return ratings?.find((r) => r.carrier_id === carrierId);
  };

  const handleAddClick = () => {
    setSelectedCarrier(null);
    setFormData({ carrier_name: "", avatar_url: "", notes: "" });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (carrier: TruckCarrier) => {
    setSelectedCarrier(carrier);
    setFormData({
      carrier_name: carrier.carrier_name,
      avatar_url: carrier.avatar_url || "",
      notes: carrier.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleRatingClick = (carrier: TruckCarrier) => {
    setSelectedCarrier(carrier);
    const existingRating = getRating(carrier.id);
    if (existingRating) {
      setRatingData({
        pickup_punctuality: existingRating.pickup_punctuality,
        transit_timeliness: existingRating.transit_timeliness,
        delivery_timeliness: existingRating.delivery_timeliness,
        loss_rate: existingRating.loss_rate,
      });
    } else {
      setRatingData({
        pickup_punctuality: 80,
        transit_timeliness: 80,
        delivery_timeliness: 80,
        loss_rate: 5,
      });
    }
    setIsRatingDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.carrier_name) {
      toast.error("请填写承运商名称");
      return;
    }
    if (selectedCarrier) {
      updateCarrierMutation.mutate({ ...formData, id: selectedCarrier.id });
    } else {
      addCarrierMutation.mutate(formData);
    }
  };

  const handleSaveRating = () => {
    if (!selectedCarrier) return;
    saveRatingMutation.mutate({ carrier_id: selectedCarrier.id, ...ratingData });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">卡车承运商管理</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                新增承运商
              </Button>
            </TooltipTrigger>
            <TooltipContent>新增卡车承运商</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>承运商列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>头像</TableHead>
                  <TableHead>承运商名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>综合评分</TableHead>
                  <TableHead>取货准时率</TableHead>
                  <TableHead>运输时效</TableHead>
                  <TableHead>妥投时效</TableHead>
                  <TableHead>丢件率</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers?.map((carrier) => {
                  const rating = getRating(carrier.id);
                  return (
                    <TableRow key={carrier.id}>
                      <TableCell>
                        {carrier.avatar_url ? (
                          <img
                            src={carrier.avatar_url}
                            alt={carrier.carrier_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{carrier.carrier_name}</TableCell>
                      <TableCell>
                        <Badge variant={carrier.is_system ? "default" : "secondary"}>
                          {carrier.is_system ? "系统" : "自定义"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {rating ? rating.overall_score.toFixed(1) : "-"}
                        </span>
                      </TableCell>
                      <TableCell>{rating ? `${rating.pickup_punctuality}%` : "-"}</TableCell>
                      <TableCell>{rating ? `${rating.transit_timeliness}%` : "-"}</TableCell>
                      <TableCell>{rating ? `${rating.delivery_timeliness}%` : "-"}</TableCell>
                      <TableCell>{rating ? `${rating.loss_rate}%` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={carrier.status === "active" ? "default" : "secondary"}>
                          {carrier.status === "active" ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(carrier)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>编辑</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRatingClick(carrier)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>评分</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.location.href = `/dashboard/truck/pricing/${carrier.id}`}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>配置报价</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCarrier ? "编辑承运商" : "新增承运商"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>承运商名称 *</Label>
              <Input
                value={formData.carrier_name}
                onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                placeholder="请输入承运商名称"
              />
            </div>
            <div>
              <Label>头像URL</Label>
              <Input
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="请输入头像图片URL"
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="请输入备注"
              />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {selectedCarrier ? "保存" : "添加"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>承运商评分 - {selectedCarrier?.carrier_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>取货准时率 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={ratingData.pickup_punctuality}
                onChange={(e) =>
                  setRatingData({ ...ratingData, pickup_punctuality: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>运输时效 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={ratingData.transit_timeliness}
                onChange={(e) =>
                  setRatingData({ ...ratingData, transit_timeliness: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>妥投时效 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={ratingData.delivery_timeliness}
                onChange={(e) =>
                  setRatingData({ ...ratingData, delivery_timeliness: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>丢件率 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={ratingData.loss_rate}
                onChange={(e) =>
                  setRatingData({ ...ratingData, loss_rate: Number(e.target.value) })
                }
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                综合评分 = (取货准时率 + 运输时效 + 妥投时效 + (100 - 丢件率)) / 4
              </p>
              <p className="text-lg font-bold text-primary mt-2">
                预计综合评分:{" "}
                {(
                  (ratingData.pickup_punctuality +
                    ratingData.transit_timeliness +
                    ratingData.delivery_timeliness +
                    (100 - ratingData.loss_rate)) /
                  4
                ).toFixed(1)}
              </p>
            </div>
            <Button onClick={handleSaveRating} className="w-full">
              保存评分
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TruckCarrierManagement;