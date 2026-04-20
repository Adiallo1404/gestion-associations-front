import api from "./axiosConfig";

const BASE_URL = "/cotisation-configs";

export const cotisationConfigService = {
  create: async (data: any) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },
  getByAssociation: async (associationId: number) => {
    const res = await api.get(`${BASE_URL}/association/${associationId}`);
    return res.data;
  },
  update: async (associationId: number, data: any) => {
    const res = await api.put(`${BASE_URL}/association/${associationId}`, data);
    return res.data;
  },
  delete: async (associationId: number) => {
    const res = await api.delete(`${BASE_URL}/association/${associationId}`);
    return res.data;
  },
};