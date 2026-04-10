import api from './axiosConfig';
import type { Member } from "../types/member";

export const getMembers = async (filters: any = {}, page = 0, size = 10) => {
  const response = await api.get('/members', { params: { ...filters, page, size } });
  return response.data;
};

export const getMemberById = async (id: number) => {
  const res = await api.get(`/members/${id}`);
  return res.data;
};

export const createMember = async (data: Member) => {
  const res = await api.post('/members', data);
  return res.data;
};

export const updateMember = async (id: number, data: Member) => {
  const res = await api.put(`/members/${id}`, data);
  return res.data;
};

export const deleteMember = async (id: number) => {
  await api.delete(`/members/${id}`);
};