export interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  email: string;
  postalAddress?: string;
  active?: boolean;
  associationId?: number;
  associationName?: string;
  membershipDate?: string;
}