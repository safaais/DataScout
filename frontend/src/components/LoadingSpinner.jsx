// src/components/LoadingSpinner.jsx
const S = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 24,
  },
  ring: (size) => ({
    width: size, height: size,
    border: `${size > 30 ? 3 : 2}px solid var(--bdr)`,
    borderTopColor: 'var(--ac)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }),
  text: { fontSize: 13, color: 'var(--text2)', fontWeight: 600 },
}

export default function LoadingSpinner({ text = 'Loading...', size = 36, inline = false }) {
  if (inline) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={S.ring(16)} />
        <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>{text}</span>
      </span>
    )
  }
  return (
    <div style={S.wrap}>
      <div style={S.ring(size)} />
      <div style={S.text}>{text}</div>
    </div>
  )
}
