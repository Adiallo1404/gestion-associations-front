import api from "./axiosConfig";
import type {
  CreateDocumentMetadataRequest,
  DocumentDto,
  DocumentPageResponse,
  UploadDocumentMetadataRequest,
} from "../types/document";

const BASE_URL = "/v1/documents";

export async function uploadDocumentMetadata(
  payload: CreateDocumentMetadataRequest
): Promise<DocumentDto> {
  const { data } = await api.post<DocumentDto>(BASE_URL, payload);
  return data;
}

export async function uploadDocumentFile(
  file: File,
  metadata: UploadDocumentMetadataRequest
): Promise<DocumentDto> {
  const formData = new FormData();

  formData.append("file", file);

  // Spring expects this part as JSON: @RequestPart("metadata") DocumentDto
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    })
  );

  const { data } = await api.post<DocumentDto>(
    `${BASE_URL}/upload-file`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function getDocumentById(id: number): Promise<DocumentDto> {
  const { data } = await api.get<DocumentDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function getDocumentsByAssociation(
  associationId: number,
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<DocumentPageResponse> {
  const { data } = await api.get<DocumentPageResponse>(BASE_URL, {
    params: {
      associationId,
      page,
      size,
      sort,
    },
  });

  return data;
}

export async function deactivateDocument(id: number): Promise<void> {
  await api.patch<void>(`${BASE_URL}/${id}/deactivate`);
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export function getDownloadUrl(nomFichier: string): string {
  const baseUrl = api.defaults.baseURL ?? "";
  return `${baseUrl}${BASE_URL}/download/${encodeURIComponent(nomFichier)}`;
}

export const documentService = {
  uploadDocumentMetadata,
  uploadDocumentFile,
  getDocumentById,
  getDocumentsByAssociation,
  deactivateDocument,
  deleteDocument,
  getDownloadUrl,
};