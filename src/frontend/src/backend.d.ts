import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    id: bigint;
    name: string;
    description: string;
}
export interface OrderRecord {
    id: bigint;
    status: OrderStatus;
    serviceName: string;
    cost: Float;
    userId: Principal;
    link: string;
    createdAt: bigint;
    quantity: bigint;
    serviceId: bigint;
}
export interface Service {
    id: bigint;
    categoryId: bigint;
    pricePerThousand: Float;
    maxQuantity: bigint;
    name: string;
    description: string;
    isActive: boolean;
    minQuantity: bigint;
}
export interface DashboardStats {
    pendingPayments: bigint;
    totalOrders: bigint;
    totalUsers: bigint;
    totalRevenue: Float;
}
export interface Transaction {
    id: bigint;
    transactionType: TransactionType;
    userId: Principal;
    createdAt: bigint;
    referenceId: string;
    description: string;
    amount: Float;
}
export type Float = number;
export interface PaymentRequest {
    id: bigint;
    status: PaymentStatus;
    screenshotBlobId: string;
    userId: Principal;
    createdAt: bigint;
    adminNote: string;
    utrNumber: string;
    amount: Float;
}
export interface UserProfile {
    accountStatus: AccountStatus;
    username: string;
    balance: Float;
    email: string;
    apiKey: string;
}
export enum AccountStatus {
    active = "active",
    suspended = "suspended"
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    processing = "processing"
}
export enum PaymentStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum TransactionType {
    credit = "credit",
    debit = "debit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approvePayment(paymentRequestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string, description: string): Promise<bigint>;
    createService(categoryId: bigint, name: string, description: string, pricePerThousand: Float, minQuantity: bigint, maxQuantity: bigint, isActive: boolean): Promise<bigint>;
    deleteCategory(id: bigint): Promise<void>;
    deleteService(id: bigint): Promise<void>;
    getAllCategories(): Promise<Array<Category>>;
    getAllOrders(): Promise<Array<OrderRecord>>;
    getAllPaymentRequests(): Promise<Array<PaymentRequest>>;
    getAllServices(): Promise<Array<Service>>;
    getAllServicesAdmin(): Promise<Array<Service>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getMyOrders(): Promise<Array<OrderRecord>>;
    getMyPaymentRequests(): Promise<Array<PaymentRequest>>;
    getMyTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(serviceId: bigint, link: string, quantity: bigint): Promise<bigint>;
    rejectPayment(paymentRequestId: bigint, adminNote: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitPaymentRequest(screenshotBlobId: string, utrNumber: string, amount: Float): Promise<bigint>;
    updateCategory(id: bigint, name: string, description: string): Promise<void>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
    updateService(id: bigint, categoryId: bigint, name: string, description: string, pricePerThousand: Float, minQuantity: bigint, maxQuantity: bigint, isActive: boolean): Promise<void>;
    updateServiceActiveStatus(id: bigint, isActive: boolean): Promise<void>;
}
