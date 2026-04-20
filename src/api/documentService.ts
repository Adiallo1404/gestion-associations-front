import api from "./axiosConfig";
import type { DocumentDto, DocumentPageResponse } from "../types/document";

const BASE_URL = "/documents";

export const uploadDocument = async (dto: DocumentDto): Promise<DocumentDto> => {
  const response = await api.post<DocumentDto>(BASE_URL, dto);
  return response.data;
};

export const getDocumentById = async (id: number): Promise<DocumentDto> => {
  const response = await api.get<DocumentDto>(`${BASE_URL}/${id}`);
  return response.data;
};

export const getDocumentsByAssociation = async (
  associationId: number,
  page = 0,
  size = 10
): Promise<DocumentPageResponse> => {
  const response = await api.get<DocumentPageResponse>(BASE_URL, {
    params: { associationId, page, size },
  });
  return response.data;
};

export const deactivateDocument = async (id: number): Promise<DocumentDto> => {
  const response = await api.patch<DocumentDto>(`${BASE_URL}/${id}/deactivate`);
  return response.data;
};

export const getDownloadUrl = (nomFichier: string): string => {
  return `/v1/documents/download/${nomFichier}`;
};