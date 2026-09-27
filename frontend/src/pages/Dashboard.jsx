// src/pages/Dashboard.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import UploadSection from '../components/UploadSection'
import DataPreparation from '../components/DataPreparation'
import TargetConfig from '../components/TargetConfig'
import ModelResults from '../components/ModelResults'
import SHAPDashboard from '../components/SHAPDashboard'

const STEPS = ['Upload + Prepare', 'Target + Train', 'Results + Predict']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: active ? '#eff6ff' : done ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${active ? '#4f7ef8' : done ? '#22c55e' : '#e2e8f0'}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 13 : 11, fontWeight: 800,
                background: active ? '#4f7ef8' : done ? '#22c55e' : '#e2e8f0',
                color: active || done ? '#fff' : '#94a3b8',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#4f7ef8' : done ? '#22c55e' : '#94a3b8' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 2, background: done ? '#22c55e' : '#e2e8f0', flexShrink: 0 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [step, setStep] = useState(0)
  const { sessionId, filename, dataInfo, error, setError } = useApp()

  const next = () => setStep(s => Math.min(s + 1, 2))
  const back = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto' }}>
      <StepBar current={step} />

      {/* Error banner */}
      {error && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10,
          padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── Step 0: Upload + Prepare ── */}
      {step === 0 && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!sessionId ? (
            <UploadSection />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 22 }}>📊</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{filename}</div>
                  <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>{dataInfo?.rows?.toLocaleString()} rows · {dataInfo?.columns} columns</div>
                </div>
                <button onClick={() => window.location.reload()} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #86efac', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>Change file</button>
              </div>
              <DataPreparation />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={next} disabled={!sessionId} style={{
              padding: '11px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
              background: sessionId ? '#4f7ef8' : '#e2e8f0', color: sessionId ? '#fff' : '#94a3b8',
              cursor: sessionId ? 'pointer' : 'not-allowed',
            }}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 1: Target + Train ── */}
      {step === 1 && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TargetConfig onTrained={next} />
          <button onClick={back} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Step 2: Results + SHAP Only ── */}
      {step === 2 && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ModelResults />
          
          {/* ✅ SHAP only - No Prediction Form */}
          <SHAPDashboard />
          
          <button onClick={back} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}