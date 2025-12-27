"use client";

import React from 'react';

interface ErrorAlertProps {
  message: string | null;
  onClose: () => void;
  variant?: 'error' | 'warning' | 'info' | 'success';
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    text: 'text-red-800 dark:text-red-400',
    button: 'bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700',
    label: 'Error:',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-400',
    button: 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700',
    label: 'Warning:',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-400',
    button: 'bg-blue-200 text-blue-700 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700',
    label: 'Info:',
  },
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    text: 'text-green-800 dark:text-green-400',
    button: 'bg-green-200 text-green-700 hover:bg-green-300 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700',
    label: 'Success:',
  },
};

export default function ErrorAlert({ message, onClose, variant = 'error' }: ErrorAlertProps) {
  if (!message) return null;

  const styles = variantStyles[variant];

  return (
    <div className={`mb-4 rounded-md p-4 border ${styles.container} ${styles.text}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1">
          <span className="font-semibold">{styles.label}</span> {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 rounded-md px-2 py-1 transition-colors font-bold text-lg leading-none ${styles.button}`}
          title="Close"
          aria-label="Close message"
        >
          ×
        </button>
      </div>
    </div>
  );
}
