// frontend/src/services/api.js
import axios from 'axios'

const API_BASE_URL = '/api/v1'
const API_KEY = 'dev_key_123'

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// ==================== FILE UPLOAD ====================

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// ==================== SESSION ====================

export async function getSessionInfo(sessionId) {
  const response = await api.get(`/session/${sessionId}`)
  return response.data
}

// ==================== PREPROCESSING ====================

export async function preprocessData(sessionId, config) {
  const params = new URLSearchParams()
  params.append('session_id', sessionId)
  params.append('missing_strategy', config.missing_strategy || 'fill_mean')
  params.append('remove_duplicates', config.remove_duplicates || false)
  params.append('normalize', config.normalize || false)
  params.append('normalize_method', config.normalize_method || 'standard')
  params.append('encode_categorical', config.encode_categorical || false)
  
  const response = await api.post('/preprocess', null, { params })
  return response.data
}

// ==================== TRAINING ====================

export async function trainAllModels(sessionId, targetColumn, problemType, horizon = 30) {
  const params = new URLSearchParams()
  params.append('session_id', sessionId)
  params.append('target_column', targetColumn)
  params.append('problem_type', problemType)
  
  if (problemType === 'timeseries') {
    params.append('forecast_horizon', horizon)
  }
  
  const response = await api.post('/train_all', null, { params })
  return response.data
}

// ==================== PREDICTION ====================

export async function makePrediction(sessionId, values) {
  const response = await api.post('/predict', { session_id: sessionId, values })
  return response.data
}

// ==================== TIME SERIES ====================

export async function timeseriesForecast(sessionId, targetColumn, horizon, dateColumn = 'Date') {
  const params = new URLSearchParams()
  params.append('session_id', sessionId)
  params.append('target_column', targetColumn)
  params.append('horizon', horizon)
  params.append('date_column', dateColumn)
  params.append('method', 'prophet')
  
  const response = await api.post('/timeseries/forecast', null, { params })
  return response.data
}

// ==================== CHAT ====================

export async function sendChatMessage(sessionId, query) {
  const params = new URLSearchParams()
  params.append('session_id', sessionId)
  params.append('query', query)
  
  const response = await api.post('/chat', null, { params })
  return response.data
}

// ==================== SIMPLE QUERY ====================

export async function sendQuery(sessionId, query) {
  const response = await axios.post(`${API_BASE_URL}/query`, {
    session_id: sessionId,
    query: query
  })
  return response.data
}

// ==================== HEALTH ====================

export async function healthCheck() {
  const response = await axios.get(`${API_BASE_URL}/health`)
  return response.data
}

// ==================== MODELS ====================

export async function getModels() {
  const response = await api.get('/models')
  return response.data
}