import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHUNK_RELOAD_KEY = "appointza_chunk_reload_at";

/** A new deploy removes old hashed chunks; tabs opened before it fail on lazy routes. */
function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|error loading dynamically imported module/i.test(
    message,
  );
}

function reloadOnceForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

type Props = {
  children: ReactNode;
  /** Changing this value clears the error (pass the route pathname). */
  resetKey?: string;
};

type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isStaleChunkError(error) && reloadOnceForStaleChunk()) return;
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            This page hit an unexpected error. Reload to try again, or go back to the home page.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Reload page
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/")}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
