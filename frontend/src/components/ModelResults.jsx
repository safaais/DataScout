// src/components/ModelResults.jsx - الجزء الخاص بـ Time Series
import { useApp } from '../context/AppContext'
import BestModelCard from './BestModelCard'
import ModelsTable from './ModelsTable'

export default function ModelResults() {
  const { modelResults, loading } = useApp()
  
  console.log("📊 ModelResults - full modelResults:", modelResults)
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #4f7ef8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p>Training models... This may take a moment</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  if (!modelResults) {
    return (
      <div style={{ background: '#f8fafc', borderRadius: 14, padding: '30px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <h3>No models trained yet</h3>
        <p style={{ color: '#64748b', marginTop: 8 }}>Go to Target + Train and click "Train all models"</p>
      </div>
    )
  }
  
  // Check if it's Time Series result
  if (modelResults.forecast || modelResults.method === 'prophet' || modelResults.method === 'arima' || modelResults.method === 'Simple Moving Average') {
    const forecastValues = modelResults.forecast || []
    const forecastDates = modelResults.dates || []
    const metrics = modelResults.metrics || {}
    const lastValue = modelResults.last_value || (modelResults.history && modelResults.history[modelResults.history.length - 1]) || 'N/A'
    const trend = modelResults.trend || 0
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Time Series Header */}
        <div style={{ background: 'linear-gradient(135deg, #4f7ef8, #7c5cfa)', borderRadius: 16, padding: '20px 24px', color: 'white' }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>⏳ TIME SERIES FORECAST</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{modelResults.method || 'Trend-Based'} Forecast</div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{typeof lastValue === 'number' ? lastValue.toFixed(2) : lastValue}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Last Value</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{forecastValues[0]?.toFixed(2) || 'N/A'}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Next Forecast</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{typeof trend === 'number' ? trend.toFixed(4) : trend}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Trend</div>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        {(metrics.mae || metrics.rmse || metrics.mape) && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 Forecast Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f7ef8' }}>{metrics.mae?.toFixed(2) || 'N/A'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>MAE</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f7ef8' }}>{metrics.rmse?.toFixed(2) || 'N/A'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>RMSE</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f7ef8' }}>{metrics.mape?.toFixed(1) || 'N/A'}%</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>MAPE</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Forecast Table */}
        {forecastValues.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 700 }}>
              📈 Forecast Values (Next {modelResults.horizon || forecastValues.length} days)
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Predicted {modelResults.target_column || 'Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastDates.map((date, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>{date}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{forecastValues[idx]?.toFixed(2) || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#64748b', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          ✅ Forecast based on {modelResults.data_points || 'N/A'} data points
        </div>
      </div>
    )
  }
  
  // Regular Regression/Classification results
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <BestModelCard modelResults={modelResults} />
      <ModelsTable modelResults={modelResults} />
      
      {(modelResults.samples_used || modelResults.features_used) && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#64748b', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          ✅ Trained on {modelResults.samples_used || '?'} samples • {modelResults.features_used || '?'} features
        </div>
      )}
    </div>
  )
}