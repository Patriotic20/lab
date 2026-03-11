/**
 * Input.tsx
 *
 * Design decisions:
 * - h-9 default aligns with sm Button height for consistent action bars.
 * - Optional `label` prop renders an accessible label above the field.
 * - ring-based focus (not border-color shift) for predictable layout.
 * - Password toggle button is aria-labelled.
 * - Error state uses red ring + red text helper below.
 * - Optional `leftAddon`/`rightAddon` slots for icons inside the field.
 */
import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
    error?: string;
    label?: string;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    type,
    error,
    label,
    leftAddon,
    rightAddon,
    id,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-foreground"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {leftAddon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {leftAddon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    type={inputType}
                    className={cn(
                        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
                        'placeholder:text-muted-foreground',
                        'transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-destructive focus-visible:ring-destructive',
                        leftAddon && 'pl-9',
                        (rightAddon || isPassword) && 'pr-9',
                        className
                    )}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}

                {rightAddon && !isPassword && (
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {rightAddon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-xs text-destructive" role="alert">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
