'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

const variantConfig: Record<ConfirmVariant, { icon: typeof Trash2; iconClass: string; bgClass: string; btnClass: string }> = {
  danger: {
    icon: Trash2,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    btnClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    btnClass: 'bg-brand-green hover:opacity-90 text-white',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    btnClass: 'bg-brand-green hover:opacity-90 text-white',
  },
};

// Hook to use confirmation dialog
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    description: '',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const ConfirmDialog = useCallback(() => {
    if (!state.isOpen) return null;

    const variant = state.variant || 'danger';
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-14 h-14 ${config.bgClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-7 h-7 ${config.iconClass}`} />
          </div>
          <h3 className="text-lg font-bold text-center text-brand-black dark:text-brand-yellow mb-1">
            {state.title}
          </h3>
          <p className="text-sm text-center text-gray-400 mb-5">
            {state.description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-brand-black dark:text-brand-yellow"
            >
              {state.cancelLabel || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 font-semibold rounded-xl text-sm transition-colors ${config.btnClass}`}
            >
              {state.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [state, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
}

// Alert dialog for showing messages
interface AlertOptions {
  title: string;
  description: string;
  variant?: 'error' | 'success' | 'info';
  confirmLabel?: string;
}

interface AlertState extends AlertOptions {
  isOpen: boolean;
  resolve: (() => void) | null;
}

const alertVariantConfig = {
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    btnClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    btnClass: 'bg-brand-green hover:opacity-90 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    btnClass: 'bg-brand-green hover:opacity-90 text-white',
  },
};

export function useAlert() {
  const [state, setState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
    resolve: null,
  });

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        ...options,
        isOpen: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.();
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const AlertDialog = useCallback(() => {
    if (!state.isOpen) return null;

    const variant = state.variant || 'info';
    const config = alertVariantConfig[variant];
    const Icon = config.icon;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-14 h-14 ${config.bgClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-7 h-7 ${config.iconClass}`} />
          </div>
          <h3 className="text-lg font-bold text-center text-brand-black dark:text-brand-yellow mb-1">
            {state.title}
          </h3>
          <p className="text-sm text-center text-gray-400 mb-5">
            {state.description}
          </p>
          <button
            onClick={handleConfirm}
            className={`w-full py-2.5 font-semibold rounded-xl text-sm transition-colors ${config.btnClass}`}
          >
            {state.confirmLabel || 'OK'}
          </button>
        </div>
      </div>
    );
  }, [state, handleConfirm]);

  return { alert, AlertDialog };
}
