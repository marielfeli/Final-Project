
import * as SecureStore from 'expo-secure-store';
import { Booking, Inquiry, Property, User } from './types';

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.102:5000/api'
).replace(/\/$/, '');

let tokenCache: string | null = null;

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function saveSession(token: string, user: User) {
  tokenCache = token;

  await SecureStore.setItemAsync('stayfinder_token', token);
  await SecureStore.setItemAsync('stayfinder_user', JSON.stringify(user));
}

export async function loadSession(): Promise<{
  token: string;
  user: User;
} | null> {
  const token = await SecureStore.getItemAsync('stayfinder_token');
  const raw = await SecureStore.getItemAsync('stayfinder_user');

  tokenCache = token;

  if (!token || !raw) return null;

  try {
    return {
      token,
      user: JSON.parse(raw) as User,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  tokenCache = null;

  await SecureStore.deleteItemAsync('stayfinder_token');
  await SecureStore.deleteItemAsync('stayfinder_user');
}

// ==========================================
// CENTRAL REQUEST HANDLER
// ==========================================

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (tokenCache) {
    headers.Authorization = `Bearer ${tokenCache}`;
  }

  let response: Response;

  try {
    const fullUrl = `${BASE_URL}${path}`;

    console.log(
      'StayFinder API Request:',
      options.method || 'GET',
      fullUrl,
    );

    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (error: any) {
    console.error('StayFinder Network Error:', error);

    throw new Error(
      `Unable to reach StayFinder server.\n` +
        `API: ${BASE_URL}${path}\n` +
        `Details: ${error?.message || 'Network request failed'}`,
    );
  }

  let body: any = {};

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    console.error('StayFinder API Error:', response.status, body);

    throw new Error(
      body.message ||
        body.debug ||
        `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}

// ==========================================
// API
// ==========================================

export const api = {
  // ========================================
  // AUTH
  // ========================================

  login: (email: string, password: string) =>
    request<{
      token: string;
      user: User;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // REGISTER - JSON ONLY
  // No FormData
  // No Valid ID upload
  // No Proof of Ownership upload
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
  }) =>
    request<{
      message: string;
      success?: boolean;
      user?: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || '',
        address: data.address || '',
      }),
    }),

  // ========================================
  // PROPERTIES
  // ========================================

  properties: () => request<Property[]>('/properties'),

  property: (id: string) =>
    request<Property>(`/properties/${id}`),

  ownerProperties: () =>
    request<Property[]>('/properties/mine'),

  createProperty: (data: Partial<Property>) =>
    request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProperty: (id: string, data: Partial<Property>) =>
    request<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProperty: (id: string) =>
    request<any>(`/properties/${id}`, {
      method: 'DELETE',
    }),

  // ========================================
  // FAVORITES
  // ========================================

  favorites: () => request<Property[]>('/favorites'),

  toggleFavorite: (id: string, saved: boolean) =>
    request<any>(`/favorites/${id}`, {
      method: saved ? 'DELETE' : 'POST',
    }),

  // ========================================
  // INQUIRIES
  // ========================================

  sendInquiry: (propertyId: string, message: string) =>
    request<any>('/inquiries', {
      method: 'POST',
      body: JSON.stringify({ propertyId, message }),
    }),

  ownerInquiries: () =>
    request<Inquiry[]>('/inquiries/my-inquiries'),

  tenantInquiries: () =>
    request<Inquiry[]>('/inquiries/tenant-inquiries'),

  markInquiryRead: (id: string) =>
    request<any>(`/inquiries/${id}/read`, {
      method: 'PATCH',
    }),

  // ========================================
  // BOOKINGS
  // ========================================

  createBooking: (data: Partial<Booking>) =>
    request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  customerBookings: () =>
    request<Booking[]>('/bookings/mine'),

  ownerBookings: () =>
    request<Booking[]>('/bookings/owner'),

  updateBooking: (
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
  ) =>
    request<any>(`/bookings/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        rejectionReason: reason,
      }),
    }),

  // ========================================
  // ADMIN
  // ========================================

  adminDashboard: () =>
    request<any>('/admin/dashboard'),

  adminUsers: () =>
    request<User[]>('/admin/users'),

  adminOwnerApplications: () =>
    request<User[]>('/admin/owner-applications'),

  adminVerifyOwner: (
    id: string,
    verificationStatus: string,
    verificationNote?: string,
  ) =>
    request<any>(`/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({
        verificationStatus,
        verificationNote,
      }),
    }),

  adminProperties: () =>
    request<Property[]>('/admin/properties'),

  adminDecideProperty: (
    id: string,
    status: string,
    reason?: string,
  ) =>
    request<any>(`/admin/properties/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  adminDecideUser: (id: string, status: string) =>
    request<any>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        accountStatus: status,
      }),
    }),

  adminGetOwnerDocument: (
    id: string,
    documentType: 'validId' | 'ownershipProof',
  ) =>
    request<any>(
      `/admin/users/${id}/documents/${documentType}`,
    ),

  // ========================================
  // CHAT
  // ========================================

  startConversation: (propertyId: string) =>
    request<any>(`/chat/start/${propertyId}`, {
      method: 'POST',
    }),

  getConversations: () =>
    request<any[]>('/chat'),

  getMessages: (conversationId: string) =>
    request<any[]>(`/chat/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string) =>
    request<any>(`/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  markMessagesAsRead: (conversationId: string) =>
    request<any>(`/chat/${conversationId}/read`, {
      method: 'PATCH',
    }),

  // ========================================
  // NOTIFICATIONS
  // ========================================

  getNotifications: () =>
    request<{
      notifications: any[];
      unreadCount: number;
    }>('/notifications'),

  markNotificationAsRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: () =>
    request<any>('/notifications/read-all', {
      method: 'PATCH',
    }),

  deleteNotification: (id: string) =>
    request<any>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};
