
import * as SecureStore from 'expo-secure-store';
import { Booking, Inquiry, Property, User } from './types';

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:5000/api'
).replace(/\/$/, '');

let tokenCache: string | null = null;

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
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to StayFinder server. Check API URL: ${BASE_URL}`,
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.message || `Request failed (${response.status})`,
    );
  }

  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{
      token: string;
      user: User;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
    validId?: {
      uri: string;
      name: string;
      type: string;
    };
    ownershipProof?: {
      uri: string;
      name: string;
      type: string;
    };
  }) => {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('role', data.role);

    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);

    if (data.validId) {
      formData.append(
        'validId',
        {
          uri: data.validId.uri,
          name: data.validId.name,
          type: data.validId.type,
        } as unknown as Blob,
      );
    }

    if (data.ownershipProof) {
      formData.append(
        'ownershipProof',
        {
          uri: data.ownershipProof.uri,
          name: data.ownershipProof.name,
          type: data.ownershipProof.type,
        } as unknown as Blob,
      );
    }

    return request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: formData,
    });
  },

  properties: () => request<Property[]>('/properties'),

  property: (id: string) =>
    request<Property>(`/properties/${id}`),

  favorites: () => request<Property[]>('/favorites'),

  toggleFavorite: (id: string, saved: boolean) =>
    request<any>(`/favorites/${id}`, {
      method: saved ? 'DELETE' : 'POST',
    }),

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
};
