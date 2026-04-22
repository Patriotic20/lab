import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className={cn(
                    "relative w-full max-w-lg rounded-lg border bg-background shadow-lg duration-200 animate-in fade-in zoom-in-95",
                    "flex flex-col max-h-[calc(100vh-2rem)]",
                    className
                )}
            >
                {/* Header — fixed, never scrolls */}
                <div className="flex flex-col space-y-1.5 text-center sm:text-left px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
                {/* Body — scrolls when content is taller than viewport */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
