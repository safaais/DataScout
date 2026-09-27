// src/App.jsx
import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Dashboard     from './pages/Dashboard'
import ChatInterface from './pages/ChatInterface'
import { healthCheck } from './services/api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'chat',      label: 'Chat',      icon: '💬' },
]

const HISTORY_COLORS = ['#7c5cfa','#22c55e','#f59e0b','#a855f7','#0ea5e9','#ef4444','#10b981']

function timeAgo(date) {
  const s = Math.round((Date.now() - date) / 1000)
  if (s < 60)    return 'now'
  if (s < 3600)  return Math.round(s / 60) + 'm'
  if (s < 86400) return Math.round(s / 3600) + 'h'
  return Math.round(s / 86400) + 'd'
}

function Inner() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [health,    setHealth]    = useState(null)
  const { filename, dataInfo, clearSession, history } = useApp()

  useEffect(() => {
    healthCheck()
      .then(() => setHealth(true))
      .catch(() => setHealth(false))
  }, [])

  const navBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', border: 'none', borderRadius: 9,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: active ? '#e8eaf6' : '#9ca3af',
    fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: 'pointer', width: '100%', textAlign: 'left',
    fontFamily: 'var(--sans)', transition: 'all .15s',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Dark Sidebar ── */}
      <aside style={{
        width: 220, minWidth: 220,
        background: '#1a1d2e',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#4f7ef8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔬</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#e8eaf6', letterSpacing: '-.2px' }}>DataScout</div>
              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>AI Data Analyst</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 10px 6px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.7px', padding: '0 4px', marginBottom: 6 }}>Navigate</div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={navBtn(activeTab === t.id)}>
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              {t.label}
              {activeTab === t.id && (
                <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#4f7ef8' }} />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '8px 14px' }} />

        {/* History */}
        <div style={{ padding: '0 10px 6px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.7px', padding: '0 4px', marginBottom: 6 }}>History</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {(!history || history.length === 0) ? (
            <div style={{ fontSize: 12, color: '#4b5563', padding: '4px 8px', fontStyle: 'italic' }}>No history yet</div>
          ) : (
            history.map((h, i) => (
              <div
                key={h.id}
                onClick={() => setActiveTab(h.tab || 'chat')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: HISTORY_COLORS[i % HISTORY_COLORS.length], flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.label}</div>
                <div style={{ fontSize: 10, color: '#4b5563', flexShrink: 0 }}>{timeAgo(h.ts)}</div>
              </div>
            ))
          )}
        </div>

        {/* Bottom: file info + health */}
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          {filename && (
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '9px 11px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {dataInfo?.rows?.toLocaleString()} rows · {dataInfo?.columns} cols
              </div>
              <button
                onClick={clearSession}
                style={{ marginTop: 6, background: 'none', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#6b7280', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              >
                Clear session
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: health === true ? '#22c55e' : health === false ? 'var(--danger)' : '#6b7280' }} />
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
              {health === true ? 'Backend connected' : health === false ? 'Backend unreachable' : 'Checking...'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main (NO top tab bar) ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header bar — title only, no tabs */}
        <div style={{
          background: 'var(--white)', borderBottom: '1px solid var(--bdr)',
          padding: '13px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
              {activeTab === 'dashboard' ? 'Dashboard' : 'Chat'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1, fontWeight: 500 }}>
              {filename ? `${filename} is loaded and ready` : 'Upload a file to get started'}
            </div>
          </div>
          {filename && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              File ready
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'dashboard' ? <Dashboard /> : <ChatInterface />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return <AppProvider><Inner /></AppProvider>
}
