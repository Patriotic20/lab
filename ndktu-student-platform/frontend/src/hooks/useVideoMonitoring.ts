import { useEffect, useRef, useState, useCallback } from 'react';

export interface VideoMonitoringConfig {
    faceDetectionServiceUrl: string;
    onMultipleFacesDetected: (imageData: string) => void;
    onDifferentPersonDetected?: (imageData: string) => void;
    onError?: (error: string) => void;
    frameInterval?: number;
    imageUrl?: string;
}

export interface VideoMonitoringState {
    isActive: boolean;
    hasPermission: boolean;
    isConnected: boolean;
    lastFaceCount: number;
    isDifferentPerson: boolean;
    isReferenceCaptured: boolean;
    error: string | null;
}

export function useVideoMonitoring(config: VideoMonitoringConfig) {
    const [state, setState] = useState<VideoMonitoringState>({
        isActive: false,
        hasPermission: false,
        isConnected: false,
        lastFaceCount: 0,
        isDifferentPerson: false,
        isReferenceCaptured: false,
        error: null,
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const frameIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastImageCapture = useRef<string>('');

    const captureAndEncodeFrame = useCallback((): string => {
        if (!videoRef.current || !canvasRef.current) return '';
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            return canvasRef.current.toDataURL('image/jpeg', 0.8);
        }
        return '';
    }, []);

    const startMonitoring = useCallback(async () => {
        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });

            streamRef.current = stream;

            // Create video element
            if (!videoRef.current) {
                const video = document.createElement('video');
                video.autoplay = true;
                video.playsInline = true;
                videoRef.current = video;
            }

            videoRef.current.srcObject = stream;

            // Wait for video to be ready
            await new Promise<void>((resolve) => {
                const handler = () => {
                    videoRef.current?.removeEventListener('loadedmetadata', handler);
                    resolve();
                };
                videoRef.current?.addEventListener('loadedmetadata', handler);
            });

            setState((prev: VideoMonitoringState) => ({ ...prev, hasPermission: true, isActive: true, error: null }));

            // Create canvas for frame capture
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Establish WebSocket connection
            const wsUrl = new URL(config.faceDetectionServiceUrl);
            if (config.imageUrl) {
                wsUrl.searchParams.append('image_url', config.imageUrl);
            }
            const ws = new WebSocket(wsUrl.toString());

            ws.onopen = () => {
                setState((prev: VideoMonitoringState) => ({ ...prev, isConnected: true }));

                // Start sending frames at specified interval
                const intervalMs = config.frameInterval || 1000;
                frameIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN && videoRef.current) {
                        const jpeg = captureAndEncodeFrame();
                        lastImageCapture.current = jpeg;
                        ws.send(jpeg);
                    }
                }, intervalMs);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const faceCount = data.face_count || 0;
                    const hasTwoFaces = data.has_two_faces || false;
                    const isDifferentPerson = data.is_different_person || false;
                    const isReferenceCaptured = data.is_reference_captured || false;

                    setState((prev: VideoMonitoringState) => ({ 
                        ...prev, 
                        lastFaceCount: faceCount,
                        isDifferentPerson,
                        isReferenceCaptured
                    }));

                    // Check for violations
                    if (hasTwoFaces) {
                        const imageData = lastImageCapture.current || captureAndEncodeFrame();
                        config.onMultipleFacesDetected(imageData);
                    } else if (isDifferentPerson) {
                        const imageData = lastImageCapture.current || captureAndEncodeFrame();
                        if (config.onDifferentPersonDetected) {
                            config.onDifferentPersonDetected(imageData);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing face detection response:', error);
                }
            };

            ws.onerror = (error: Event) => {
                const errorMsg = 'WebSocket error: Unable to connect to face detection service';
                console.error(errorMsg, error);
                setState((prev: VideoMonitoringState) => ({
                    ...prev,
                    isConnected: false,
                    error: errorMsg,
                }));
                if (config.onError) {
                    config.onError(errorMsg);
                }
            };

            ws.onclose = () => {
                setState((prev: VideoMonitoringState) => ({ ...prev, isConnected: false }));
            };

            wsRef.current = ws;
        } catch (error) {
            const errorMsg =
                error instanceof DOMException && error.name === 'NotAllowedError'
                    ? 'Camera permission denied'
                    : error instanceof Error
                      ? error.message
                      : 'Failed to start camera';

            setState((prev: VideoMonitoringState) => ({
                ...prev,
                hasPermission: false,
                error: errorMsg,
                isActive: false,
            }));

            if (config.onError) {
                config.onError(errorMsg);
            }
        }
    }, [config, captureAndEncodeFrame]);

    const stopMonitoring = useCallback(() => {
        // Clear frame interval
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // Stop stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            streamRef.current = null;
        }

        // Clear video and canvas
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setState((prev: VideoMonitoringState) => ({
            ...prev,
            isActive: false,
            isConnected: false,
            lastFaceCount: 0,
        }));
    }, []);

    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    return {
        state,
        startMonitoring,
        stopMonitoring,
        videoRef,
    };
}
