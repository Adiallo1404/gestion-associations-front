import api from "./axiosConfig";
import type {
  CreateUserDto,
  UpdateMyProfileRequest,
  UpdateUserRequest,
  UserDto,
  UserFilter,
  UserPageResponse,
} from "../types/user";

const BASE_URL = "/v1/users";

export async function getMyProfile(): Promise<UserDto> {
  const { data } = await api.get<UserDto>(`${BASE_URL}/me`);
  return data;
}

export async function updateMyProfile(
  payload: UpdateMyProfileRequest
): Promise<UserDto> {
  const { data } = await api.put<UserDto>(`${BASE_URL}/me`, payload);
  return data;
}

export async function getUsers(
  filter: UserFilter = {},
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<UserPageResponse> {
  const { data } = await api.get<UserPageResponse>(BASE_URL, {
    params: {
      ...filter,
      page,
      size,
      sort,
    },
  });

  return data;
}

export async function getUserById(id: number): Promise<UserDto> {
  const { data } = await api.get<UserDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function getUserByEmail(email: string): Promise<UserDto> {
  const { data } = await api.get<UserDto>(`${BASE_URL}/email`, {
    params: { email },
  });

  return data;
}

/**
 * Creates a new user account.
 * Password is only sent on creation and is never returned by the API.
 */
export async function createUser(
  payload: CreateUserDto
): Promise<UserDto> {
  const { data } = await api.post<UserDto>(BASE_URL, payload);
  return data;
}

/**
 * Updates an existing user.
 * Password and role assignments are managed by dedicated backend workflows.
 */
export async function updateUser(
  id: number,
  payload: UpdateUserRequest
): Promise<UserDto> {
  const { data } = await api.put<UserDto>(`${BASE_URL}/${id}`, payload);
  return data;
}

/**
 * Deletes a user.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteUser(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export const userService = {
  getMyProfile,
  updateMyProfile,
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};