interface SurchargeItem {
  start_date: string;
  end_date: string;
  value: number;
}

interface PricingData {
  base_prices?: Record<string, Record<string, number>>;
  ahs_weight?: Record<string, SurchargeItem[] | number>;
  ahs_dim?: Record<string, SurchargeItem[] | number>;
  ahs_packing?: Record<string, SurchargeItem[] | number>;
  oversize_commercial?: Record<string, SurchargeItem[] | number>;
  oversize_residential?: Record<string, SurchargeItem[] | number>;
  residential_fees?: any;
  remote_area_fees?: any;
  [key: string]: any;
}

interface ProfitabilityResult {
  [key: string]: {
    profitable: boolean;
    lossCount: number;
    totalItems: number;
  };
}

export class ProfitabilityAnalyzer {
  static analyze(customerPricing: PricingData, costPricing: PricingData): ProfitabilityResult {
    const result: ProfitabilityResult = {};

    // 分析基础价格
    if (customerPricing.base_prices && costPricing.base_prices) {
      result.base_prices = this.compareBasePrices(
        customerPricing.base_prices,
        costPricing.base_prices
      );
    }

    // 分析各项附加费
    const surchargeFields = [
      'ahs_weight',
      'ahs_dim',
      'ahs_packing',
      'oversize_commercial',
      'oversize_residential'
    ];

    surchargeFields.forEach(field => {
      if (customerPricing[field] && costPricing[field]) {
        result[field] = this.compareSurcharges(
          customerPricing[field] as Record<string, SurchargeItem[] | number>,
          costPricing[field] as Record<string, SurchargeItem[] | number>
        );
      }
    });

    // 分析住宅费用
    if (customerPricing.residential_fees && costPricing.residential_fees) {
      result.residential_fees = this.compareResidentialFees(
        customerPricing.residential_fees,
        costPricing.residential_fees
      );
    }

    // 分析偏远地址费用
    if (customerPricing.remote_area_fees && costPricing.remote_area_fees) {
      result.remote_area_fees = this.compareRemoteAreaFees(
        customerPricing.remote_area_fees,
        costPricing.remote_area_fees
      );
    }

    return result;
  }

  private static compareBasePrices(
    customer: Record<string, Record<string, number>>,
    cost: Record<string, Record<string, number>>
  ) {
    let totalItems = 0;
    let lossCount = 0;

    Object.entries(customer).forEach(([weight, zones]) => {
      Object.entries(zones).forEach(([zone, customerPrice]) => {
        totalItems++;
        const costPrice = cost[weight]?.[zone];
        if (costPrice !== undefined && customerPrice < costPrice) {
          lossCount++;
        }
      });
    });

    return {
      profitable: lossCount === 0,
      lossCount,
      totalItems
    };
  }

  private static compareSurcharges(
    customer: Record<string, SurchargeItem[] | number>,
    cost: Record<string, SurchargeItem[] | number>
  ) {
    let totalItems = 0;
    let lossCount = 0;

    Object.entries(customer).forEach(([zone, customerData]) => {
      const costData = cost[zone];
      
      if (Array.isArray(customerData) && Array.isArray(costData)) {
        // 时间段配置
        customerData.forEach(customerItem => {
          totalItems++;
          const overlappingCostItem = costData.find(costItem =>
            this.dateRangesOverlap(
              customerItem.start_date,
              customerItem.end_date,
              costItem.start_date,
              costItem.end_date
            )
          );
          if (overlappingCostItem && customerItem.value < overlappingCostItem.value) {
            lossCount++;
          }
        });
      } else if (typeof customerData === 'number' && typeof costData === 'number') {
        // 固定值配置
        totalItems++;
        if (customerData < costData) {
          lossCount++;
        }
      }
    });

    return {
      profitable: lossCount === 0,
      lossCount,
      totalItems
    };
  }

  private static compareResidentialFees(customer: any, cost: any) {
    let totalItems = 0;
    let lossCount = 0;

    ['ground', 'home'].forEach(type => {
      const customerData = customer[type];
      const costData = cost[type];

      if (Array.isArray(customerData) && Array.isArray(costData)) {
        customerData.forEach(customerItem => {
          totalItems++;
          const overlappingCostItem = costData.find((costItem: SurchargeItem) =>
            this.dateRangesOverlap(
              customerItem.start_date,
              customerItem.end_date,
              costItem.start_date,
              costItem.end_date
            )
          );
          if (overlappingCostItem && customerItem.value < overlappingCostItem.value) {
            lossCount++;
          }
        });
      } else if (typeof customerData === 'number' && typeof costData === 'number') {
        totalItems++;
        if (customerData < costData) {
          lossCount++;
        }
      }
    });

    return {
      profitable: lossCount === 0,
      lossCount,
      totalItems
    };
  }

  private static compareRemoteAreaFees(customer: any, cost: any) {
    let totalItems = 0;
    let lossCount = 0;

    ['das', 'extend', 'remote'].forEach(areaType => {
      ['ground', 'home'].forEach(serviceType => {
        const customerData = customer[areaType]?.[serviceType];
        const costData = cost[areaType]?.[serviceType];

        if (Array.isArray(customerData) && Array.isArray(costData)) {
          customerData.forEach((customerItem: SurchargeItem) => {
            totalItems++;
            const overlappingCostItem = costData.find((costItem: SurchargeItem) =>
              this.dateRangesOverlap(
                customerItem.start_date,
                customerItem.end_date,
                costItem.start_date,
                costItem.end_date
              )
            );
            if (overlappingCostItem && customerItem.value < overlappingCostItem.value) {
              lossCount++;
            }
          });
        } else if (typeof customerData === 'number' && typeof costData === 'number') {
          totalItems++;
          if (customerData < costData) {
            lossCount++;
          }
        }
      });
    });

    return {
      profitable: lossCount === 0,
      lossCount,
      totalItems
    };
  }

  private static dateRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return start1 <= end2 && start2 <= end1;
  }
}
