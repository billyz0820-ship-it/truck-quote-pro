import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTab } from "@/contexts/TabContext";

interface PricingTemplate {
  id: string;
  template_name: string;
  carrier: string;
  description?: string;
  created_at: string;
}

export default function PricingTemplates() {
  const { openTab } = useTab();
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const { toast } = useToast();

  const handleOpenNewTemplate = () => {
    openTab({
      title: "新增账套",
      path: "/dashboard/carrier/templates/new",
      icon: FileText,
    });
  };

  const handleOpenEditTemplate = (id: string, name: string) => {
    openTab({
      title: `编辑: ${name}`,
      path: `/dashboard/carrier/templates/${id}`,
      icon: FileText,
    });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("pricing_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "获取失败", description: error.message, variant: "destructive" });
    } else {
      setTemplates(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此账套？")) return;

    const { error } = await supabase.from("pricing_templates").delete().eq("id", id);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "删除成功" });
      fetchTemplates();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">账套管理</h1>
          <p className="text-muted-foreground mt-1">管理不同客户的报价账套</p>
        </div>
        <Button onClick={handleOpenNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          新增账套
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账套名称</TableHead>
              <TableHead>承运商</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.template_name}</TableCell>
                <TableCell>{template.carrier}</TableCell>
                <TableCell>{template.description || "-"}</TableCell>
                <TableCell>{new Date(template.created_at).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleOpenEditTemplate(template.id, template.template_name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
