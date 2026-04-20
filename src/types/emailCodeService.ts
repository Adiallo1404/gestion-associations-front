import api from './axiosConfig';
import type { EmailCode } from '../types/emailCode';

export async function generateEmailCode(email: string): Promise<EmailCode> {
  const response = await api.post<EmailCode>(
    '/v1/email-codes/generate',
    null,
    { params: { email } }
  );
  return response.data;
}

export async function verifyEmailCode(email: string, code: string): Promise<EmailCode> {
  const response = await api.get<EmailCode>(
    '/v1/email-codes/verify',
    { params: { email, code } }
  );
  return response.data;
}

export async function deleteExpiredEmailCodes(): Promise<void> {
  await api.delete('/v1/email-codes/expired');
}