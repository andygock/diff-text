import React from "react";
import PropTypes from "prop-types";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Save info for display and optionally call a reporting callback
    this.setState({ error, info });
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  reset() {
    this.setState({ hasError: false, error: null, info: null });
  }

  render() {
    if (this.state.hasError) {
      const showDetails =
        (typeof import.meta !== "undefined" &&
          import.meta.env &&
          import.meta.env.DEV) ||
        (typeof globalThis !== "undefined" &&
          globalThis.process &&
          globalThis.process.env &&
          globalThis.process.env.NODE_ENV !== "production");

      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <div>
            <button onClick={() => this.reset()}>Try again</button>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
          {showDetails ? (
            <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.info?.componentStack}
            </details>
          ) : (
            <p style={{ marginTop: "1rem" }}>
              An unexpected error occurred. Details are hidden in production.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  onError: PropTypes.func,
};

export default ErrorBoundary;
