"use client";

import React from 'react';

interface FormInputProps {
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'url' | 'tel';
  value: string | number;
  onChange: (value: string | number) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  min,
  max,
  step,
}: FormInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const numValue = e.target.value ? parseFloat(e.target.value) : '';
      onChange(numValue);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900"
      />
    </div>
  );
}
