import axios from "./axiosConfig";

import type { EmailCode } from "../types/emailCode";

const BASE_URL = "/v1/email-codes";

export const generateCode = async (email: string): Promise<EmailCode> => {
  const response = await axios.post(`${BASE_URL}/generate`, null, {
    params: { email },
  });
  return response.data;
};

// ✅ Renommé : verifyEmailCode → verifyCode
export const verifyCode = async (
  email: string,
  code: string
): Promise<EmailCode> => {
  const response = await axios.get(`${BASE_URL}/verify`, {
    params: { email, code },
  });
  return response.data;
};

export const deleteExpiredCodes = async (): Promise<void> => {
  await axios.delete(`${BASE_URL}/expired`);
};