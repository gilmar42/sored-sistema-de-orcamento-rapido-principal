import React from 'react';
import Toast, { type ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onCloseToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onCloseToast }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 pointer-events-none">
      <div className="space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onCloseToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;