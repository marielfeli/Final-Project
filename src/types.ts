
export type Role = 'admin' | 'owner' | 'tenant';
export type User = { id?: string; _id?: string; name: string; email: string; role: Role; phone?: string; address?: string; accountStatus?: string; verificationStatus?: string; verificationNote?: string; validIdUrl?: string; ownershipProofUrl?: string };
export type Property = {
  _id: string; name: string; location: string; price: number; type: string;
  image: string; photos?: string[]; description: string; amenities?: string[];
  ownerName?: string; ownerEmail?: string; bedrooms?: number; bathrooms?: number;
  maxOccupants?: number; status?: string; approvalStatus?: string; availability?: string;
};
export type Inquiry = { _id: string; propertyId: string; propertyName: string; ownerName: string; ownerEmail: string; tenantName: string; tenantEmail: string; message: string; status: string; createdAt: string };
export type Booking = { _id: string; propertyId: string; propertyName?: string; customerName?: string; customerEmail?: string; moveInDate: string; durationMonths: number; occupants: number; message?: string; status: string; rejectionReason?: string; createdAt?: string };
