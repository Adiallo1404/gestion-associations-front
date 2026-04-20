export interface EmailCode {
  id?: number;
  email: string;
  code?: string;
  dateExpiration?: string;
  userId?: number;
}