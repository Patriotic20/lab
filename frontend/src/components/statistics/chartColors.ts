export const CHART_COLORS = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#ef4444', // red-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#a855f7', // purple-500
];

export const colorAt = (i: number) => CHART_COLORS[i % CHART_COLORS.length];
