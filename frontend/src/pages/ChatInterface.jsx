// src/pages/ChatInterface.jsx
import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useApp }  from '../context/AppContext'
import { useChat } from '../hooks/useChat'
import LoadingSpinner from '../components/LoadingSpinner'

const QUICK_ACTIONS = [
  { id: 'summarize', icon: '📋', label: 'Summarize', query: 'Give me a summary of my dataset' },
  { id: 'plot', icon: '📊', label: 'Plot data',  query: 'Show me a plot of the data' },
  { id: 'train', icon: '🤖', label: 'Train',      query: 'Run AutoML and compare all models' },
  { id: 'quality', icon: '🔍', label: 'Quality',    query: 'Check data quality and missing values' },
  { id: 'statistics', icon: '📈', label: 'Statistics', query: 'Give me statistics for all columns' },
  { id: 'insights', icon: '💡', label: 'Insights',   query: 'What are the key insights in this data?' },
]

function PlotlyBubble({ figure }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!figure || !ref.current) return
    import('plotly.js-dist').then(Plotly => {
      Plotly.newPlot(ref.current, figure.data, {
        ...figure.layout,
        paper_bgcolor: 'transparent', plot_bgcolor: '#f8fafc',
        font: { family: 'Nunito, sans-serif', color: '#1e293b' },
        margin: { t: 32, r: 16, b: 48, l: 56 }, autosize: true,
      }, { responsive: true, displaylogo: false })
    })
    return () => import('plotly.js-dist').then(P => { if (ref.current) P.purge(ref.current) })
  }, [figure])
  return <div ref={ref} style={{ width: '100%', minHeight: 280 }} />
}

function MetricGrid({ data }) {
  const entries = Object.entries(data).filter(([, v]) => typeof v === 'number').slice(0, 6)
  if (!entries.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8, marginBottom: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ background: 'var(--surface)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{typeof v === 'number' ? v.toFixed(3) : v}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{k}</div>
        </div>
      ))}
    </div>
  )
}

function AgentBubble({ msg }) {
  const hasData  = msg.data && typeof msg.data === 'object'
  const hasFigure = hasData && msg.data.figure

  return (
    <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 9, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4f7ef8,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔬</div>
      <div style={{ maxWidth: 560, width: '100%', background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: '4px 18px 18px 18px', padding: '12px 16px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        {hasData && !hasFigure && <MetricGrid data={msg.data} />}
        {hasFigure && <PlotlyBubble figure={msg.data.figure} />}
        {msg.text && (
          <div style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 500, color: msg.success === false ? 'var(--danger)' : 'var(--text2)', marginTop: hasFigure || (hasData && !hasFigure) ? 10 : 0 }}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface() {
  const { messages, sessionId, filename, dataInfo } = useApp()
  const { input, setInput, isSending, send, quickSend, bottomRef } = useChat()
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Session info bar */}
      {sessionId && (
        <div style={{ padding: '10px 20px', background: 'var(--white)', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{filename}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{dataInfo?.rows?.toLocaleString()} rows · {dataInfo?.columns} cols</span>
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>🔬</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Ask anything about your data</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500, maxWidth: 380, lineHeight: 1.6 }}>
              {sessionId ? 'Your file is ready. Try a suggestion below or type your own question.' : 'Upload a file from the Dashboard first, then come back to chat.'}
            </div>
            {sessionId && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.id} onClick={() => quickSend(a.query)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                    background: 'var(--white)', border: '1.5px solid var(--bdr)', borderRadius: 20,
                    fontSize: 12, fontWeight: 700, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac)'; e.currentTarget.style.color = 'var(--ac)'; e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'var(--white)' }}
                  >
                    <span style={{ fontSize: 15 }}>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id || msg.timestamp || idx}>
                {msg.role === 'user' ? (
                  <div className="animate-in" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                    <div style={{ maxWidth: 420, background: 'linear-gradient(135deg,#4f7ef8,#7c5cfa)', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', fontSize: 13, lineHeight: 1.65, fontWeight: 600, boxShadow: '0 4px 18px rgba(79,126,248,.28)' }}>
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <AgentBubble msg={msg} />
                )}
              </div>
            ))}
            {isSending && (
              <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f7ef8,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔬</div>
                <div style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: '4px 18px 18px 18px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LoadingSpinner inline text="Analyzing..." />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Quick actions bar */}
      {messages.length > 0 && sessionId && (
        <div style={{ padding: '8px 20px 0', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {QUICK_ACTIONS.slice(0, 4).map(a => (
            <button key={a.id} onClick={() => quickSend(a.query)} style={{
              padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--bdr)',
              borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--text2)',
              cursor: 'pointer', fontFamily: 'var(--sans)',
            }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '10px 16px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'var(--white)', border: '1.5px solid var(--bdr)', borderRadius: 24, padding: '8px 8px 8px 18px', boxShadow: '0 2px 14px rgba(0,0,0,.07)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={!sessionId || isSending}
            placeholder={sessionId ? 'Ask anything about your data...' : 'Upload a file first...'}
            rows={1}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', fontWeight: 600, resize: 'none', minHeight: 22, maxHeight: 120, lineHeight: 1.6, cursor: !sessionId ? 'not-allowed' : 'text' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || !sessionId || isSending} style={{
            width: 36, height: 36, flexShrink: 0, border: 'none', borderRadius: '50%', cursor: 'pointer',
            background: input.trim() && sessionId && !isSending ? 'linear-gradient(135deg,#4f7ef8,#7c5cfa)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() && sessionId ? '0 3px 10px rgba(79,126,248,.4)' : 'none',
            transition: 'all .15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() && sessionId && !isSending ? '#fff' : 'var(--text3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 5, fontWeight: 600 }}>
          {!sessionId ? 'Upload a file from the Dashboard first' : 'Enter to send · Shift+Enter for new line'}
        </div>
      </div>
    </div>
  )
}