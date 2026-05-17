import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize dark mode from persisted state
const stored = localStorage.getItem('renovation-planner-v1')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    // zustand persist wraps state in { state: {...} }
    const isDark = parsed?.state?.isDarkMode ?? false
    if (isDark) document.documentElement.classList.add('dark')
  } catch {}
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
