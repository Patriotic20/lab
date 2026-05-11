import React from 'react';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/utils/utils';

interface StatChartCardProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    isLoading?: boolean;
    isError?: boolean;
    isEmpty?: boolean;
    emptyLabel?: string;
    className?: string;
    bodyClassName?: string;
    height?: number;
}

export const StatChartCard: React.FC<StatChartCardProps> = ({
    title,
    description,
    children,
    actions,
    isLoading,
    isError,
    isEmpty,
    emptyLabel = "Ma'lumot topilmadi",
    className,
    bodyClassName,
    height = 280,
}) => {
    return (
        <div className={cn('flex flex-col rounded-lg border bg-card shadow-sm', className)}>
            <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{title}</h3>
                    {description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
            <div
                className={cn('flex-1 p-4', bodyClassName)}
                style={{ minHeight: height }}
            >
                {isLoading ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : isError ? (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
                        <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
                        <p className="text-sm">Xatolik yuz berdi</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
                        <BarChart3 className="mb-2 h-8 w-8 opacity-40" />
                        <p className="text-sm">{emptyLabel}</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default StatChartCard;
