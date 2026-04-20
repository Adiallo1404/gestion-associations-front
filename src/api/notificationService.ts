import api from "./axiosConfig";

const BASE_URL = "/notifications";

export const notificationService = {
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

  markAsRead: async (id: number) => {
    const res = await api.patch(`${BASE_URL}/${id}/read`);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
  },
};