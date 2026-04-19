/**
 * Environment configuration for the frontend
 */

// Face Detection Service URL (WebSocket)
// Default: ws://localhost:8001/v1/video/stream
// Can be overridden with VITE_FACE_DETECTION_SERVICE_URL environment variable
export const FACE_DETECTION_SERVICE_URL =
    import.meta.env.VITE_FACE_DETECTION_SERVICE_URL || 'ws://localhost:8001/v1/video/stream';

// Backend API URL
export const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Enable Face Detection during Quiz (set to false to disable proctoring)
export const ENABLE_QUIZ_PROCTORING =
    import.meta.env.VITE_ENABLE_QUIZ_PROCTORING !== 'false';
