"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#f7f6f1",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f1a0f" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", marginBottom: "1rem" }}>
            Try refreshing the page.
          </p>
          <a
            href="/"
            style={{
              padding: "0.5rem 1rem",
              background: "#16a34a",
              color: "white",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Go home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
