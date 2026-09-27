// src/hooks/useChat.js
import { useState } from 'react'
import { sendChatMessage } from '../services/api'
import { useApp } from '../context/AppContext'

export function useChat() {
  const { sessionId, addMessage, setLoading, setError, messages } = useApp()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useState(null)[0] // simple ref

  const sendMessage = async (text) => {
    const query = text || input
    if (!query.trim() || !sessionId) return
    
    // Add user message
    addMessage({ 
      role: 'user', 
      text: query, 
      timestamp: Date.now(),
      id: Date.now()
    })
    setInput('')
    setIsSending(true)
    setLoading(true)
    
    try {
      const response = await sendChatMessage(sessionId, query)
      console.log("📨 Chat response:", response)
      
      // Add assistant message
      addMessage({ 
        role: 'assistant', 
        text: response.response || response.message || 'No response from server',
        data: response.data,
        timestamp: Date.now(),
        id: Date.now() + 1
      })
      
    } catch (err) {
      console.error("❌ Chat error:", err)
      addMessage({ 
        role: 'assistant', 
        text: `Error: ${err.response?.data?.detail || err.message}`,
        timestamp: Date.now(),
        id: Date.now() + 1
      })
    } finally {
      setIsSending(false)
      setLoading(false)
    }
  }

  const quickSend = (query) => {
    sendMessage(query)
  }

  const send = () => {
    sendMessage(input)
  }

  return {
    input,
    setInput,
    isSending,
    send,
    quickSend,
    bottomRef: { current: null }
  }
}