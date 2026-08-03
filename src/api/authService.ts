
import keycloak from './keycloak'

export const authService = {
  login: async (): Promise<void> => {
    await keycloak.login()
  },

  register: async (): Promise<void> => {
    await keycloak.register()
  },

  logout: async (): Promise<void> => {
    await keycloak.logout({
      redirectUri: window.location.origin,
    })
  },

  getToken: (): string | undefined => {
    return keycloak.token
  },

  isAuthenticated: (): boolean => {
    return !!keycloak.authenticated
  },

  updateToken: async (): Promise<boolean> => {
    return await keycloak.updateToken(30)
  },

  forgotPassword: async (): Promise<void> => {
    await keycloak.login({
      action: 'UPDATE_PASSWORD',
    })
  },
}