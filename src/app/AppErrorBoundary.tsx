import { Component, type ErrorInfo, type ReactNode } from "react";
import { ServerErrorPage } from "./pages/ServerErrorPage";

interface State {
  error: Error | null;
  referenceCode: string;
}

function referenceCode(): string {
  return `ERR-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Batas galat tingkat aplikasi: menampilkan halaman 500 dengan kode referensi; "Try again" merender ulang.
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, referenceCode: referenceCode() };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, referenceCode: referenceCode() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ServerErrorPage referenceCode={this.state.referenceCode} error={this.state.error} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
