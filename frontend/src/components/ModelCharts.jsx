// src/components/ModelCharts.jsx
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useApp } from '../context/AppContext'

export default function ModelCharts() {
  const { modelResults } = useApp()
  const [isOpen, setIsOpen] = useState(false)  // Closed by default
  
  if (!modelResults?.all_models) {
    return null
  }
  
  // Build data from all_models
  const modelsData = Object.entries(modelResults.all_models).map(([name, metrics]) => {
    let displayName = name
    if (name === 'Random Forest' || name === 'RandomForest') displayName = 'Random Forest'
    else if (name === 'Linear Regression' || name === 'LinearRegression') displayName = 'Linear Regression'
    else if (name === 'Ridge') displayName = 'Ridge'
    else if (name === 'Lasso') displayName = 'Lasso'
    
    return {
      name: displayName,
      r2: ((metrics.r2 || metrics.score || 0) * 100),
      mae: metrics.mae || 0,
      rmse: metrics.rmse || 0
    }
  })
  
  modelsData.sort((a, b) => b.r2 - a.r2)
  const bestR2 = Math.max(...modelsData.map(m => m.r2))
  
  return (
    <div style={{ 
      background: 'var(--white)', 
      border: '1px solid var(--bdr)', 
      borderRadius: 14, 
      overflow: 'hidden',
      marginTop: 20
    }}>
      {/* Header - Click to expand/collapse */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 20px',
          background: 'var(--surface)',
          borderBottom: isOpen ? '1px solid var(--bdr)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Model Performance Charts</h3>
            <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0 0' }}>
              {isOpen ? 'Click to collapse' : 'Click to expand and see charts'}
            </p>
          </div>
        </div>
        <div style={{ 
          fontSize: 18, 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </div>
      </div>
      
      {/* Charts Content - Only visible when open */}
      {isOpen && (
        <div style={{ padding: '18px 20px' }}>
          
          {/* R² Score Bar Chart */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              R² Score Comparison (Higher is Better)
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelsData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'R² Score']} />
                <Bar dataKey="r2" radius={[0, 8, 8, 0]}>
                  {modelsData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.r2 === bestR2 ? '#22c55e' : '#4f7ef8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* MAE Chart */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              MAE - Mean Absolute Error (Lower is Better)
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelsData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'MAE']} />
                <Bar dataKey="mae" radius={[0, 8, 8, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* RMSE Chart */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              RMSE - Root Mean Square Error (Lower is Better)
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelsData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'RMSE']} />
                <Bar dataKey="rmse" radius={[0, 8, 8, 0]} fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Best Model Summary - Small */}
          <div style={{ 
            background: '#e8f0fe', 
            borderRadius: 12, 
            padding: '10px 14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>🏆 Best Model</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac)', marginLeft: 8 }}>
              {modelResults.best_model || 'Random Forest'}
            </span>
            <span style={{ fontSize: 12, marginLeft: 12 }}>
              R²: {((modelResults.best_model_metrics?.r2 || modelResults.best_score || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}