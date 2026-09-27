// frontend/src/context/AppContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  // State variables
  const [sessionId,         setSessionId]         = useState(null)
  const [filename,          setFilename]           = useState(null)
  const [dataInfo,          setDataInfo]           = useState(null)
  const [autoDetectedTask,  setAutoDetectedTask]   = useState(null)
  const [modelResults,      setModelResults]       = useState(null)
  const [messages,          setMessages]           = useState([])
  const [history,           setHistory]            = useState([])   // { id, label, tab, ts }
  const [loading,           setLoading]            = useState(false)
  const [error,             setError]              = useState(null)

  // Add a message to the chat
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Add an item to history
  const addHistory = useCallback((label, tab = 'chat') => {
    setHistory(prev => [
      { id: Date.now(), label: label.length > 42 ? label.slice(0, 42) + '…' : label, tab, ts: Date.now() },
      ...prev,
    ].slice(0, 30))
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Clear entire session
  const clearSession = useCallback(() => {
    setSessionId(null)
    setFilename(null)
    setDataInfo(null)
    setModelResults(null)
    setAutoDetectedTask(null)
    clearMessages()
  }, [clearMessages])

  const value = {
    // Session
    sessionId, setSessionId,
    filename,  setFilename,
    dataInfo,  setDataInfo,
    autoDetectedTask, setAutoDetectedTask,

    // Models
    modelResults, setModelResults,

    // Chat
    messages, addMessage, clearMessages,

    // History
    history, addHistory,

    // UI state
    loading, setLoading,
    error,   setError,

    // Actions
    clearSession,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
