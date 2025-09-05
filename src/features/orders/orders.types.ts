import type { Order, OrderStatus, PaymentStatus } from '@/types';

// Order filter criteria
export interface OrderFilterCriteria {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  customerPhone?: string;
  customerName?: string;
}

// Order statistics
export interface OrderStatistics {
  total: number;
  pending: number;
  cooking: number;
  ready: number;
  delivered: number;
  totalRevenue: number;
  averageOrderValue: number;
  unpaidOrders: number;
  unpaidAmount: number;
}

// Order validation errors
export interface OrderValidationErrors {
  cart?: string;
  customer?: string;
  address?: string;
  coordinates?: string;
  payment?: string;
}

// Order creation result
export interface OrderCreationResult {
  success: boolean;
  order?: Order;
  errors?: OrderValidationErrors;
}

// Order search result
export interface OrderSearchResult {
  orders: Order[];
  total: number;
  hasMore: boolean;
}