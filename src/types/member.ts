export interface Member {
  id: number;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  address: string;

  postalAddress?: string | null;
  membershipDate?: string | null;

  active: boolean;

  associationId: number;
  associationName?: string | null;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  address: string;

  postalAddress?: string | null;
  membershipDate?: string | null;

  associationId: number;
}

export interface UpdateMemberRequest {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  address: string;

  postalAddress?: string | null;
  membershipDate?: string | null;

  active: boolean;

  associationId: number;
}