export type Category = {
  id: string;
  name: string;
  slug: string;
  nameJa?: string;
  icon?: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  nameJa?: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  tags?: string[];
  spicy?: number;
};

export type CartItem = {
  itemId: string;
  quantity: number;
  notes?: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

export type Order = {
  id: string;
  tableNumber: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    priceAtOrder: number;
    notes?: string;
  }>;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod?: "card" | "applepay" | "grabpay" | "fpx" | "tng" | "cash";
  cancelReason?: string;
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
};
