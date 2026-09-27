// src/components/PredictionForm.jsx
import { useState, useEffect, useRef } from 'react'
import { makePrediction } from '../services/api'
import { useApp } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

export default function PredictionForm() {
  const { sessionId, modelResults, dataInfo } = useApp()
  const [formValues, setFormValues] = useState({})
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState(null)
  const initialized = useRef(false)
  
  // Get target column from modelResults
  const targetColumn = modelResults?.target_column || 'Species'
  
  // Get ALL columns except target (this is the key fix!)
  const allColumns = dataInfo?.column_names || []
  const featureColumns = allColumns.filter(col => col !== targetColumn)
  
  // Initialize form values
  useEffect(() => {
    if (!initialized.current && featureColumns.length > 0) {
      const initial = {}
      featureColumns.forEach(col => { initial[col] = '' })
      setFormValues(initial)
      initialized.current = true
    }
  }, [featureColumns])
  
  const handleInputChange = (col, value) => {
    setFormValues(prev => ({ ...prev, [col]: value }))
  }
  
  const handlePredict = async () => {
    setPredicting(true)
    setError(null)
    
    // Prepare values
    const preparedValues = {}
    for (const [key, value] of Object.entries(formValues)) {
      if (value === '' || value === null) {
        preparedValues[key] = 0
      } else {
        const num = parseFloat(value)
        preparedValues[key] = isNaN(num) ? value : num
      }
    }
    
    console.log("🔵 PREDICTION - Feature columns:", featureColumns)
    console.log("🔵 PREDICTION - Values:", preparedValues)
    
    try {
      const result = await makePrediction(sessionId, preparedValues)
      console.log("🔵 PREDICTION - Result:", result)
      
      let predictionValue = result.prediction
      
      // If classification, map to class name
      if (modelResults?.task_type === 'classification') {
        const classMap = {
          0: 'Iris-setosa',
          1: 'Iris-versicolor',
          2: 'Iris-virginica'
        }
        predictionValue = classMap[predictionValue] || predictionValue
      }
      
      setPrediction(predictionValue)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setPredicting(false)
    }
  }
  
  if (!modelResults || !dataInfo) return null
  
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔮 Make a prediction</h3>
        <span style={{ fontSize: 11, background: '#eff6ff', padding: '4px 12px', borderRadius: 20, color: '#4f7ef8' }}>
          Using {modelResults.best_model || 'trained model'}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {featureColumns.map(col => (
          <div key={col}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
              {col}
            </label>
            <input
              type="text"
              value={formValues[col] || ''}
              onChange={(e) => handleInputChange(col, e.target.value)}
              placeholder={`Enter ${col}`}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                outline: 'none',
                background: 'white'
              }}
            />
          </div>
        ))}
      </div>
      
      <button
        onClick={handlePredict}
        disabled={predicting}
        style={{
          padding: '10px 24px',
          background: predicting ? '#cbd5e1' : 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: 'none',
          borderRadius: 10,
          color: 'white',
          fontWeight: 700,
          cursor: predicting ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {predicting ? <LoadingSpinner inline text="Predicting..." /> : '🔮 Predict'}
      </button>
      
      {error && (
        <div style={{ marginTop: 12, padding: '10px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 12 }}>
          ❌ {error}
        </div>
      )}
      
      {prediction !== null && (
        <div style={{ 
          marginTop: 16, 
          padding: '16px', 
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: 12,
          textAlign: 'center',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Predicted {targetColumn}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
            {typeof prediction === 'number' ? `$${prediction.toFixed(2)}` : prediction}
          </div>
        </div>
      )}
    </div>
  )
}