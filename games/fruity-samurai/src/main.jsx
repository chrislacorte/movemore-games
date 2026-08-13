import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/bangers'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'
import { assetPath } from './utils/assetPath'

document.documentElement.style.setProperty(
  '--intro-brush-url',
  `url(${assetPath('img/intro-section-brush.png')})`,
)
document.documentElement.style.setProperty(
  '--font-assassin-url',
  `url(${assetPath('fonts/AssassinNinja.otf')})`,
)

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('[Fruity Samurai] Offline-ready — all assets cached for offline play.')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
