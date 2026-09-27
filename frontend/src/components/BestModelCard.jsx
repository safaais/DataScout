// src/components/BestModelCard.jsx

function MetricPill({ label, value, color, isPercentage = false }) {
  let displayValue = '—'
  if (value !== undefined && value !== null && !isNaN(value)) {
    if (typeof value === 'number') {
      if (isPercentage) {
        displayValue = `${(value * 100).toFixed(2)}%`
      } else {
        displayValue = value.toFixed(2)
      }
    } else {
      displayValue = String(value)
    }
  }
  
  return (
    <div style={{ 
      flex: 1, 
      background: 'rgba(255,255,255,0.15)', 
      borderRadius: 10, 
      padding: '10px 8px', 
      textAlign: 'center' 
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || 'white' }}>
        {displayValue}
      </div>
      <div style={{ 
        fontSize: 10, 
        fontWeight: 600, 
        color: 'rgba(255,255,255,0.7)', 
        marginTop: 2, 
        textTransform: 'uppercase', 
        letterSpacing: '.4px' 
      }}>
        {label}
      </div>
    </div>
  )
}

export default function BestModelCard({ modelResults }) {
  console.log("🏆 BestModelCard received:", modelResults)
  
  // Try to extract best model from different possible structures
  let bestModel = null
  let bestScore = null
  let taskType = null
  let metrics = {}
  
  if (modelResults) {
    // Case 1: Direct properties from train_all response
    if (modelResults.best_model) {
      bestModel = modelResults.best_model
      bestScore = modelResults.best_score
      taskType = modelResults.task_type
      metrics = modelResults.best_model_metrics || {}
    }
    // Case 2: From all_models, find the best by score
    else if (modelResults.all_models && Object.keys(modelResults.all_models).length > 0) {
      const allModels = modelResults.all_models
      taskType = modelResults.task_type || 'classification'
      
      // Find model with highest score
      let bestScoreValue = -Infinity
      for (const [name, metric] of Object.entries(allModels)) {
        let score = metric.accuracy || metric.r2 || metric.score || 0
        if (score > bestScoreValue) {
          bestScoreValue = score
          bestModel = name
          bestScore = score
          metrics = metric
        }
      }
    }
    // Case 3: Alternative format
    else if (modelResults.bestModel) {
      bestModel = modelResults.bestModel
      bestScore = modelResults.bestScore
      taskType = modelResults.taskType
      metrics = modelResults.metrics || {}
    }
  }
  
  // If still no best model but we have all_models, use the first one
  if (!bestModel && modelResults?.all_models) {
    const firstModel = Object.entries(modelResults.all_models)[0]
    if (firstModel) {
      bestModel = firstModel[0]
      metrics = firstModel[1]
      bestScore = metrics.accuracy || metrics.r2 || metrics.score || 0
      taskType = modelResults.task_type || 'classification'
    }
  }
  
  // If no valid data, show placeholder
  if (!bestModel) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: 16,
        padding: '20px 24px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, opacity: 0.8 }}>🏆 BEST MODEL</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
          No model trained yet
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Train models to see results
        </div>
      </div>
    )
  }
  
  const isClassification = taskType === 'classification'
  const isRegression = taskType === 'regression'
  const isTimeseries = taskType === 'timeseries'
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #4f7ef8, #7c5cfa)',
      borderRadius: 16,
      padding: '20px 24px',
      color: 'white',
      boxShadow: '0 4px 20px rgba(79,126,248,0.3)'
    }}>
      <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
        🏆 BEST MODEL
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
        {bestModel}
      </div>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isRegression ? (
          <>
            <MetricPill 
              label="R² Score" 
              value={metrics.r2 ?? bestScore ?? 0} 
              color="#22c55e"
              isPercentage={true}
            />
            <MetricPill 
              label="MAE" 
              value={metrics.mae ?? 0} 
              color="#fbbf24"
              isPercentage={false}
            />
            <MetricPill 
              label="RMSE" 
              value={metrics.rmse ?? 0} 
              color="#f97316"
              isPercentage={false}
            />
          </>
        ) : isClassification ? (
          <>
            <MetricPill 
              label="Accuracy" 
              value={metrics.accuracy ?? bestScore ?? 0} 
              color="#22c55e"
              isPercentage={true}
            />
            <MetricPill 
              label="Precision" 
              value={metrics.precision ?? 0} 
              color="#3b82f6"
              isPercentage={true}
            />
            <MetricPill 
              label="Recall" 
              value={metrics.recall ?? 0} 
              color="#06b6d4"
              isPercentage={true}
            />
            <MetricPill 
              label="F1 Score" 
              value={metrics.f1_score ?? 0} 
              color="#a855f7"
              isPercentage={true}
            />
          </>
        ) : isTimeseries ? (
          <>
            <MetricPill 
              label="MAE" 
              value={metrics.mae ?? 0} 
              color="#fbbf24"
              isPercentage={false}
            />
            <MetricPill 
              label="RMSE" 
              value={metrics.rmse ?? 0} 
              color="#f97316"
              isPercentage={false}
            />
            <MetricPill 
              label="MAPE" 
              value={metrics.mape ?? 0} 
              color="#22c55e"
              isPercentage={true}
            />
          </>
        ) : (
          // Default: show accuracy if available
          <MetricPill 
            label="Score" 
            value={bestScore ?? 0} 
            color="#22c55e"
            isPercentage={true}
          />
        )}
      </div>
    </div>
  )
}