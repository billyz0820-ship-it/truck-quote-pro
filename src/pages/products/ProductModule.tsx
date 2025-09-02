import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Plus, 
  Upload, 
  Search,
  Edit,
  Trash2,
  Download
} from "lucide-react";

const ProductModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const mockProducts = [
    {
      id: "SKU-001",
      name: "iPhone 15 Pro",
      category: "电子产品",
      dimensions: "146.6 × 70.6 × 8.25 mm",
      weight: "187g",
      description: "苹果最新旗舰手机",
      status: "active"
    },
    {
      id: "SKU-002", 
      name: "Nike Air Max 270",
      category: "服装鞋帽",
      dimensions: "300 × 200 × 120 mm",
      weight: "375g",
      description: "运动休闲鞋",
      status: "active"
    },
    {
      id: "SKU-003",
      name: "MacBook Pro 16寸",
      category: "电子产品", 
      dimensions: "355.7 × 248.1 × 16.8 mm",
      weight: "2.15kg",
      description: "专业级笔记本电脑",
      status: "inactive"
    }
  ];

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    description: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log("Product data:", formData);
    setIsAddDialogOpen(false);
    // Reset form
    setFormData({
      sku: "",
      name: "",
      category: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      description: ""
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">产品模块</h1>
        <p className="text-muted-foreground">管理SKU的尺寸、重量等信息</p>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索SKU或产品名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                批量导入
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    新增SKU
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增产品SKU</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU编号</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                          placeholder="输入SKU编号"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">产品名称</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="输入产品名称"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">产品类别</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        placeholder="输入产品类别"
                      />
                    </div>

                    <div>
                      <Label>产品尺寸 (mm)</Label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <Label htmlFor="length" className="text-sm">长度</Label>
                          <Input
                            id="length"
                            value={formData.length}
                            onChange={(e) => handleInputChange("length", e.target.value)}
                            placeholder="长度"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width" className="text-sm">宽度</Label>
                          <Input
                            id="width"
                            value={formData.width}
                            onChange={(e) => handleInputChange("width", e.target.value)}
                            placeholder="宽度"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height" className="text-sm">高度</Label>
                          <Input
                            id="height"
                            value={formData.height}
                            onChange={(e) => handleInputChange("height", e.target.value)}
                            placeholder="高度"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="weight">重量</Label>
                      <Input
                        id="weight"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        placeholder="输入重量 (如: 500g, 2.5kg)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">产品描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="输入产品描述"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSubmit}>
                        保存
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            产品列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU编号</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>尺寸 (mm)</TableHead>
                <TableHead>重量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProducts
                .filter(product => 
                  product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.dimensions}</TableCell>
                  <TableCell>{product.weight}</TableCell>
                  <TableCell>
                    <Badge className={product.status === "active" ? "bg-success" : "bg-secondary"}>
                      {product.status === "active" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductModule;