// src/components/TargetConfig.jsx
import { useState, useEffect } from 'react'
import { trainAllModels, timeseriesForecast } from '../services/api'
import { useApp } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

const PROBLEM_TYPES = [
  { value: 'regression', label: 'Regression', emoji: '📈', desc: 'Predict a number (price, score, revenue)' },
  { value: 'classification', label: 'Classification', emoji: '🏷️', desc: 'Predict a category (yes/no, label, class)' },
  { value: 'timeseries', label: 'Time Series', emoji: '⏳', desc: 'Forecast future values over time' },
]

const FORECAST_METHODS = [
  { value: 'prophet', label: 'Prophet (Facebook)', emoji: '📅', desc: 'Best for patterns & seasonality' },
  { value: 'arima', label: 'ARIMA', emoji: '📊', desc: 'Best for trends' },
  { value: 'sma', label: 'Simple Moving Average', emoji: '📈', desc: 'Fast & simple' },
]

export default function TargetConfig({ onTrained }) {
  const { sessionId, dataInfo, setModelResults, setError, setLoading } = useApp()
  const columns = dataInfo?.column_names || []

  const [target, setTarget] = useState('')
  const [problem, setProblem] = useState('regression')
  const [horizon, setHorizon] = useState(30)
  const [dateColumn, setDateColumn] = useState('')
  const [forecastMethod, setForecastMethod] = useState('prophet')
  const [training, setTraining] = useState(false)

  // Auto-select target column
  useEffect(() => {
    if (columns.length > 0 && !target) {
      const preferred = columns.find(c => 
        c.toLowerCase().includes('price') || 
        c.toLowerCase().includes('value') || 
        c.toLowerCase().includes('target') ||
        c.toLowerCase().includes('close') ||
        c.toLowerCase().includes('meantemp')
      )
      setTarget(preferred || columns[columns.length - 1])
    }
  }, [columns, target])

  // Auto-detect date column for time series
  useEffect(() => {
    if (problem === 'timeseries' && columns.length > 0 && !dateColumn) {
      const dateCol = columns.find(c => 
        c.toLowerCase() === 'date' || 
        c.toLowerCase().includes('date') || 
        c.toLowerCase().includes('time') ||
        c.toLowerCase() === 'datetime'
      )
      if (dateCol) {
        setDateColumn(dateCol)
      }
    }
  }, [problem, columns, dateColumn])

  const train = async () => {
    console.log("🔍 Training - sessionId:", sessionId)
    console.log("🔍 Training - target:", target)
    console.log("🔍 Training - problem:", problem)
    console.log("🔍 Training - dateColumn:", dateColumn)
    console.log("🔍 Training - horizon:", horizon)
    console.log("🔍 Training - method:", forecastMethod)
    
    if (!sessionId) {
      setError('Session expired. Please upload a file again.')
      return
    }
    if (!target) {
      setError('Please select a target column')
      return
    }
    if (problem === 'timeseries' && !dateColumn) {
      setError('Please select a date column for time series forecasting')
      return
    }

    setTraining(true)
    setLoading(true)
    setError(null)

    try {
      let result
      if (problem === 'timeseries') {
        result = await timeseriesForecast(sessionId, target, horizon, dateColumn, forecastMethod)
      } else {
        result = await trainAllModels(sessionId, target, problem, horizon)
      }
      
      console.log("✅ Training result:", result)
      
      if (result) {
        setModelResults(result)
      }
      
      if (onTrained) {
        onTrained(result)
      }
      
    } catch (err) {
      console.error("❌ Training error:", err)
      const errorMsg = err.response?.data?.detail || err.message || 'Training failed'
      setError(errorMsg)
    } finally {
      setTraining(false)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Target column */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
          🎯 Target column — what to predict
        </div>
        <select
          value={target}
          onChange={e => setTarget(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600,
            background: 'white', cursor: 'pointer'
          }}
        >
          <option value="">— Select a column —</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {target && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            📊 Predicting: <strong style={{ color: '#4f7ef8' }}>{target}</strong>
          </div>
        )}
      </div>

      {/* Problem type */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
          🧠 Problem type
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PROBLEM_TYPES.map(p => (
            <div key={p.value} onClick={() => setProblem(p.value)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              border: `1.5px solid ${problem === p.value ? '#4f7ef8' : '#e2e8f0'}`,
              borderRadius: 10, cursor: 'pointer',
              background: problem === p.value ? '#eff6ff' : 'white',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${problem === p.value ? '#4f7ef8' : '#cbd5e1'}`,
                background: problem === p.value ? '#4f7ef8' : 'transparent' }} />
              <div style={{ fontSize: 18 }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Series specific options */}
      {problem === 'timeseries' && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
          
          {/* Date column selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              📅 Date column
            </div>
            <select
              value={dateColumn}
              onChange={e => setDateColumn(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600,
                background: 'white', cursor: 'pointer'
              }}
            >
              <option value="">— Select date column —</option>
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          {/* Forecasting method selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              📊 Forecasting method
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORECAST_METHODS.map(m => (
                <div key={m.value} onClick={() => setForecastMethod(m.value)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  border: `1.5px solid ${forecastMethod === m.value ? '#4f7ef8' : '#e2e8f0'}`,
                  borderRadius: 10, cursor: 'pointer',
                  background: forecastMethod === m.value ? '#eff6ff' : 'white',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${forecastMethod === m.value ? '#4f7ef8' : '#cbd5e1'}`,
                    background: forecastMethod === m.value ? '#4f7ef8' : 'transparent' }} />
                  <div style={{ fontSize: 18 }}>{m.emoji}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast horizon */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              ⏰ Forecast horizon (days)
            </div>
            <input
              type="number"
              min={1}
              max={365}
              value={horizon}
              onChange={e => setHorizon(parseInt(e.target.value))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600,
                background: 'white'
              }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              How many days ahead to forecast
            </div>
          </div>
        </div>
      )}

      {/* Train button */}
      <button
        onClick={train}
        disabled={training || !sessionId || !target || (problem === 'timeseries' && !dateColumn)}
        style={{
          padding: '14px', borderRadius: 12, border: 'none',
          background: (training || !sessionId || !target || (problem === 'timeseries' && !dateColumn)) 
            ? '#cbd5e1' 
            : 'linear-gradient(135deg,#4f7ef8,#7c5cfa)',
          color: (training || !sessionId || !target || (problem === 'timeseries' && !dateColumn)) 
            ? '#64748b' 
            : 'white',
          fontSize: 15, fontWeight: 800, 
          cursor: (training || !sessionId || !target || (problem === 'timeseries' && !dateColumn)) 
            ? 'not-allowed' 
            : 'pointer',
        }}
      >
        {training ? <LoadingSpinner text="Training all models..." inline /> : '🚀 Train all models'}
      </button>
    </div>
  )
}