import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadProps {
  orderId: string;
  fileType: "bol" | "sbol" | "pallet_label";
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  label: string;
}

const FileUpload = ({ orderId, fileType, currentUrl, onUploadComplete, label }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("请选择要上传的文件");
      return;
    }

    try {
      setUploading(true);

      // Delete old file if exists (for replacement)
      if (currentUrl) {
        const oldPath = currentUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("order-documents").remove([oldPath]);
      }

      // Upload new file
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}/${fileType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("order-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("order-documents")
        .getPublicUrl(fileName);

      // Update order record
      const updateField = `${fileType}_url`;
      const { error: updateError } = await supabase
        .from("orders")
        .update({ [updateField]: publicUrl })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success("文件上传成功！");
      onUploadComplete(publicUrl);
      setFile(null);
      setReplacing(false);
    } catch (error: any) {
      toast.error("文件上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;

    try {
      setUploading(true);

      // Delete from storage
      const path = currentUrl.split("/").slice(-2).join("/");
      const { error: deleteError } = await supabase.storage
        .from("order-documents")
        .remove([path]);

      if (deleteError) throw deleteError;

      // Update order record
      const updateField = `${fileType}_url`;
      const { error: updateError } = await supabase
        .from("orders")
        .update({ [updateField]: null })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success("文件删除成功！");
      onUploadComplete("");
    } catch (error: any) {
      toast.error("文件删除失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentUrl) return;
    
    try {
      // Open the file URL in a new tab to trigger download
      window.open(currentUrl, '_blank');
    } catch (error: any) {
      toast.error("下载失败: " + error.message);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {currentUrl && !replacing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <FileText className="h-4 w-4" />
            查看文件
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            下载
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplacing(true)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                替换
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {replacing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>正在替换文件</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplacing(false);
                  setFile(null);
                }}
              >
                取消
              </Button>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "上传中..." : "上传"}
              </Button>
            </div>
          )}
          {!isAdmin && !currentUrl && (
            <p className="text-sm text-muted-foreground">暂无文件</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
