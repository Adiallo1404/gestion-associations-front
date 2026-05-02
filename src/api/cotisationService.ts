import api from './axiosConfig';

const BASE = '/v1/cotisations';

export const getCotisations = async (filters: any = {}, page = 0, size = 10) => {
  const response = await api.get(BASE, { params: { ...filters, page, size } });
  return response.data;
};

export const getCotisationById = async (id: number) => {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
};

export const createCotisation = async (data: any) => {
  const res = await api.post(BASE, data);
  return res.data;
};

export const updateCotisation = async (id: number, data: any) => {
  const res = await api.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteCotisation = async (id: number) => {
  await api.delete(`${BASE}/${id}`);
};