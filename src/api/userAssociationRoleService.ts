import axiosInstance from "./axiosConfig";
import type { UserAssociationRole, UserAssociationRolePage } from "../types/userAssociationRole";

const BASE_URL = "/user-association-roles";

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

// ✅ Récupérer rôle par user + association
export const getRoleByUserAndAssociation = async (
  userId: number,
  associationId: number
): Promise<UserAssociationRole> => {
  const response = await axiosInstance.get(`${BASE_URL}/by-user-association`, {
    params: { userId, associationId },
  });
  return response.data;
};

// ✅ Liste avec filtres + pagination
export const getRoles = async (
  page = 0,
  size = 10,
  userId?: number,
  associationId?: number,
  roleId?: number
): Promise<UserAssociationRolePage> => {
  const response = await axiosInstance.get(BASE_URL, {
    params: { page, size, userId, associationId, roleId },
  });
  return response.data;
};

// ✅ Supprimer
export const deleteRole = async (id: number): Promise<UserAssociationRole> => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return response.data;
};