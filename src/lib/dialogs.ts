export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDanger?: boolean;
  resolve?: (value: boolean) => void;
}

export interface AlertDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  resolve?: () => void;
}

type Listener = () => void;

class DialogManager {
  private toasts: ToastItem[] = [];
  private confirmState: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  };
  private alertState: AlertDialogState = {
    isOpen: false,
    title: '',
    message: '',
    buttonLabel: 'OK',
  };

  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getToasts(): ToastItem[] {
    return this.toasts;
  }

  getConfirmState(): ConfirmDialogState {
    return this.confirmState;
  }

  getAlertState(): AlertDialogState {
    return this.alertState;
  }

  toast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 4000) {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const item: ToastItem = { id, message, type, duration };
    this.toasts = [item, ...this.toasts.slice(0, 4)];
    this.notify();

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.notify();
    }, duration);
  }

  confirm(options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmState = {
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        isDanger: options.isDanger ?? false,
        resolve: (val: boolean) => {
          this.confirmState = { ...this.confirmState, isOpen: false };
          this.notify();
          resolve(val);
        },
      };
      this.notify();
    });
  }

  alert(options: {
    title?: string;
    message: string;
    buttonLabel?: string;
  } | string): Promise<void> {
    const message = typeof options === 'string' ? options : options.message;
    const title = typeof options === 'string' ? 'Notice' : (options.title || 'Notice');
    const buttonLabel = typeof options === 'string' ? 'OK' : (options.buttonLabel || 'OK');

    return new Promise<void>((resolve) => {
      this.alertState = {
        isOpen: true,
        title,
        message,
        buttonLabel,
        resolve: () => {
          this.alertState = { ...this.alertState, isOpen: false };
          this.notify();
          resolve();
        },
      };
      this.notify();
    });
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const customDialogs = new DialogManager();
