// 订单相关类型定义

// 订单来源类型枚举
export enum OrderSourceTypeEnum {
  // 根据实际枚举值填写
  Unknown = 0,
  Type1 = 1,
  Type2 = 2,
  Type3 = 3,
}

// 订单状态枚举
export enum OrderImageEnum {
  Created = 10,      // 已创建
  Pending = 20,      // 待处理
  Processing = 50,   // 处理中
  Shipped = 40,      // 已发货
  Delivered = 60,    // 已送达
  Cancelled = 30,    // 已取消
}

// 订单类型枚举
export enum OrderTypeE {
  RegularOrder = 1,  // 常规
  FixedPrice = 2,    // 一口价订单
}

// 地址类型枚举
export enum AddressTypeEnum {
  Residential = 1,   // 住宅
  Commercial = 2,    // 商业
  POBox = 3,         // 邮政信箱
  Other = 4,         // 其他
}

// 地址验证状态枚举
export enum ValidateAddressStatus {
  Valid = 1,         // 有效
  Invalid = 2,       // 无效
  Pending = 3,       // 待验证
}

// 承运商枚举
export enum LogisticsAccountCarrierEnum {
  UPS = 1,
  FedEx = 2,
  USPS = 3,
  DHL = 4,
  Other = 5,
}

// 取件状态枚举
export enum PickupStatusEnum {
  Scheduled = 1,     // 已安排
  InProgress = 2,    // 进行中
  Completed = 3,     // 已完成
  Cancelled = 4,     // 已取消
}

// 费用状态枚举
export enum FeeStatusEnum {
  Recorded = 1,      // 已入账
  Frozen = 2,        // 已冻结
  Cancelled = 3,      // 已取消
}

// 运费类型枚举
export enum FreightTypeEnum {
  Standard = 1,      // 标准
  Express = 2,       // 快递
}

// 订单列表请求参数
export interface GetOrderListRequest {
  pageIndex?: number;
  pageSize: number;
  sortField?: string;
  sortValue?: boolean;
  sorting?: string;
  orderSourceType?: OrderSourceTypeEnum;
  orderNo?: string;
  trackingNumber?: string;
  recipient?: string;
  orderStatus?: OrderImageEnum;
  customerId?: string;
  wareHouseId?: string;
  recordNo?: string;
  account?: string;
  carrier?: LogisticsAccountCarrierEnum;
  startBillingTime?: string;
  endBillingTime?: string;
  startCreateTime?: string;
  endCreateTime?: string;
  productNo?: string;
  orderType?: OrderTypeE;
}

// 运费详情
export interface GetBillDetailPageItem {
  id?: string;
  orderId?: string;
  trackingNumber?: string;
  uspsTrackingNumber?: string;
  orderNO?: string;
  quoteNo?: string;
  recordNo?: string;
  sku?: string;
  quantity?: number;
  warehouseId?: string;
  warehouseName?: string;
  logisticsServiceId?: string;
  logisticsService?: string;
  logisticsServiceName?: string;
  month?: string;
  weight?: number;
  volumeWeight?: number;
  billingWeight?: number;
  length?: number;
  width?: number;
  height?: number;
  postalCode?: string;
  zone?: number;
  discountAmount?: number;
  platformAmount?: number;
  baseFee?: number;
  overSizeFee?: number;
  nonStandardPackagingFee?: number;
  nonStandardFee?: number;
  remoteFee?: number;
  dasRemote?: number;
  ultraRemoteFee?: number;
  nonMotorizedFee?: number;
  peakSeasonSurcharge?: number;
  fuelCharge?: number;
  residentialDeliveryCharge?: number;
  signFee?: number;
  totalFee?: number;
  orderRecordNO?: string;
  ashFee?: number;
  ahsweight?: number;
  ahsdim?: number;
  unauthorizedPackage?: number;
  peakAHS?: number;
  peakOverSize?: number;
  peakResidential?: number;
  peakShipping?: number;
  peakUnauthorizedPackage?: number;
  customerId?: string;
  billNoPrint?: string;
  discount?: number;
  deliveryandreturns?: number;
  resultDiscountBaseFee?: number;
  discountBaseFee?: string;
  discountASHFee?: string;
  discountAHSWEIGHT?: string;
  discountAHSDIM?: string;
  discountOverSizeFee?: string;
  discountUnauthorizedPackage?: string;
  discountRemoteFee?: string;
  discountUltraRemoteFee?: string;
  discountDASRemote?: string;
  discountNonMotorizedFee?: string;
  discountDeliveryandreturns?: string;
  discountPeakSeasonSurcharge?: number;
  discountPeakAHS?: string;
  discountPeakOverSize?: string;
  discountPeakResidential?: string;
  discountPeakShipping?: string;
  discountPeakUnauthorizedPackage?: string;
  peakDemandResidential?: number;
  discountPeakDemandResidential?: string;
  discountDemandPrePackage?: string;
  discountFuelCharge?: string;
  discountResidentialDeliveryCharge?: string;
  discountSignFee?: string;
  transfiniteCharge?: number;
  discountTransfiniteCharge?: string;
  peakTransfiniteCharge?: number;
  discountPeakTransfiniteCharge?: string;
  irregularSurcharge?: number;
  discountIrregularSurcharge?: string;
  discountNonStandardPackagingFee?: string;
  discountNonStandardFee?: string;
  quoteId?: string;
  billingTime?: string;
  chargeTime?: string;
  chargeDate?: string;
  feeStatus?: FeeStatusEnum;
  feeStatusStr?: string;
  freightType?: FreightTypeEnum;
  freightTypeStr?: string;
  orderType?: OrderTypeE;
  orderTypeStr?: string;
  fixedPriceFee?: number;
  isShowZero?: boolean;
  isShowNoCharge?: boolean;
  isCharge?: boolean;
  isChargeStr?: string;
  pickupFee?: number;
  remark?: string;
  demandPrePackage?: number;
  customerName?: string;
  accountName?: string;
  costPrice?: number;
  costPriceStr?: string;
  insuranceFee?: number;
  freightDifference?: BillFreightDifferenceDto;
}

// 运费差异
export interface BillFreightDifferenceDto {
  // 根据实际结构定义
  [key: string]: any;
}

// 订单列表响应项
export interface GetOrderListResponse {
  id?: string;
  customerId?: string;
  customerName?: string;
  orderSourceType?: OrderSourceTypeEnum;
  orderSourceTypeName?: string;
  wareHouseName?: string;
  orderNo?: string;
  productQty?: number;
  trackingNumber?: string;
  logisticsidService?: string;
  recipient?: string;
  recipientAddress1?: string;
  recipientCountry?: string;
  recipientCityName?: string;
  recipientStateorProvince?: string;
  recipientPostalCode?: string;
  productNo?: string;
  billingTime?: string;
  zone?: string;
  orderStatus?: OrderImageEnum;
  addressType?: AddressTypeEnum;
  validateAddressStatus?: ValidateAddressStatus;
  createdTime?: string;
  platFormId?: string;
  carrier?: LogisticsAccountCarrierEnum;
  carrierStr?: string;
  recipientZone?: number;
  isReturn?: boolean;
  serviceCode?: string;
  logisticsidPrintId?: string;
  recordNo?: string;
  account?: string;
  billNoPrint?: string;
  trackingNumberList?: string[];
  uspsTrackingNumberList?: string[];
  orderType?: OrderTypeE;
  orderTypeStr?: string;
  pod?: string;
  isPickup?: boolean;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupCode?: string;
  pickupStatus?: PickupStatusEnum;
  remark?: string;
  freightDetail?: GetBillDetailPageItem;
  customsInvoiceNo?: string;
  customsAmount?: number;
}

// 分页结果
export interface GetOrderListResponsePagedResultDto {
  items?: GetOrderListResponse[];
  totalCount?: number;
}

// API响应实体
export interface GetOrderListResponsePagedResultDtoResponseEntity {
  code?: string;
  message?: string;
  data?: GetOrderListResponsePagedResultDto;
  isSuccess?: boolean;
}

// 订单状态映射
export const ORDER_STATUS_MAP: Record<OrderImageEnum, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [OrderImageEnum.Created]: { label: "已创建", variant: "outline" },
  [OrderImageEnum.Pending]: { label: "待处理", variant: "secondary" },
  [OrderImageEnum.Processing]: { label: "处理中", variant: "default" },
  [OrderImageEnum.Shipped]: { label: "已发货", variant: "default" },
  [OrderImageEnum.Delivered]: { label: "已送达", variant: "default" },
  [OrderImageEnum.Cancelled]: { label: "已取消", variant: "destructive" },
};

// 承运商映射
export const CARRIER_MAP: Record<LogisticsAccountCarrierEnum, string> = {
  [LogisticsAccountCarrierEnum.UPS]: "UPS",
  [LogisticsAccountCarrierEnum.FedEx]: "FedEx", 
  [LogisticsAccountCarrierEnum.USPS]: "USPS",
  [LogisticsAccountCarrierEnum.DHL]: "DHL",
  [LogisticsAccountCarrierEnum.Other]: "其他",
};

// 订单类型映射
export const ORDER_TYPE_MAP: Record<OrderTypeE, string> = {
  [OrderTypeE.RegularOrder]: "常规订单",
  [OrderTypeE.FixedPrice]: "一口价订单",
};