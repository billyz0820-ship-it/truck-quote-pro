import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';

interface RouteMapProps {
  pickupZip: string;
  deliveryZip: string;
  pickupCity?: string;
  deliveryCity?: string;
  pickupState?: string;
  deliveryState?: string;
}

export const RouteMap = ({ 
  pickupZip, 
  deliveryZip,
  pickupCity,
  deliveryCity,
  pickupState,
  deliveryState
}: RouteMapProps) => {
  const pickupLocation = pickupCity && pickupState 
    ? `${pickupCity}, ${pickupState}` 
    : pickupZip;
    
  const deliveryLocation = deliveryCity && deliveryState 
    ? `${deliveryCity}, ${deliveryState}` 
    : deliveryZip;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* 发货地 */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">发货地</p>
              <p className="font-bold text-lg">{pickupLocation}</p>
            </div>
          </div>

          {/* 路线指示 */}
          <div className="flex items-center gap-2 px-4">
            <div className="h-0.5 w-16 bg-primary/30"></div>
            <ArrowRight className="h-8 w-8 text-primary" />
            <div className="h-0.5 w-16 bg-primary/30"></div>
          </div>

          {/* 收货地 */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div>
              <p className="text-sm text-muted-foreground text-right">收货地</p>
              <p className="font-bold text-lg text-right">{deliveryLocation}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* 可视化路线 */}
        <div className="mt-6 relative h-2 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-primary to-red-500 animate-pulse"></div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-3">
          预计运输时间：3-5个工作日
        </p>
      </CardContent>
    </Card>
  );
};
