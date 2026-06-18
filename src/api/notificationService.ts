import api from "./axiosConfig";
import type {
  NotificationDto,
  NotificationFilter,
  NotificationPageResponse,
} from "../types/notification";

const BASE_URL = "/v1/notifications";

/**
 * Get notifications with filters and pagination.
 * Backend:
 * GET /v1/notifications
 */
export async function getNotifications(
  params?: NotificationFilter
): Promise<NotificationPageResponse> {
  const { data } = await api.get<NotificationPageResponse>(BASE_URL, {
    params,
  });

  return data;
}

/**
 * Get notification details.
 * Backend:
 * GET /v1/notifications/{id}
 */
export async function getNotificationById(
  id: number
): Promise<NotificationDto> {
  const { data } = await api.get<NotificationDto>(`${BASE_URL}/${id}`);

  return data;
}

/**
 * Create a notification.
 * Backend:
 * POST /v1/notifications
 */
export async function createNotification(
  payload: NotificationDto
): Promise<NotificationDto> {
  const { data } = await api.post<NotificationDto>(
    BASE_URL,
    payload
  );

  return data;
}

/**
 * Mark notification as read.
 * Backend:
 * PATCH /v1/notifications/{id}/read
 */
export async function markNotificationAsRead(
  id: number
): Promise<NotificationDto> {
  const { data } = await api.patch<NotificationDto>(
    `${BASE_URL}/${id}/read`
  );

  return data;
}

/**
 * Delete a notification.
 * Backend:
 * DELETE /v1/notifications/{id}
 */
export async function deleteNotification(
  id: number
): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

/**
 * Get latest unread notifications.
 * Backend:
 * GET /v1/notifications/latest
 */
export async function getLatestNotifications(): Promise<
  NotificationDto[]
> {
  const { data } = await api.get<NotificationDto[]>(
    `${BASE_URL}/latest`
  );

  return data;
}

/**
 * Poll new unread notifications after a given date.
 * Backend:
 * GET /v1/notifications/poll
 */
export async function pollNotifications(
  lastDate?: string
): Promise<NotificationDto[]> {
  const { data } = await api.get<NotificationDto[]>(
    `${BASE_URL}/poll`,
    {
      params: lastDate ? { lastDate } : undefined,
    }
  );

  return data;
}

/**
 * Count unread notifications for the current user.
 * Backend:
 * GET /v1/notifications/count/unread
 */
export async function countUnreadNotifications(): Promise<number> {
  const { data } = await api.get<number>(
    `${BASE_URL}/count/unread`
  );

  return data;
}

export const notificationService = {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
  getLatestNotifications,
  pollNotifications,
  countUnreadNotifications,
};