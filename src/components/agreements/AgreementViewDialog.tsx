import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Agreement {
  id: string;
  title: string;
  content: string;
  version: string;
}

interface AgreementViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function AgreementViewDialog({ open, onOpenChange, onAccept }: AgreementViewDialogProps) {
  const { customerId } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAgreements, setCheckedAgreements] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgreements();
    }
  }, [open]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agreements")
        .select("id, title, content, version")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error("获取协议失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckChange = (agreementId: string, checked: boolean) => {
    const newChecked = new Set(checkedAgreements);
    if (checked) {
      newChecked.add(agreementId);
    } else {
      newChecked.delete(agreementId);
    }
    setCheckedAgreements(newChecked);
  };

  const allChecked = agreements.length > 0 && checkedAgreements.size === agreements.length;

  const handleAccept = async () => {
    if (!customerId || !allChecked) return;

    setSubmitting(true);
    try {
      // Record agreement acceptance
      const acceptanceRecords = agreements.map(agreement => ({
        customer_id: customerId,
        agreement_id: agreement.id,
        ip_address: null // Could capture IP if needed
      }));

      const { error } = await supabase
        .from("customer_agreements")
        .insert(acceptanceRecords);

      if (error) throw error;

      onAccept();
      onOpenChange(false);
    } catch (error) {
      console.error("记录协议签署失败:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            服务协议
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            暂无需要签署的协议
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <div key={agreement.id} className="border rounded-lg">
                <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{agreement.title}</h3>
                    <span className="text-xs text-muted-foreground">版本: {agreement.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`agreement-${agreement.id}`}
                      checked={checkedAgreements.has(agreement.id)}
                      onCheckedChange={(checked) => handleCheckChange(agreement.id, checked as boolean)}
                    />
                    <label 
                      htmlFor={`agreement-${agreement.id}`} 
                      className="text-sm cursor-pointer"
                    >
                      我已阅读并同意
                    </label>
                  </div>
                </div>
                <ScrollArea className="h-48 p-4">
                  <div 
                    className="prose prose-sm max-w-none text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: agreement.content }}
                  />
                </ScrollArea>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!allChecked || submitting}
          >
            {submitting ? "提交中..." : "确认并同意所有协议"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}