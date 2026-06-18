import api from "./axiosConfig";

const BASE_URL = "/v1/members";

export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalAddress?: string | null;
  membershipDate?: string | null;
  active: boolean;
  associationId: number;
  associationName?: string | null;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalAddress?: string | null;
  membershipDate?: string | null;
  associationId: number;
}

export interface UpdateMemberRequest extends CreateMemberRequest {
  active: boolean;
}

export interface MemberFilter {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  associationId?: number;
  membershipDateFrom?: string;
  membershipDateTo?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const memberService = {
  async getAll(params?: MemberFilter): Promise<PageResponse<Member>> {
    const { data } = await api.get<PageResponse<Member>>(BASE_URL, { params });
    return data;
  },

  async getById(id: number): Promise<Member> {
    const { data } = await api.get<Member>(`${BASE_URL}/${id}`);
    return data;
  },

  async getByEmail(email: string): Promise<Member> {
    const { data } = await api.get<Member>(`${BASE_URL}/email`, {
      params: { email },
    });
    return data;
  },

  async create(payload: CreateMemberRequest): Promise<Member> {
    const { data } = await api.post<Member>(BASE_URL, payload);
    return data;
  },

  async update(id: number, payload: UpdateMemberRequest): Promise<Member> {
    const { data } = await api.put<Member>(`${BASE_URL}/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete<void>(`${BASE_URL}/${id}`);
  },
};

// Backward-compatible export used by older pages such as DashboardPage.
export const getMembers = memberService.getAll;