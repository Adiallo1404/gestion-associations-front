import api from "./axiosConfig";
import type {
  EmailCodeDto,
  GenerateEmailCodeRequest,
  VerifyEmailCodeRequest,
} from "../types/emailCode";

const BASE_URL = "/v1/email-codes";

/**
 * Generate and send a verification code to an email address.
 */
export async function generateCode(
  payload: GenerateEmailCodeRequest
): Promise<EmailCodeDto> {
  const { data } = await api.post<EmailCodeDto>(
    `${BASE_URL}/generate`,
    null,
    {
      params: {
        email: payload.email,
      },
    }
  );

  return data;
}

/**
 * Verify a verification code.
 */
export async function verifyCode(
  payload: VerifyEmailCodeRequest
): Promise<EmailCodeDto> {
  const { data } = await api.post<EmailCodeDto>(
    `${BASE_URL}/verify`,
    null,
    {
      params: {
        email: payload.email,
        code: payload.code,
      },
    }
  );

  return data;
}

/**
 * Delete all expired verification codes.
 */
export async function deleteExpiredCodes(): Promise<void> {
  await api.delete<void>(`${BASE_URL}/expired`);
}

export const emailCodeService = {
  generateCode,
  verifyCode,
  deleteExpiredCodes,
};