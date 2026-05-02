import axiosInstance from "./axiosConfig";
import type { UserAssociationRole, UserAssociationRolePage } from "../types/userAssociationRole";

const BASE_URL = "/v1/user-association-roles";

// ✅ Assigner un rôle
export const assignRole = async (data: UserAssociationRole): Promise<UserAssociationRole> => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

// ✅ Mettre à jour rôle
export const updateRole = async (id: number, data: UserAssociationRole): Promise<UserAssociationRole> => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// ✅ FIX : bonne URL — le controller attend userId + associationId en params sur GET /
export const getRoleByUserAndAssociation = async (
  userId: number,
  associationId: number
): Promise<UserAssociationRole> => {
  const response = await axiosInstance.get(BASE_URL, {
    params: { userId, associationId },
  });
  return response.data;
};

// ✅ FIX : liste paginée sur /search et non sur /
export const getRoles = async (
  page = 0,
  size = 10,
  userId?: number,
  associationId?: number,
  roleId?: number
): Promise<UserAssociationRolePage> => {
  const response = await axiosInstance.get(`${BASE_URL}/search`, {
    params: { page, size, userId, associationId, roleId },
  });
  return response.data;
};

// ✅ Supprimer
export const deleteRole = async (id: number): Promise<UserAssociationRole> => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return response.data;
};