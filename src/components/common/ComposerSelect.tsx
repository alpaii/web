"use client";

import React from 'react';
import { Composer } from '@/lib/api';

interface ComposerSelectProps {
  composers: Composer[];
  value: number | undefined;
  onChange: (composerId: number | undefined) => void;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function ComposerSelect({
  composers,
  value,
  onChange,
  disabled = false,
  label = '작곡가',
  showLabel = false,
  placeholder = '작곡가 선택',
  required = false,
  className = '',
}: ComposerSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value ? parseInt(e.target.value) : undefined;
    onChange(newValue);
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className="min-w-[200px] rounded-md border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900 appearance-none cursor-pointer w-full"
        >
          <option value="">{placeholder}</option>
          {composers.map((composer) => (
            <option key={composer.id} value={composer.id}>
              {composer.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
