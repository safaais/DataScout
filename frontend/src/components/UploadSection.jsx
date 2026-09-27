// src/components/UploadSection.jsx
import { useRef, useState } from 'react'
import { uploadFile, getSessionInfo } from '../services/api'
import { useApp } from '../context/AppContext'

export default function UploadSection() {
  const fileInputRef = useRef(null)
  const { setSessionId, setFilename, setDataInfo, setLoading, setError, setAutoDetectedTask } = useApp()
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = async (file) => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // 1. Upload file
      const result = await uploadFile(file)
      setSessionId(result.session_id)
      setFilename(result.filename)

      // 2. Get session info (columns, rows, etc.)
      const info = await getSessionInfo(result.session_id)
      setDataInfo(info.info)

      // 3. Auto-detect problem type based on target column
      const targetColumn = info.info.column_names?.find(col => 
        col.toLowerCase().includes('price') ||
        col.toLowerCase().includes('value') ||
        col.toLowerCase().includes('target') ||
        col.toLowerCase().includes('close')
      ) || info.info.column_names?.[info.info.column_names.length - 1]

      // 4. Auto-detect task type
      const detectedTask = await autoDetectTask(result.session_id, targetColumn)
      setAutoDetectedTask(detectedTask)

    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const autoDetectTask = async (sessionId, targetColumn) => {
    try {
      const response = await fetch(`/api/v1/auto_detect_task?session_id=${sessionId}&target_column=${targetColumn}`)
      const data = await response.json()
      return data.task_type
    } catch {
      return 'regression'
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) handleUpload(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          background: dragActive ? 'var(--surface)' : 'white',
          border: `2px dashed ${dragActive ? 'var(--ac)' : 'var(--bdr)'}`,
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: 20
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Click or drag file to upload
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          CSV · XLSX · XLS (Max 500MB)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Optional: Show file info after upload */}
      <style>{`
        .upload-card:hover {
          border-color: var(--ac);
          background: var(--surface);
        }
      `}</style>
    </div>
  )
}