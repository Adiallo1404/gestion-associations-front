import axiosInstance from "./axiosConfig";
import type { EmailEnvoyeDto, EmailEnvoyePageResponse } from "../types/emailEnvoye";

const BASE_URL = "/v1/emails-envoyes";

export const sendEmail = async (dto: EmailEnvoyeDto): Promise<EmailEnvoyeDto> => {
  const response = await axiosInstance.post<EmailEnvoyeDto>(BASE_URL, dto);
  return response.data;
};

// 🟢 Formulaire de contact public — sans token
export const sendContactEmail = async (dto: {
  nomExpediteur: string;
  destinataire: string;
  sujet: string;
  contenu: string;
}): Promise<EmailEnvoyeDto> => {
  const response = await axiosInstance.post<EmailEnvoyeDto>(`${BASE_URL}/contact`, dto);
  return response.data;
};

export const getEmailById = async (id: number): Promise<EmailEnvoyeDto> => {
  const response = await axiosInstance.get<EmailEnvoyeDto>(`${BASE_URL}/${id}`);
  return response.data;
};

export const getEmailsByFilters = async (params: {
  nomExpediteur?: string;
  destinataire?: string;
  sujet?: string;
  statutEnvoi?: string;
  associationId?: number;
  page?: number;
  size?: number;
}): Promise<EmailEnvoyePageResponse> => {
  const response = await axiosInstance.get<EmailEnvoyePageResponse>(BASE_URL, { params });
  return response.data;
};

export const deleteEmail = async (id: number): Promise<EmailEnvoyeDto> => {
  const response = await axiosInstance.delete<EmailEnvoyeDto>(`${BASE_URL}/${id}`);
  return response.data;
};