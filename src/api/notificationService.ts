import api from "./axiosConfig";

const BASE_URL = "/v1/notifications";

export const notificationService = {

  // liste avec filtres
  getAll: async (params?: any) => {
    const res = await api.get(BASE_URL, { params });
    return res.data;
  },

  // get by id
  getById: async (id: number) => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  // create notification
  create: async (data: any) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },

  // mark as read
  markAsRead: async (id: number) => {
    const res = await api.patch(`${BASE_URL}/${id}/read`);
    return res.data;
  },

  // delete notification
  delete: async (id: number) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
  },

  // latest notifications (dashboard)
  getLatest: async () => {
    const res = await api.get(`${BASE_URL}/latest`);
    return res.data;
  },

  // polling notifications (temps réel)
  poll: async (lastDate?: string) => {
    const res = await api.get(`${BASE_URL}/poll`, {
      params: lastDate ? { lastDate } : {},
    });
    return res.data;
  },

  // count unread notifications
  countUnread: async () => {
    const res = await api.get(`${BASE_URL}/count/unread`);
    return res.data;
  },
};