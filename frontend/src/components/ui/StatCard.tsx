import React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/utils/utils';

export type StatCardColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'red' | 'yellow';

const colorMap: Record<StatCardColor, string> = {
    blue:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green:  'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    pink:   'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    cyan:   'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    red:    'bg-red-500/10 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

export interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    className?: string;
    description?: string;
    isLoading?: boolean;
    color?: StatCardColor;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    className,
    description,
    isLoading,
    color = 'blue',
}) => (
    <div className={cn('rounded-lg border bg-card p-5 shadow-sm', className)}>
        <div className="flex items-start justify-between">
            <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading ? (
                    <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                )}
                {description && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {description}
                    </p>
                )}
            </div>
            <div className={cn('rounded-md p-2.5', colorMap[color])}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    </div>
);

export default StatCard;
