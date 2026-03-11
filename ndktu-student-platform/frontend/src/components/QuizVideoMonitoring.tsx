import { useEffect } from 'react';
import { AlertCircle, Camera, Radio } from 'lucide-react';
import { useVideoMonitoring } from '@/hooks/useVideoMonitoring';

export interface QuizVideoMonitoringProps {
    active: boolean;
    onCheatingDetected: (imageData: string) => void;
    faceDetectionServiceUrl: string;
}

export function QuizVideoMonitoring({
    active,
    onCheatingDetected,
    faceDetectionServiceUrl,
}: QuizVideoMonitoringProps) {
    const { state, startMonitoring, stopMonitoring } = useVideoMonitoring({
        faceDetectionServiceUrl,
        onMultipleFacesDetected: onCheatingDetected,
        frameInterval: 500, // Send frame every 500ms
    });

    useEffect(() => {
        if (active && !state.isActive) {
            startMonitoring();
        } else if (!active && state.isActive) {
            stopMonitoring();
        }
    }, [active, state.isActive, startMonitoring, stopMonitoring]);

    if (!active) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Video Monitor Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold">Kamera Nadzorasi</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Radio className="h-3 w-3 animate-pulse text-red-500" />
                        <span className="text-xs text-red-500">Yashil</span>
                    </div>
                </div>

                {/* Status Section */}
                {state.error ? (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                        <div className="flex gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-medium text-amber-900">Xatolik</p>
                                <p className="text-amber-700">{state.error}</p>
                                <p className="text-amber-600 mt-1 text-xs">
                                    Iltimos kameraga ruxsat bering yoki qayta urinib ko'ring.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : state.isConnected ? (
                    <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                        <p className="text-xs text-green-700">
                            <span className="font-medium">Holat:</span> Faol (Siz yagona bo'lishingiz kerak)
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            Juzlar aniqlandi: {state.lastFaceCount}
                        </p>
                    </div>
                ) : state.isActive ? (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                        <p className="text-xs text-blue-700">Kameraga ulanyapti...</p>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                        <p className="text-xs text-gray-600">Kamera o'chiq</p>
                    </div>
                )}

                {/* Camera Preview - Small container */}
                <div className="bg-black rounded h-40 flex items-center justify-center overflow-hidden relative mb-3">
                    {state.isActive && !state.error ? (
                        <div className="relative w-full h-full bg-black">
                            <video
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{
                                    transform: 'scaleX(-1)',
                                }}
                            />
                            <div className="absolute inset-0 border-2 border-green-500 rounded pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <Camera className="h-8 w-8 mb-2" />
                            <p className="text-xs">Kamera faol emas</p>
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <p className="font-medium mb-1">Ogohlantirildi:</p>
                    <ul className="space-y-0.5 text-gray-700">
                        <li>• Yagona bo'lishingiz kerak</li>
                        <li>• Ikki yoki ko'proq juz aniqlansa test to'xtatiladi</li>
                        <li>• Kamera ijozisiz davom etin'you</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
