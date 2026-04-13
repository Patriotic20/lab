import { useEffect, useState, useCallback, useRef } from 'react';
import { UserCheck, UserX, UserSearch, AlertTriangle } from 'lucide-react';
import { useVideoMonitoring } from '@/hooks/useVideoMonitoring';

export interface QuizVideoMonitoringProps {
    active: boolean;
    onCheatingDetected: (imageData: string) => void;
    onDifferentPersonDetected: (imageData: string) => void;
    faceDetectionServiceUrl: string;
    imageUrl?: string;
}

export function QuizVideoMonitoring({
    active,
    onCheatingDetected,
    onDifferentPersonDetected,
    faceDetectionServiceUrl,
    imageUrl,
}: QuizVideoMonitoringProps) {
    const [warnings, setWarnings] = useState(0);
    const [lastWarningTime, setLastWarningTime] = useState(0);
    const [showWarningText, setShowWarningText] = useState(false);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleViolation = useCallback((imageData: string, type: 'multiple' | 'different') => {
        const now = Date.now();
        // Prevent rapid warning increments (de-bounce warnings every 3 seconds)
        if (now - lastWarningTime < 3000) return;

        setWarnings(prev => {
            const next = prev + 1;
            setLastWarningTime(now);
            setShowWarningText(true);

            // Hide warning text after 4 seconds
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            warningTimeoutRef.current = setTimeout(() => setShowWarningText(false), 4000);

            if (next >= 3) {
                if (type === 'multiple') onCheatingDetected(imageData);
                else onDifferentPersonDetected(imageData);
            }
            return next;
        });
    }, [onCheatingDetected, onDifferentPersonDetected, lastWarningTime]);

    const { state, startMonitoring, stopMonitoring } = useVideoMonitoring({
        faceDetectionServiceUrl,
        onMultipleFacesDetected: (img) => handleViolation(img, 'multiple'),
        onDifferentPersonDetected: (img) => handleViolation(img, 'different'),
        frameInterval: 500,
        imageUrl,
    });

    useEffect(() => {
        if (active && !state.isActive) {
            startMonitoring();
        } else if (!active && state.isActive) {
            stopMonitoring();
        }
    }, [active, state.isActive, startMonitoring, stopMonitoring]);

    useEffect(() => {
        return () => {
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, []);

    if (!active) return null;

    const isIssue = state.isDifferentPerson || state.lastFaceCount > 1;
    const isOk = state.isConnected && !isIssue && state.lastFaceCount === 1;

    return (
        <div className="fixed bottom-6 right-6 z-50 group">
            <div className={`relative transition-all duration-500 ease-in-out transform ${state.isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                
                {/* Minimalist Icon Bubble */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-500 ${
                    !state.isConnected ? 'border-gray-200 text-gray-400 bg-white' :
                    isIssue ? 'border-red-500 text-red-500 bg-red-50' :
                    isOk ? 'border-green-500 text-green-500 bg-green-50' :
                    'border-primary/30 text-primary bg-primary/5'
                }`}>
                    {!state.isConnected ? (
                        <UserSearch className="h-7 w-7 animate-pulse" />
                    ) : isIssue ? (
                        <UserX className="h-7 w-7 animate-bounce" />
                    ) : (
                        <UserCheck className={`h-7 w-7 ${isOk ? 'scale-110' : ''} transition-transform duration-500`} />
                    )}

                    {/* Warning Counter Badge */}
                    {warnings > 0 && (
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                            {warnings}
                        </div>
                    )}
                </div>

                {/* Warning Text Banner */}
                {showWarningText && (
                    <div className="absolute bottom-full mb-4 right-0 w-64 bg-red-600 text-white p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-tight">Ogohlantirish {warnings}/3</p>
                                <p className="text-[10px] leading-tight opacity-90 mt-0.5">
                                    {state.lastFaceCount > 1 ? 'Ekranda begona shaxs aniqlandi!' : 'Shaxsingizni tasdiqlashda xatolik!'}
                                    <br/>3 tadan so'ng test avtomatik to'xtatiladi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hover Status Details */}
                <div className="absolute right-full mr-4 bottom-0 w-44 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[11px] font-bold text-gray-800">Tizim holati</span>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-500">Holat:</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {isOk ? 'Normal' : 'Xatolik'}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">Yuzlar:</span>
                                <span className="font-bold text-gray-700">{state.lastFaceCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
