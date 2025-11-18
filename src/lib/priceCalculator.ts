interface PackageInfo {
  weight: number;
  length: number;
  width: number;
  height: number;
  zone: string;
  addressType: "commercial" | "residential";
  serviceType: string;
  isRemoteArea?: {
    type: "das" | "extend" | "remote";
    serviceType: "ground" | "home";
  };
}

interface PricingConfig {
  base_prices: Record<string, Record<string, number>>; // weight -> zone -> price
  ahs_weight: Record<string, number>;
  ahs_dim: Record<string, number>;
  ahs_packing: Record<string, number>;
  oversize_commercial: Record<string, number>;
  oversize_residential: Record<string, number>;
  residential_fees: { ground: number; home: number };
  remote_area_fees: {
    das: { ground: number; home: number };
    extend: { ground: number; home: number };
    remote: { ground: number; home: number };
  };
  dim_factor: number;
  fuel_charge: number;
  unauthorized_fee: number;
  peak_surcharges: {
    economy: number;
    hd_ground: number;
    ahs: number;
    oversize: number;
    unauthorized: number;
    residential: number;
  };
}

interface CalculationBreakdown {
  basePrice: number;
  ahsWeight: number;
  ahsDim: number;
  ahsPacking: number;
  oversizeCharge: number;
  residentialFee: number;
  remoteAreaFee: number;
  fuelCharge: number;
  peakSurcharge: number;
  unauthorizedFee: number;
  subtotal: number;
  total: number;
  triggers: string[];
}

export class PriceCalculator {
  private config: PricingConfig;

  constructor(config: PricingConfig) {
    this.config = config;
  }

  calculate(packageInfo: PackageInfo): CalculationBreakdown {
    const breakdown: CalculationBreakdown = {
      basePrice: 0,
      ahsWeight: 0,
      ahsDim: 0,
      ahsPacking: 0,
      oversizeCharge: 0,
      residentialFee: 0,
      remoteAreaFee: 0,
      fuelCharge: 0,
      peakSurcharge: 0,
      unauthorizedFee: 0,
      subtotal: 0,
      total: 0,
      triggers: [],
    };

    // 计算体积重
    const dimWeight = this.calculateDimWeight(
      packageInfo.length,
      packageInfo.width,
      packageInfo.height
    );
    const billableWeight = Math.max(packageInfo.weight, dimWeight);

    // 基础价格
    breakdown.basePrice = this.getBasePrice(packageInfo.zone, billableWeight);

    // AHS费用判断
    const ahsChecks = this.checkAHS(packageInfo, billableWeight);
    if (ahsChecks.weight) {
      breakdown.ahsWeight = this.config.ahs_weight[packageInfo.zone] || 0;
      breakdown.triggers.push("AHS-Weight（超重）");
    }
    if (ahsChecks.dim) {
      breakdown.ahsDim = this.config.ahs_dim[packageInfo.zone] || 0;
      breakdown.triggers.push("AHS-Dim（超尺寸）");
    }
    if (ahsChecks.packing) {
      breakdown.ahsPacking = this.config.ahs_packing[packageInfo.zone] || 0;
      breakdown.triggers.push("AHS-Packing（非标包装）");
    }

    // 超大件费用
    const oversizeCheck = this.checkOversize(packageInfo);
    if (oversizeCheck) {
      if (packageInfo.addressType === "commercial") {
        breakdown.oversizeCharge = this.config.oversize_commercial[packageInfo.zone] || 0;
      } else {
        breakdown.oversizeCharge = this.config.oversize_residential[packageInfo.zone] || 0;
      }
      breakdown.triggers.push("Oversize（超大件）");
    }

    // 住宅费用
    if (packageInfo.addressType === "residential") {
      const serviceKey = packageInfo.serviceType.toLowerCase().includes("ground") ? "ground" : "home";
      breakdown.residentialFee = this.config.residential_fees[serviceKey] || 0;
      breakdown.triggers.push("Residential（住宅配送）");
    }

    // 偏远地址费用
    if (packageInfo.isRemoteArea) {
      const remoteType = packageInfo.isRemoteArea.type;
      const serviceType = packageInfo.isRemoteArea.serviceType;
      breakdown.remoteAreaFee = this.config.remote_area_fees[remoteType][serviceType] || 0;
      breakdown.triggers.push(`${remoteType.toUpperCase()}（偏远地址）`);
    }

    // 计算小计
    breakdown.subtotal = 
      breakdown.basePrice +
      breakdown.ahsWeight +
      breakdown.ahsDim +
      breakdown.ahsPacking +
      breakdown.oversizeCharge +
      breakdown.residentialFee +
      breakdown.remoteAreaFee;

    // 燃油附加费
    breakdown.fuelCharge = breakdown.subtotal * (this.config.fuel_charge / 100);

    // 旺季附加费（可根据日期判断是否旺季）
    if (this.isPeakSeason()) {
      let peakRate = 0;
      if (ahsChecks.weight || ahsChecks.dim || ahsChecks.packing) {
        peakRate = this.config.peak_surcharges.ahs;
      } else if (oversizeCheck) {
        peakRate = this.config.peak_surcharges.oversize;
      } else if (packageInfo.addressType === "residential") {
        peakRate = this.config.peak_surcharges.residential;
      } else {
        peakRate = this.config.peak_surcharges.economy;
      }
      breakdown.peakSurcharge = peakRate;
      breakdown.triggers.push("Peak Season（旺季附加费）");
    }

    // 总计
    breakdown.total = 
      breakdown.subtotal +
      breakdown.fuelCharge +
      breakdown.peakSurcharge +
      breakdown.unauthorizedFee;

    return breakdown;
  }

  private calculateDimWeight(length: number, width: number, height: number): number {
    if (!this.config.dim_factor || this.config.dim_factor === 0) {
      return 0;
    }
    return (length * width * height) / this.config.dim_factor;
  }

  private getBasePrice(zone: string, weight: number): number {
    // 查找对应重量的价格
    const weightKey = Math.ceil(weight).toString();
    return this.config.base_prices[weightKey]?.[zone] || 0;
  }

  private checkAHS(packageInfo: PackageInfo, billableWeight: number): {
    weight: boolean;
    dim: boolean;
    packing: boolean;
  } {
    return {
      weight: billableWeight > 150, // 超过150磅触发
      dim: packageInfo.length > 96 || packageInfo.width > 96 || packageInfo.height > 96, // 任一边超过96英寸
      packing: false, // 需要根据实际包装类型判断
    };
  }

  private checkOversize(packageInfo: PackageInfo): boolean {
    const { length, width, height } = packageInfo;
    const longestSide = Math.max(length, width, height);
    const girth = 2 * (length + width + height - longestSide);
    
    // FedEx超大件标准：最长边>108英寸 或 周长>165英寸
    return longestSide > 108 || (longestSide + girth) > 165;
  }

  private isPeakSeason(): boolean {
    // 简化版：11月15日-1月15日为旺季
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    return (month === 11 && day >= 15) || 
           (month === 12) || 
           (month === 1 && day <= 15);
  }

  compareAccounts(packageInfo: PackageInfo, accounts: Array<{ id: string; name: string; config: PricingConfig }>): Array<{
    accountId: string;
    accountName: string;
    breakdown: CalculationBreakdown;
  }> {
    return accounts.map(account => {
      const calculator = new PriceCalculator(account.config);
      return {
        accountId: account.id,
        accountName: account.name,
        breakdown: calculator.calculate(packageInfo),
      };
    });
  }
}
