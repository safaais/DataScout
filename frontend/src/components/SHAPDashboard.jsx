// src/components/SHAPDashboard.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = { positive: '#22c55e', negative: '#ef4444' }

export default function SHAPDashboard() {
  const { sessionId, modelResults, dataInfo } = useApp()
  const [isOpen, setIsOpen] = useState(true)
  const [showChart, setShowChart] = useState(true)
  const [shapData, setShapData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [featureColumns, setFeatureColumns] = useState([])
  const [inputValues, setInputValues] = useState({})

  // =====================================================
  // Get feature columns (EXCLUDE target column)
  // =====================================================
  useEffect(() => {
    const targetCol = modelResults?.target_column
    
    // Priority 1: Use feature_columns from modelResults
    if (modelResults?.feature_columns && modelResults.feature_columns.length > 0) {
      const filtered = modelResults.feature_columns.filter(col => col !== targetCol)
      setFeatureColumns(filtered)

      const initial = {}
      filtered.forEach(col => { initial[col] = '' })
      setInputValues(initial)
      return
    }

    // Priority 2: Derive from dataInfo
    if (dataInfo?.column_names && dataInfo.column_names.length > 0) {
      let cols = [...dataInfo.column_names]

      if (targetCol) {
        cols = cols.filter(col => col !== targetCol)
      }

      cols = cols.filter(col => {
        const c = col.toLowerCase()
        return !c.includes('id') && !c.includes('index') && !c.includes('unnamed')
      })

      setFeatureColumns(cols)

      const initial = {}
      cols.forEach(col => { initial[col] = '' })
      setInputValues(initial)
    }
  }, [modelResults, dataInfo])

  // =====================================================
  // Make Prediction + Explanation
  // =====================================================
  const handlePredictAndExplain = async () => {
    if (!sessionId) {
      setError('No session found')
      return
    }

    if (featureColumns.length === 0) {
      setError('No features available')
      return
    }

    setLoading(true)
    setError(null)

    // Build numeric values
    const numericValues = {}
    for (const col of featureColumns) {
      const val = inputValues[col]
      if (val === '' || val === null) {
        numericValues[col] = 0
      } else {
        const num = parseFloat(String(val))
        numericValues[col] = isNaN(num) ? val : num
      }
    }

    // Handle categorical values
    if (numericValues.smoker !== undefined && typeof numericValues.smoker !== 'number') {
      numericValues.smoker = String(inputValues.smoker || '').toLowerCase() === 'yes' ? 1 : 0
    }
    if (numericValues.sex !== undefined && typeof numericValues.sex !== 'number') {
      numericValues.sex = String(inputValues.sex || '').toLowerCase() === 'male' ? 1 : 0
    }
    if (numericValues.region !== undefined && typeof numericValues.region !== 'number') {
      const regionMap = { 'southeast': 0, 'southwest': 1, 'northeast': 2, 'northwest': 3 }
      numericValues.region = regionMap[String(inputValues.region || '').toLowerCase()] || 0
    }

    try {
      const response = await fetch('/api/v1/shap_explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, values: numericValues })
      })
      const data = await response.json()

      if (data.success) {
        setShapData(data)
      } else {
        setError(data.message || 'Failed to get prediction')
      }
    } catch (err) {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setInputValues(prev => ({ ...prev, [field]: value }))
  }

  if (featureColumns.length === 0) return null

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginTop: 20 }}>
      {/* Header */}
      <div onClick={() => setIsOpen(!isOpen)} style={{ padding: '16px 20px', background: '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔮</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Make a Prediction</h3>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>Get prediction with model explanation</p>
          </div>
        </div>
        <div style={{ fontSize: 20, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
      </div>

      {isOpen && (
        <div style={{ padding: '18px 20px' }}>
          {/* Input Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {featureColumns.map(col => (
              <div key={col}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                  {col}
                </label>
                {col === 'smoker' ? (
                  <select value={inputValues[col] || ''} onChange={(e) => handleInputChange(col, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : col === 'sex' ? (
                  <select value={inputValues[col] || ''} onChange={(e) => handleInputChange(col, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : col === 'region' ? (
                  <select value={inputValues[col] || ''} onChange={(e) => handleInputChange(col, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                    <option value="">Select</option>
                    <option value="southeast">Southeast</option>
                    <option value="southwest">Southwest</option>
                    <option value="northeast">Northeast</option>
                    <option value="northwest">Northwest</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={inputValues[col] || ''}
                    onChange={(e) => handleInputChange(col, e.target.value)}
                    placeholder={`Enter ${col}`}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredictAndExplain}
            disabled={loading}
            style={{
              padding: '14px 20px',
              width: '100%',
              marginBottom: 16,
              background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Predicting...' : '🔮 Predict'}
          </button>

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
              ❌ {error}
            </div>
          )}

          {/* Prediction Result */}
          {shapData && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'center',
                marginBottom: 20,
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  Predicted {modelResults?.target_column || 'Value'}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>
                  {typeof shapData.prediction_value === 'number' 
                    ? shapData.prediction_value.toFixed(2) 
                    : shapData.prediction_value}
                </div>
              </div>

              {/* Explanation Header */}
              <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, margin: 0 }}>
                  💡 <strong>Model Explanation:</strong> Shows how each feature contributed to the prediction.
                  <strong style={{ color: '#22c55e' }}> Green ↑</strong> = increased the prediction.
                  <strong style={{ color: '#ef4444' }}> Red ↓</strong> = decreased the prediction.
                </p>
              </div>

              {/* Feature Impact Chart */}
              {shapData?.importance_data?.length > 0 && (
                <>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div onClick={() => setShowChart(!showChart)} style={{ padding: '12px 16px', background: '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>📊 Feature Impact Chart {showChart ? '▲' : '▼'}</span>
                    </div>
                    {showChart && (
                      <div style={{ padding: '16px' }}>
                        <ResponsiveContainer width="100%" height={Math.min(350, shapData.importance_data.length * 40)}>
                          <BarChart data={shapData.importance_data} layout="vertical" margin={{ left: 80, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}`} />
                            <YAxis type="category" dataKey="feature" width={80} />
                            <Tooltip formatter={(value) => [`${value.toFixed(4)}`, 'Impact']} />
                            <Bar dataKey="value">
                              {shapData.importance_data.map((entry, idx) => (
                                <Cell key={idx} fill={entry.value >= 0 ? COLORS.positive : COLORS.negative} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Detailed Explanation */}
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📝 Detailed Explanation</h4>

                    {shapData.importance_data.map((item, idx) => {
                      const isPositive = item.value > 0
                      const impact = Math.abs(item.value).toFixed(4)
                      const direction = isPositive ? 'increased' : 'decreased'
                      const color = isPositive ? '#22c55e' : '#ef4444'
                      const arrow = isPositive ? '↑' : '↓'

                      return (
                        <div
                          key={idx}
                          style={{
                            background: isPositive ? '#f0fdf4' : '#fee2e2',
                            borderRadius: 10,
                            padding: '12px 14px',
                            marginBottom: 8,
                            borderLeft: `4px solid ${color}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <strong style={{ fontSize: 13 }}>{item.feature}</strong>
                              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({arrow})</span>
                            </div>
                            <div style={{ fontWeight: 700, color: color }}>
                              {isPositive ? '+' : '-'}{impact}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
                            The feature <strong>"{item.feature}"</strong> {direction} the prediction by <strong>{impact}</strong>.
                          </div>
                        </div>
                      )
                    })}

                    {/* Summary */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: 10,
                      padding: '14px 16px',
                      marginTop: 12,
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📌 Summary</div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                        Starting from a base value of <strong>{shapData.base_value?.toFixed(2)}</strong>,
                        the model added the impacts above to reach the final prediction of
                        <strong style={{ color: '#4f7ef8' }}> {shapData.prediction_value?.toFixed(2)}</strong>.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}