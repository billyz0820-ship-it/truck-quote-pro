import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, X } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Order {
  id: string;
  order_number: string;
  type: 'truck' | 'express';
  tracking_number?: string;
  pro_number?: string;
  carrier?: string;
}

const TRUCK_TICKET_TYPES = [
  "召回",
  "改地址",
  "电话服务",
  "运输问题申诉",
  "费用问题申诉"
];

const EXPRESS_TICKET_TYPES = [
  "召回",
  "改地址", 
  "电话服务",
  "运输问题申诉",
  "尺寸差异申诉",
  "重量差异申诉",
  "未使用面单退费"
];

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    ticket_type: "",
    carrier_name: ""
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("请输入订单号、追踪号或PRO号");
      return;
    }

    try {
      setSearching(true);
      const searchLower = searchTerm.toLowerCase().trim();

      // Search truck orders
      const { data: truckOrders, error: truckError } = await supabase
        .from('orders')
        .select('id, order_number, pro_number, carrier_name')
        .or(`order_number.ilike.%${searchLower}%,pro_number.ilike.%${searchLower}%`);

      if (truckError) throw truckError;

      // Search express orders
      const { data: expressOrders, error: expressError } = await supabase
        .from('express_orders')
        .select('id, order_number, tracking_number, carrier')
        .or(`order_number.ilike.%${searchLower}%,tracking_number.ilike.%${searchLower}%`);

      if (expressError) throw expressError;

      const results: Order[] = [
        ...(truckOrders || []).map(o => ({
          id: o.id,
          order_number: o.order_number,
          type: 'truck' as const,
          pro_number: o.pro_number || undefined,
          carrier: o.carrier_name || undefined
        })),
        ...(expressOrders || []).map(o => ({
          id: o.id,
          order_number: o.order_number,
          type: 'express' as const,
          tracking_number: o.tracking_number || undefined,
          carrier: o.carrier || undefined
        }))
      ];

      setSearchResults(results);
      if (results.length === 0) {
        toast.info("未找到匹配的订单");
      }
    } catch (error: any) {
      toast.error("搜索失败: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSearchResults([]);
    setSearchTerm("");
    setFormData(prev => ({
      ...prev,
      carrier_name: order.carrier || "",
      ticket_type: "" // Reset ticket type when order changes
    }));
  };

  const handleCreate = async () => {
    if (!selectedOrder) {
      toast.error("请先选择订单");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("请输入工单标题");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("请输入问题描述");
      return;
    }

    if (!formData.ticket_type) {
      toast.error("请选择工单类型");
      return;
    }

    try {
      setCreating(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      // Get customer info
      const { data: customerUser } = await supabase
        .from('customer_users')
        .select('customer_id, customers(id, customer_code)')
        .eq('user_id', user.id)
        .single();

      // Generate ticket number
      const ticketNumber = `TK-${Date.now()}`;

      const { error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          order_number: selectedOrder.order_number,
          carrier_name: formData.carrier_name,
          customer_id: customerUser?.customer_id || null,
          created_by: user.id,
          status: 'open',
          attachments: {
            order_type: selectedOrder.type,
            tracking_number: selectedOrder.tracking_number,
            pro_number: selectedOrder.pro_number,
            ticket_type: formData.ticket_type
          }
        });

      if (error) throw error;

      toast.success("工单创建成功");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        ticket_type: "",
        carrier_name: ""
      });
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error("创建工单失败: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const ticketTypes = selectedOrder?.type === 'truck' ? TRUCK_TICKET_TYPES : EXPRESS_TICKET_TYPES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建工单</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Order Search */}
          <div>
            <Label>关联订单</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="输入订单号、追踪号或PRO号搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-9"
              />
              <Button onClick={handleSearch} size="sm" disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Order */}
            {selectedOrder && (
              <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedOrder.type === 'truck' ? 'default' : 'secondary'}>
                    {selectedOrder.type === 'truck' ? '卡车订单' : '快递订单'}
                  </Badge>
                  <span className="font-medium">{selectedOrder.order_number}</span>
                  {selectedOrder.tracking_number && (
                    <span className="text-sm text-muted-foreground">
                      追踪号: {selectedOrder.tracking_number}
                    </span>
                  )}
                  {selectedOrder.pro_number && (
                    <span className="text-sm text-muted-foreground">
                      PRO号: {selectedOrder.pro_number}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                {searchResults.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={order.type === 'truck' ? 'default' : 'secondary'}>
                        {order.type === 'truck' ? '卡车' : '快递'}
                      </Badge>
                      <span className="font-medium">{order.order_number}</span>
                      {order.tracking_number && (
                        <span className="text-sm text-muted-foreground">
                          | 追踪: {order.tracking_number}
                        </span>
                      )}
                      {order.pro_number && (
                        <span className="text-sm text-muted-foreground">
                          | PRO: {order.pro_number}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Type */}
          {selectedOrder && (
            <div>
              <Label>工单类型</Label>
              <Select value={formData.ticket_type} onValueChange={(value) => setFormData({ ...formData, ticket_type: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择工单类型" />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label>工单标题</Label>
            <Input
              placeholder="输入工单标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>优先级</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="high">高</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Carrier */}
          <div>
            <Label>承运商</Label>
            <Input
              placeholder="承运商名称"
              value={formData.carrier_name}
              onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Description */}
          <div>
            <Label>问题描述</Label>
            <Textarea
              placeholder="详细描述遇到的问题..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "创建中..." : "创建工单"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
