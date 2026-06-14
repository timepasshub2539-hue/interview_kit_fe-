import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(err) {
    return { error: err }
  }
  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', err, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>⚠️ Render Error</h2>
          <pre style={{ color: '#fca5a5', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.history.back() }}
            style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
            ← Go Back
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
