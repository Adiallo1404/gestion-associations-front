import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initKeycloak } from './api/keycloak'

initKeycloak()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Erreur lors de l\'initialisation de Keycloak :', error)
  })