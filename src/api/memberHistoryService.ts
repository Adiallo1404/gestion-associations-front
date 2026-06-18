import api from "./axiosConfig";
import type {
  CreateMemberHistoryRequest,
  MemberHistoryDto,
  MemberHistoryFilter,
  MemberHistoryPageResponse,
} from "../types/memberHistory";

const BASE_URL = "/v1/member-histories";

export async function getMemberHistories(
  params: MemberHistoryFilter = {}
): Promise<MemberHistoryPageResponse> {
  const { data } = await api.get<MemberHistoryPageResponse>(BASE_URL, {
    params,
  });

  return data;
}

export async function getMemberHistoryById(
  id: number
): Promise<MemberHistoryDto> {
  const { data } = await api.get<MemberHistoryDto>(`${BASE_URL}/${id}`);
  return data;
}

/**
 * Creates an immutable member status history entry.
 * The modifier user is always resolved server-side from the security context.
 */
export async function createMemberHistory(
  payload: CreateMemberHistoryRequest
): Promise<MemberHistoryDto> {
  const { data } = await api.post<MemberHistoryDto>(BASE_URL, payload);
  return data;
}

/**
 * Deletes a member history entry.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteMemberHistory(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export const memberHistoryService = {
  getMemberHistories,
  getMemberHistoryById,
  createMemberHistory,
  deleteMemberHistory,
};