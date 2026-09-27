// src/components/DataPreparation.jsx
import { useState } from 'react'
import { preprocessData } from '../services/api'
import { useApp } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

const MISSING_OPTS = [
  { value: 'drop',        label: 'Drop rows',      desc: 'Remove rows that have missing values' },
  { value: 'fill_mean',   label: 'Fill with mean',  desc: 'Replace missing values with column average' },
  { value: 'interpolate', label: 'Interpolate',     desc: 'Estimate missing values from neighbours' },
]

const NORM_OPTS = [
  { value: 'none',     label: 'None' },
  { value: 'standard', label: 'StandardScaler' },
  { value: 'minmax',   label: 'MinMaxScaler' },
]

const card = { background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '18px 20px' }
const label = { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }

export default function DataPreparation({ onDone }) {
  const { sessionId, setError } = useApp()
  const [missing,    setMissing]    = useState('drop')
  const [removeDups, setRemoveDups] = useState(true)
  const [normalize,  setNormalize]  = useState('none')
  const [applying,   setApplying]   = useState(false)
  const [done,       setDone]       = useState(false)

  const apply = async () => {
    setApplying(true); setError(null)
    try {
      await preprocessData(sessionId, {
        missing_strategy:   missing,
        remove_duplicates:  removeDups,
        normalize_strategy: normalize,
      })
      setDone(true)
      onDone?.()
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Preprocessing failed')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Missing values */}
      <div style={card}>
        <div style={label}>Handle missing values</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MISSING_OPTS.map(o => (
            <div key={o.value} onClick={() => setMissing(o.value)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
              border: `1.5px solid ${missing === o.value ? 'var(--ac)' : 'var(--bdr)'}`,
              borderRadius: 10, cursor: 'pointer',
              background: missing === o.value ? '#eff6ff' : 'var(--surface)',
              transition: 'all .15s',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', marginTop: 1, flexShrink: 0,
                border: `2px solid ${missing === o.value ? 'var(--ac)' : 'var(--bdr)'}`,
                background: missing === o.value ? 'var(--ac)' : 'transparent',
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{o.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remove duplicates */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Remove duplicate rows</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Delete identical rows to avoid skewed results</div>
          </div>
          <div onClick={() => setRemoveDups(v => !v)} style={{
            width: 44, height: 24, borderRadius: 12,
            background: removeDups ? 'var(--ac)' : 'var(--bdr)',
            cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 3, left: removeDups ? 22 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.15)',
            }} />
          </div>
        </div>
      </div>

      {/* Normalize */}
      <div style={card}>
        <div style={label}>Normalize data</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {NORM_OPTS.map(o => (
            <div key={o.value} onClick={() => setNormalize(o.value)} style={{
              flex: 1, padding: '9px 8px', textAlign: 'center',
              border: `1.5px solid ${normalize === o.value ? 'var(--ac)' : 'var(--bdr)'}`,
              borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: normalize === o.value ? 'var(--ac)' : 'var(--text2)',
              background: normalize === o.value ? '#eff6ff' : 'var(--surface)',
              transition: 'all .15s',
            }}>{o.label}</div>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={apply}
        disabled={applying || done}
        style={{
          padding: '12px', borderRadius: 12, border: 'none', cursor: applying || done ? 'not-allowed' : 'pointer',
          background: done ? 'var(--ac2)' : 'var(--ac)', color: '#fff',
          fontSize: 14, fontWeight: 800, transition: 'all .15s',
          opacity: applying ? 0.7 : 1,
        }}
      >
        {applying ? <LoadingSpinner text="Applying..." inline /> : done ? '✓ Applied successfully' : 'Apply changes'}
      </button>
    </div>
  )
}
