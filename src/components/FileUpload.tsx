import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      // Delete old file if exists
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

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {currentUrl ? (
        <div className="flex items-center gap-2">
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
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
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
    </div>
  );
};

export default FileUpload;
