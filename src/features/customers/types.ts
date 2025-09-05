import type { Customer, Coordinates } from '@/types';

// Extended customer with usage statistics
export interface CustomerRecord extends Customer {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: number;
}

// Customer search criteria
export interface CustomerSearchCriteria {
  query?: string;
  phone?: string;
  name?: string;
  city?: string;
  limit?: number;
}

// Customer form validation errors
export interface CustomerFormErrors {
  name?: string;
  phone?: string;
  street?: string;
  number?: string;
  city?: string;
}