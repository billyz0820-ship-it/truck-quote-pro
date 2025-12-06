import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContractFileUploadProps {
  contractId: string;
  currentFileUrl?: string | null;
  onUploadComplete: (fileUrl: string) => void;
}

export function ContractFileUpload({ contractId, currentFileUrl, onUploadComplete }: ContractFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(currentFileUrl || null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("请上传PDF格式的文件");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过10MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${contractId}-${Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("contracts")
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("合同文件上传成功");
    } catch (error: any) {
      console.error("上传失败:", error);
      toast.error("上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (!fileUrl) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split("/");
      const filePath = urlParts.slice(-2).join("/");

      await supabase.storage.from("contracts").remove([filePath]);
      setFileUrl(null);
      onUploadComplete("");
      toast.success("文件已删除");
    } catch (error: any) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-2">
      <Label>合同文件 (PDF)</Label>
      {fileUrl ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <FileText className="h-5 w-5 text-primary" />
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 text-sm text-primary hover:underline truncate"
          >
            查看合同文件
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id={`contract-file-${contractId}`}
          />
          <label
            htmlFor={`contract-file-${contractId}`}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="text-sm">
              {uploading ? "上传中..." : "上传合同PDF"}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}