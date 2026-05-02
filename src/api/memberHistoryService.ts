import axios from "./axiosConfig";
import type { StatutMembre } from "../types/memberHistory";

export interface MemberHistory {
  id?: number;
  ancienStatut?: StatutMembre;
  nouveauStatut: StatutMembre;
  motif?: string;
  dateChangement?: string;
  memberId: number;
  associationId: number;
  modifieParId?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const BASE_URL = "/v1/member-histories"

export const getMemberHistories = async (params: {
  memberId?: number;
  associationId?: number;
  nouveauStatut?: StatutMembre;
  modifieParId?: number;
  page?: number;
  size?: number;
}) => {
  const response = await axios.get<PageResponse<MemberHistory>>(BASE_URL, {
    params,
  });
  return response.data;
};

export const getMemberHistoryById = async (id: number) => {
  const response = await axios.get<MemberHistory>(`${BASE_URL}/${id}`);
  return response.data;
};

export const createMemberHistory = async (data: MemberHistory) => {
  const response = await axios.post<MemberHistory>(BASE_URL, data);
  return response.data;
};

export const deleteMemberHistory = async (id: number) => {
  const response = await axios.delete<MemberHistory>(`${BASE_URL}/${id}`);
  return response.data;
};