import axios from 'axios'
import keycloak from './keycloak'

/**
 * Centralized Axios instance used for all HTTP requests to the backend API.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor.
 *
 * Ensures that a valid Keycloak access token is attached to every
 * authenticated request sent to the backend.
 *
 * The token is refreshed automatically if it is close to expiration.
 */
api.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30)

        if (keycloak.token) {
          config.headers.Authorization = `Bearer ${keycloak.token}`
        }
      } catch (error) {
        console.error('Failed to refresh Keycloak access token.', error)
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor.
 *
 * Handles authentication failures globally. If the backend returns
 * HTTP 401 (Unauthorized), the current Keycloak session is terminated
 * and the user is redirected to the authentication page.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await keycloak.logout({
        redirectUri: window.location.origin,
      })
    }

    return Promise.reject(error)
  }
)

export default api