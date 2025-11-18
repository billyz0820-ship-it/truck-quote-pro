import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SignatureServices {
  direct_signature: number;
  indirect_signature: number;
  adult_signature: number;
}

interface FedExAdditionalFeesProps {
  signatureServices?: SignatureServices;
  deliveryInterceptFee?: number;
  addressCorrectionFee?: number;
  dangerousGoodsFee?: number;
  onChange: (field: string, value: any) => void;
}

export function FedExAdditionalFees({
  signatureServices = {
    direct_signature: 0,
    indirect_signature: 0,
    adult_signature: 0,
  },
  deliveryInterceptFee = 0,
  addressCorrectionFee = 0,
  dangerousGoodsFee = 0,
  onChange,
}: FedExAdditionalFeesProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-semibold">FedEx附加费用</h3>
      
      <div className="space-y-3">
        <Label>签名服务费用</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">直接签名 ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={signatureServices.direct_signature}
              onChange={(e) =>
                onChange("signature_services", {
                  ...signatureServices,
                  direct_signature: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">间接签名 ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={signatureServices.indirect_signature}
              onChange={(e) =>
                onChange("signature_services", {
                  ...signatureServices,
                  indirect_signature: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">成人签名 ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={signatureServices.adult_signature}
              onChange={(e) =>
                onChange("signature_services", {
                  ...signatureServices,
                  adult_signature: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>拦截附加费 ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={deliveryInterceptFee}
            onChange={(e) =>
              onChange("delivery_intercept_fee", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>地址修正费 ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={addressCorrectionFee}
            onChange={(e) =>
              onChange("address_correction_fee", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>危险品附加费 ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={dangerousGoodsFee}
            onChange={(e) =>
              onChange("dangerous_goods_fee", parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
