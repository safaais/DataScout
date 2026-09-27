// src/components/ModelsTable.jsx
export default function ModelsTable({ modelResults }) {
  console.log("📊 ModelsTable received:", modelResults)
  
  const allModels = modelResults?.all_models || modelResults?.allModels || {}
  const taskType = modelResults?.task_type || modelResults?.taskType || 'regression'
  const bestModel = modelResults?.best_model || modelResults?.bestModel || null
  
  if (!allModels || Object.keys(allModels).length === 0) {
    return (
      <div style={{ 
        background: '#fffbeb', 
        border: '1px solid #fde047', 
        borderRadius: 12, 
        padding: '16px',
        textAlign: 'center',
        color: '#854d0e'
      }}>
        ⚠️ No model data available. Please train models first.
      </div>
    )
  }
  
  const isRegression = taskType === 'regression'
  const entries = Object.entries(allModels)
  
  // Sort by score
  entries.sort((a, b) => {
    const aScore = a[1].r2 || a[1].accuracy || a[1].score || 0
    const bScore = b[1].r2 || b[1].accuracy || b[1].score || 0
    return bScore - aScore
  })
  
  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  }
  
  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: '1px solid #e2e8f0'
  }
  
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, fontWeight: 700 }}>
        📊 All Models Comparison
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Model</th>
              {isRegression ? (
                <>
                  <th style={{ ...thStyle, textAlign: 'right' }}>R² Score</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>MAE</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>RMSE</th>
                </>
              ) : (
                <>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Accuracy</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Precision</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Recall</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>F1 Score</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map(([name, metrics], idx) => {
              const isBest = name === bestModel
              const rowBg = isBest ? '#e8f0fe' : (idx % 2 === 0 ? 'white' : '#f8fafc')
              
              if (isRegression) {
                const r2 = metrics.r2 || metrics.score || 0
                const mae = metrics.mae || 0
                const rmse = metrics.rmse || 0
                
                return (
                  <tr key={name} style={{ borderBottom: '1px solid #e2e8f0', background: rowBg }}>
                    <td style={tdStyle}>{isBest ? '🥇' : idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: isBest ? 700 : 400, color: isBest ? '#4f7ef8' : '#1e293b' }}>
                      {name} {isBest && '🏆'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{(r2 * 100).toFixed(2)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{mae.toFixed(2)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{rmse.toFixed(2)}</td>
                  </tr>
                )
              } else {
                const accuracy = metrics.accuracy || metrics.score || 0
                const precision = metrics.precision || 0
                const recall = metrics.recall || 0
                const f1 = metrics.f1_score || 0
                
                return (
                  <tr key={name} style={{ borderBottom: '1px solid #e2e8f0', background: rowBg }}>
                    <td style={tdStyle}>{isBest ? '🥇' : idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: isBest ? 700 : 400, color: isBest ? '#4f7ef8' : '#1e293b' }}>
                      {name} {isBest && '🏆'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{(accuracy * 100).toFixed(2)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{(precision * 100).toFixed(2)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{(recall * 100).toFixed(2)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{(f1 * 100).toFixed(2)}%</td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}