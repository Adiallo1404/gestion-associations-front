import api from './axiosConfig';

export const getCotisations = async (filters: any = {}, page = 0, size = 10) => {
  const response = await api.get('/cotisations', { params: { ...filters, page, size } });
  return response.data;
};

export const getCotisationById = async (id: number) => {
  const res = await api.get(`/cotisations/${id}`);
  return res.data;
};

export const createCotisation = async (data: any) => {
  const res = await api.post('/cotisations', data);
  return res.data;
};

export const updateCotisation = async (id: number, data: any) => {
  const res = await api.put(`/cotisations/${id}`, data);
  return res.data;
};

export const deleteCotisation = async (id: number) => {
  await api.delete(`/cotisations/${id}`);
};