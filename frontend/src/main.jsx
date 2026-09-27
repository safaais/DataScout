// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#fff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      }}
    />
  </React.StrictMode>
)
