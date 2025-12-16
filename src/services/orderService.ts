import { api } from '@/utils/api';
import type {
  GetOrderListRequest,
  GetOrderListResponsePagedResultDtoResponseEntity,
  GetOrderListResponse,
  OrderImageEnum,
  LogisticsAccountCarrierEnum,
  OrderTypeE,
  OrderSourceTypeEnum
} from '@/types/order';

// 订单服务
export const orderService = {
  // 获取订单列表
  getOrderList: async (params: GetOrderListRequest): Promise<GetOrderListResponsePagedResultDtoResponseEntity> => {
    console.log('=== 获取订单列表 ===');
    console.log('请求参数:', params);
    
    try {
      const response = await api.post<GetOrderListResponsePagedResultDtoResponseEntity>('/api/v1/Order/GetList', params);
      
      console.log('=== 订单列表响应 ===');
      console.log('完整响应:', response);
      console.log('订单数量:', response.data?.items?.length || 0);
      console.log('总数量:', response.data?.totalCount || 0);
      console.log('=== 订单列表响应结束 ===');
      
      return response;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  },

  // 获取订单详情（如果需要的话）
  getOrderDetail: async (orderId: string) => {
    console.log('=== 获取订单详情 ===');
    console.log('订单ID:', orderId);
    
    try {
      const response = await api.get(`/api/v1/Order/GetDetail?id=${orderId}`);
      console.log('订单详情响应:', response);
      return response;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  },

  // 创建订单（如果需要的话）
  createOrder: async (orderData: any) => {
    console.log('=== 创建订单 ===');
    console.log('订单数据:', orderData);
    
    try {
      const response = await api.post('/api/v1/Order/Create', orderData);
      console.log('创建订单响应:', response);
      return response;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  },

  // 更新订单（如果需要的话）
  updateOrder: async (orderId: string, orderData: any) => {
    console.log('=== 更新订单 ===');
    console.log('订单ID:', orderId);
    console.log('更新数据:', orderData);
    
    try {
      const response = await api.put(`/api/v1/Order/Update?id=${orderId}`, orderData);
      console.log('更新订单响应:', response);
      return response;
    } catch (error) {
      console.error('更新订单失败:', error);
      throw error;
    }
  },

  // 删除订单（如果需要的话）
  deleteOrder: async (orderId: string) => {
    console.log('=== 删除订单 ===');
    console.log('订单ID:', orderId);
    
    try {
      const response = await api.delete(`/api/v1/Order/Delete?id=${orderId}`);
      console.log('删除订单响应:', response);
      return response;
    } catch (error) {
      console.error('删除订单失败:', error);
      throw error;
    }
  },

  // 批量操作（如果需要的话）
  batchUpdateOrders: async (orderIds: string[], operation: string, data?: any) => {
    console.log('=== 批量操作订单 ===');
    console.log('订单IDs:', orderIds);
    console.log('操作类型:', operation);
    console.log('操作数据:', data);
    
    try {
      const response = await api.post('/api/v1/Order/BatchUpdate', {
        orderIds,
        operation,
        data
      });
      console.log('批量操作响应:', response);
      return response;
    } catch (error) {
      console.error('批量操作失败:', error);
      throw error;
    }
  },
};

// 查询参数构建器
export const buildOrderQueryParams = (filters: any, pagination: any): GetOrderListRequest => {
  const params: GetOrderListRequest = {
    pageIndex: pagination.pageIndex || 1,
    pageSize: pagination.pageSize || 20,
  };

  // 排序参数
  if (pagination.sortField) {
    params.sortField = pagination.sortField;
    params.sortValue = pagination.sortValue;
  } else if (pagination.sorting) {
    params.sorting = pagination.sorting;
  }

  // 筛选参数
  if (filters.orderSourceType) {
    params.orderSourceType = Number(filters.orderSourceType);
  }

  // 处理订单号 - 统一使用数组格式，支持逗号分隔或换行分隔的多个订单号
  if (filters.orderNo?.trim()) {
    const orderNumbers = filters.orderNo
      .trim()
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    
    console.log('订单号批量处理:', {
      原始输入: filters.orderNo,
      分割后: orderNumbers,
      数量: orderNumbers.length
    });
    
    // 统一使用数组格式
    (params as any).orderNo = orderNumbers;
    console.log('订单号数组:', (params as any).orderNo);
  }

  // 处理快递单号 - 统一使用数组格式，支持逗号分隔或换行分隔的多个快递单号
  if (filters.trackingNumber?.trim()) {
    const trackingNumbers = filters.trackingNumber
      .trim()
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    
    console.log('快递单号批量处理:', {
      原始输入: filters.trackingNumber,
      分割后: trackingNumbers,
      数量: trackingNumbers.length
    });
    
    // 统一使用数组格式
    (params as any).trackingNumber = trackingNumbers;
    console.log('快递单号数组:', (params as any).trackingNumber);
  }

  if (filters.recipient?.trim()) {
    params.recipient = filters.recipient.trim();
  }

  if (filters.orderStatus) {
    params.orderStatus = Number(filters.orderStatus);
  }

  if (filters.customerId?.trim()) {
    params.customerId = filters.customerId.trim();
  }

  if (filters.wareHouseId?.trim()) {
    params.wareHouseId = filters.wareHouseId.trim();
  }

  if (filters.recordNo?.trim()) {
    params.recordNo = filters.recordNo.trim();
  }

  if (filters.account?.trim()) {
    params.account = filters.account.trim();
  }

  if (filters.carrier) {
    params.carrier = Number(filters.carrier);
  }

  // 时间范围参数
  if (filters.startBillingTime) {
    params.startBillingTime = new Date(filters.startBillingTime).toISOString();
  }

  if (filters.endBillingTime) {
    params.endBillingTime = new Date(filters.endBillingTime).toISOString();
  }

  if (filters.startCreateTime) {
    params.startCreateTime = new Date(filters.startCreateTime).toISOString();
  }

  if (filters.endCreateTime) {
    params.endCreateTime = new Date(filters.endCreateTime).toISOString();
  }

  if (filters.productNo?.trim()) {
    params.productNo = filters.productNo.trim();
  }

  if (filters.orderType) {
    params.orderType = Number(filters.orderType);
  }

  return params;
};