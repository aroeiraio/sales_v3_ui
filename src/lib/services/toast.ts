import { writable } from 'svelte/store';

export interface Toast {
  id: number;
  message: string;
  duration: number;
  type: 'success' | 'error' | 'info' | 'warning';
}

const createToastService = () => {
  const { subscribe, update } = writable<Toast[]>([]);

  let nextId = 0;

  const show = (message: string, duration = 3000, type: Toast['type'] = 'success') => {
    const id = nextId++;
    const toast: Toast = { id, message, duration, type };

    update(toasts => [...toasts, toast]);

    setTimeout(() => {
      remove(id);
    }, duration);
  };

  const showSuccess = (message: string, duration = 3000) => {
    show(message, duration, 'success');
  };

  const showError = (message: string, duration = 5000) => {
    show(message, duration, 'error');
  };

  const showInfo = (message: string, duration = 3000) => {
    show(message, duration, 'info');
  };

  const showWarning = (message: string, duration = 4000) => {
    show(message, duration, 'warning');
  };

  const remove = (id: number) => {
    update(toasts => toasts.filter(t => t.id !== id));
  };

  return {
    subscribe,
    show,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    remove,
  };
};

export const toastService = createToastService();
