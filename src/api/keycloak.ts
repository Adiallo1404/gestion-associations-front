import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
})

console.log('Keycloak URL:', import.meta.env.VITE_KEYCLOAK_URL)
console.log('Keycloak Realm:', import.meta.env.VITE_KEYCLOAK_REALM)
console.log('Keycloak Client ID:', import.meta.env.VITE_KEYCLOAK_CLIENT_ID)

export const initKeycloak = async (): Promise<boolean> => {
  return await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
  })
}

export default keycloak