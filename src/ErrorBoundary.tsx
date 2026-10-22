import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleResetLocalData = () => {
    try {
      localStorage.removeItem('mario_pederneiras_turma301_poems');
      localStorage.removeItem('mario_pederneiras_turma301_class_photo');
      localStorage.removeItem('mario_pederneiras_teacher_session');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 font-display">
              Ops! Algo inesperado aconteceu
            </h1>
            
            <p className="text-slate-600 text-sm mb-6">
              O aplicativo encontrou uma falha temporária ao carregar as informações da turma.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-900 text-red-400 p-3.5 rounded-xl text-xs font-mono mb-6 overflow-x-auto max-h-40 border border-slate-800">
                <p className="font-bold text-red-300">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#18a34a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleResetLocalData}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-slate-300 cursor-pointer"
                title="Restaura os dados padrão caso haja cache corrompido"
              >
                <Trash2 className="w-4 h-4" />
                Restaurar Padrões
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
