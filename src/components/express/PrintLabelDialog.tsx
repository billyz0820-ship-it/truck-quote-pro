import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderIds: string[];
  onSuccess: () => void;
}

export function PrintLabelDialog({ open, onOpenChange, orderIds, onSuccess }: PrintLabelDialogProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Update label_printed_at timestamp for all selected orders
      const { error } = await supabase
        .from('express_orders')
        .update({ 
          label_printed_at: new Date().toISOString(),
          status: 'printed'
        })
        .in('id', orderIds);

      if (error) throw error;

      // Simulate printing (in real app, this would generate and print actual labels)
      toast.success(`已打印 ${orderIds.length} 个订单的面单`);
      
      // Here you would typically:
      // 1. Generate label PDFs using carrier APIs
      // 2. Send to printer or open print dialog
      // 3. Update tracking numbers if available
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("打单失败: " + error.message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>打印面单</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            确认打印 <span className="font-bold">{orderIds.length}</span> 个订单的面单吗？
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handlePrint} disabled={printing}>
              <Printer className="h-4 w-4 mr-2" />
              {printing ? "打印中..." : "确认打印"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
