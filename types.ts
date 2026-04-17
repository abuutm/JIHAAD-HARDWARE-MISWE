
export enum ProductCategory {
  MOTORCYCLE = 'Pikipiki',
  SPARE_PART = 'Vipuri',
  ACCESSORY = 'Vifaa vya Ziada',
  TIMBER = 'Mbao',
  CEMENT = 'Saruji',
  BRICKS = 'Matofali'
}

export enum UserRole {
  ADMIN = 'Msimamizi',
  STAFF = 'Mfanyakazi'
}

export enum PaymentMethod {
  CASH = 'Pesa Taslimu',
  CARD = 'Kadi',
  MOBILE = 'Malipo ya Simu',
  LOAN = 'Mkopo'
}

export enum SaleStatus {
  PAID = 'Imelipwa'
}

export enum Unit {
  PIECE = 'Pcs',
  LITRE = 'L',
  KILOGRAM = 'KG',
  METER = 'M',
  CENTIMETER = 'CM'
}

export interface AppSettings {
  shopName: string;
  currency: string;
  taxRate: number;
  lowStockAlertLevel: number;
  themeColor: 'blue' | 'indigo' | 'emerald' | 'rose' | 'slate';
  uiDensity: 'compact' | 'relaxed';
  cornerRadius: 'none' | 'md' | 'full';
  sidebarMode: 'expanded' | 'collapsed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: ProductCategory;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplierId: string;
  description: string;
  imageUrl?: string;
  unit: Unit;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  lastPurchaseDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  total: number;
  unit: Unit;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  date: string;
  paidAt?: string;
  userId: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  date: string;
  userId: string;
}

export enum OperatingCostCategory {
  ELECTRICITY = 'Umeme',
  WATER = 'Maji',
  FUEL = 'Mafuta',
  PRODUCTION_STAFF = 'Wafanyakazi (Uzalishaji)',
  DISTRIBUTION_STAFF = 'Wafanyakazi (Usambazaji)',
  OTHER = 'Mengineyo'
}

export interface OperatingCost {
  id: string;
  category: OperatingCostCategory;
  amount: number;
  date: string;
  description?: string;
  userId: string;
}

export interface AirServiceRecord {
  id: string;
  vehicleType: 'Pikipiki' | 'Gari' | 'Baiskeli' | 'Bajaj';
  count: number;
  price: number;
  total: number;
  date: string;
  paymentMethod: PaymentMethod;
  servedBy?: string;
  notes?: string;
  uid?: string;
}

export enum LayawayStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface LayawayPayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber?: string;
}

export interface Layaway {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number; delivered?: number }[];
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  payments: LayawayPayment[];
  startDate: string;
  deadlineDate: string;
  status: LayawayStatus;
  deliveries?: DeliveryPhase[];
  notes?: string;
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  DEFAULTED = 'DEFAULTED'
}

export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber?: string;
}

export interface DeliveryPhase {
  id: string;
  date: string;
  items: { name: string; quantity: number }[];
  driverInfo?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  amountPaid: number;
  remainingBalance: number;
  payments: LoanPayment[];
  startDate: string;
  dueDate: string;
  status: LoanStatus;
  notes?: string;
  items?: { name: string; quantity: number; unitPrice: number; unitCost: number; delivered?: number }[];
  deliveries?: DeliveryPhase[];
}
