import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFirstOrderCheck(customerId: string | null) {
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    const checkFirstOrder = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        // Check if customer has any orders across all order types
        const [truckOrders, expressOrders, returnOrders, agreementRecords] = await Promise.all([
          supabase.from("orders").select("id").eq("customer_id", customerId).limit(1),
          supabase.from("express_orders").select("id").eq("customer_id", customerId).limit(1),
          supabase.from("return_orders").select("id").eq("customer_id", customerId).limit(1),
          supabase.from("customer_agreements").select("id").eq("customer_id", customerId).limit(1)
        ]);

        const hasAnyOrder = 
          (truckOrders.data && truckOrders.data.length > 0) ||
          (expressOrders.data && expressOrders.data.length > 0) ||
          (returnOrders.data && returnOrders.data.length > 0);

        const hasSignedAgreement = agreementRecords.data && agreementRecords.data.length > 0;

        setIsFirstOrder(!hasAnyOrder && !hasSignedAgreement);
        setHasAgreed(hasSignedAgreement || hasAnyOrder);
      } catch (error) {
        console.error("检查首单状态失败:", error);
      } finally {
        setLoading(false);
      }
    };

    checkFirstOrder();
  }, [customerId]);

  const markAsAgreed = () => {
    setHasAgreed(true);
    setIsFirstOrder(false);
  };

  return { isFirstOrder, loading, hasAgreed, markAsAgreed };
}