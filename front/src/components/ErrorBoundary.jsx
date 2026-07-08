import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: "#f88", padding: 16, whiteSpace: "pre-wrap", fontSize: 12 }}>
          {String(this.state.error && this.state.error.stack)}
        </pre>
      )
    }
    return this.props.children
  }
}
