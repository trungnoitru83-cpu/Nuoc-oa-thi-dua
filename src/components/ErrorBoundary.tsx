import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare props and state for strict tsc when @types/react is implicit
  declare props: Props;
  declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lỗi giao diện ứng dụng (ErrorBoundary):', error, errorInfo);
    if (String(error).includes('QuotaExceededError') || String(error).includes('exceeded the quota')) {
      try {
        localStorage.removeItem('nuocoa_evaluations');
        localStorage.removeItem('nuocoa_form01');
        this.setState({ hasError: false, error: null });
      } catch (e) {
        console.warn('Cannot clean storage on quota exceeded:', e);
      }
    }
  }

  handleReset = () => {
    try {
      localStorage.removeItem('nuocoa_teachers');
      localStorage.removeItem('nuocoa_form01');
      localStorage.removeItem('nuocoa_evaluations');
      localStorage.removeItem('nuocoa_entry_statuses');
    } catch (e) {
      console.warn('Cannot clear localStorage:', e);
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-300 dark:border-rose-900 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Khôi Phục Giao Diện Ứng Dụng
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Hệ thống đã tự động bảo vệ dữ liệu khi gặp sự cố tạm thời. Vui lòng bấm nút bên dưới để khôi phục và tiếp tục sử dụng.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Khôi phục cài đặt gốc &amp; Đăng nhập</span>
              </button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-[10px] text-slate-400 cursor-pointer font-mono">Chi tiết lỗi kỹ thuật</summary>
                <p className="mt-1 text-[10px] text-rose-500 font-mono bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-900 break-words">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
