import api from "./axiosConfig";
import type {
  EmailEnvoyeDto,
  EmailEnvoyeFilter,
  EmailEnvoyePageResponse,
  SendContactEmailRequest,
  SendEmailRequest,
} from "../types/emailEnvoye";

const BASE_URL = "/v1/emails-envoyes";

/**
 * Sends an email from the authenticated back-office.
 * The send status is computed server-side after the Brevo API call.
 */
export async function sendEmail(
  payload: SendEmailRequest
): Promise<EmailEnvoyeDto> {
  const { data } = await api.post<EmailEnvoyeDto>(BASE_URL, payload);
  return data;
}

/**
 * Sends a message from the public contact form.
 * This endpoint does not require an authenticated back-office context.
 */
export async function sendContactEmail(
  payload: SendContactEmailRequest
): Promise<EmailEnvoyeDto> {
  const { data } = await api.post<EmailEnvoyeDto>(
    `${BASE_URL}/contact`,
    payload
  );

  return data;
}

export async function getEmailById(id: number): Promise<EmailEnvoyeDto> {
  const { data } = await api.get<EmailEnvoyeDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function getEmailsByFilters(
  params: EmailEnvoyeFilter = {}
): Promise<EmailEnvoyePageResponse> {
  const { data } = await api.get<EmailEnvoyePageResponse>(BASE_URL, {
    params,
  });

  return data;
}

/**
 * Deletes a sent email record.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteEmail(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export const emailEnvoyeService = {
  sendEmail,
  sendContactEmail,
  getEmailById,
  getEmailsByFilters,
  deleteEmail,
};