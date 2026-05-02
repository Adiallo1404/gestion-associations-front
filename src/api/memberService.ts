import api from "./axiosConfig";

const BASE_URL = "/v1/members";

export const getMembers = async (params?: any) => {
  const res = await api.get(BASE_URL, { params });
  return res.data;
};

export const memberService = {
  getAll: async (params?: any) => {
    const res = await api.get(BASE_URL, { params });
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },

  update: async (id: number, data: any) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};