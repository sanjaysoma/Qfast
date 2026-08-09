import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import appLogo from './assets/icon.png'

document.title = 'VDocQ'

document.querySelectorAll("link[rel*='icon']").forEach((link) => link.remove())

const iconHref = `${appLogo}?v=20260709`

const iconLink = document.createElement('link')
iconLink.rel = 'icon'
iconLink.type = 'image/png'
iconLink.href = iconHref
document.head.appendChild(iconLink)

const shortcutIconLink = document.createElement('link')
shortcutIconLink.rel = 'shortcut icon'
shortcutIconLink.type = 'image/png'
shortcutIconLink.href = iconHref
document.head.appendChild(shortcutIconLink)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


