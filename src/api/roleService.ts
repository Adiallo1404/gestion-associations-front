import api from "./axiosConfig";

const BASE_URL = "/roles";

export const roleService = {
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
  addPermission: async (roleName: string, permission: string) => {
    const res = await api.patch(`${BASE_URL}/${roleName}/permissions/add`, null, { params: { permission } });
    return res.data;
  },
  removePermission: async (roleName: string, permission: string) => {
    const res = await api.patch(`${BASE_URL}/${roleName}/permissions/remove`, null, { params: { permission } });
    return res.data;
  },
  getPermissions: async (roleName: string) => {
    const res = await api.get(`${BASE_URL}/${roleName}/permissions`);
    return res.data;
  },
};