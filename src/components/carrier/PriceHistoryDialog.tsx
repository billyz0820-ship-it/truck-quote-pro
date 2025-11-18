import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
}

export const PriceHistoryDialog = ({ open, onOpenChange, config }: PriceHistoryDialogProps) => {
  if (!config) return null;

  const renderPriceField = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{label}</h4>
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          {typeof value === 'object' && !Array.isArray(value) ? (
            <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
          ) : Array.isArray(value) ? (
            value.length > 0 ? JSON.stringify(value) : '未配置'
          ) : (
            String(value)
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>报价配置预览</span>
            <Badge variant="secondary">历史配置</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(80vh-120px)]">
          <div className="space-y-6 p-4">
            {/* 基本信息 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">客户名称：</span>
                  <span className="font-medium">{config.customers?.company_name}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">客户编号：</span>
                  <span className="font-medium">{config.customers?.customer_code}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">承运商：</span>
                  <span className="font-medium">{config.carrier}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">版本：</span>
                  <Badge variant="outline">V{config.version}</Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">生效时间：</span>
                  <span className="font-medium">
                    {config.effective_date_from ? format(new Date(config.effective_date_from), 'yyyy-MM-dd') : '无限制'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">失效时间：</span>
                  <span className="font-medium">
                    {config.effective_date_to ? format(new Date(config.effective_date_to), 'yyyy-MM-dd') : '无限制'}
                  </span>
                </div>
              </div>
              {config.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">备注：</span>
                  <p className="text-sm mt-1">{config.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* 价格配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">价格配置</h3>
              
              {config.custom_prices?.base_prices && renderPriceField("基础价格", config.custom_prices.base_prices)}
              {config.custom_prices?.fuel_charge && renderPriceField("燃油附加费", `${config.custom_prices.fuel_charge}%`)}
              {config.custom_prices?.dim_factor && renderPriceField("体积系数", config.custom_prices.dim_factor)}
              {config.custom_prices?.residential_fees && renderPriceField("住宅费用", config.custom_prices.residential_fees)}
              {config.custom_prices?.remote_area_fees && renderPriceField("偏远地址费用", config.custom_prices.remote_area_fees)}
              {config.custom_prices?.signature_services && renderPriceField("签名服务", config.custom_prices.signature_services)}
              {config.custom_prices?.ahs_weight && renderPriceField("AHS超重", config.custom_prices.ahs_weight)}
              {config.custom_prices?.ahs_dim && renderPriceField("AHS超尺寸", config.custom_prices.ahs_dim)}
              {config.custom_prices?.ahs_packing && renderPriceField("AHS包装", config.custom_prices.ahs_packing)}
              {config.custom_prices?.oversize_commercial && renderPriceField("商业超大件", config.custom_prices.oversize_commercial)}
              {config.custom_prices?.oversize_residential && renderPriceField("住宅超大件", config.custom_prices.oversize_residential)}
              {config.custom_prices?.delivery_intercept_fee && renderPriceField("拦截附加费", `$${config.custom_prices.delivery_intercept_fee}`)}
              {config.custom_prices?.address_correction_fee && renderPriceField("地址修正费", `$${config.custom_prices.address_correction_fee}`)}
              {config.custom_prices?.dangerous_goods_fee && renderPriceField("危险品附加费", `$${config.custom_prices.dangerous_goods_fee}`)}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
