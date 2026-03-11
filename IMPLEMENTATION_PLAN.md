# Quiz Proctoring with Face Detection Implementation Plan

## Overview
Add real-time webcam monitoring during quizzes to detect and stop quizzes when 2+ faces are detected (anti-cheating measure).

---

## Architecture

### System Flow
```
Student Starts Quiz
    ↓
[Frontend] Request webcam permission
    ↓
[Frontend] Establish WebSocket to Face Detection Service
    ↓
[Frontend] Continuously send video frames via WebSocket
    ↓
[Face Detection Service] Analyzes frames, returns face count
    ↓
IF face_count >= 2:
    ├→ [Frontend] Stop quiz immediately
    ├→ [Backend] Record cheating flag
    ├→ [Student] Show "Quiz stopped - Multiple faces detected"
ELSE:
    └→ Continue quiz normally
```

---

## Implementation Tasks

### 1. **Backend Changes**

#### 1.1 Update Quiz Result Model
**File**: `backend/app/models/results/model.py`
- Add field: `cheating_detected: bool = False` (flag to mark if quiz was stopped due to multiple faces)
- Add field: `reason_for_stop: str | None` (e.g., "Multiple faces detected")

#### 1.2 Update Quiz Process Endpoint
**File**: `backend/app/modules/quiz_process/router.py`
- Modify `POST /quiz_process/end_quiz` to accept optional field: `cheating_detected: bool`
  ```python
  class EndQuizRequest:
      quiz_id: int
      user_id: int | None
      answers: list[AnswerDTO]
      cheating_detected: bool = False  # NEW
      reason: str | None = None  # NEW
  ```
- Update the logic to mark quiz result with cheating flag

#### 1.3 Create New Endpoint (Optional but Recommended)
**File**: `backend/app/modules/quiz_process/router.py`
- Add `POST /quiz_process/stop_quiz` endpoint
  ```python
  class StopQuizRequest:
      quiz_id: int
      user_id: int | None
      reason: str  # "Multiple faces detected"
  
  # Response: Create result with 0 score, cheating_detected=True
  ```
- This allows early termination without submitting answers

#### 1.4 Update Schema
**File**: `backend/app/modules/quiz_process/schemas.py`
- Update `EndQuizRequest` schema
- Update `EndQuizResponse` schema to optionally return: `cheating_detected: bool`

---

### 2. **Frontend Changes**

#### 2.1 Create Video Monitoring Hook
**File**: `frontend/src/hooks/useVideoMonitoring.ts` (NEW)
```typescript
interface VideoMonitoringConfig {
  faceDetectionServiceUrl: string; // e.g., "ws://face-detection:8000"
  onMultipleFacesDetected: () => void;
  onError: (error: string) => void;
}

export function useVideoMonitoring(config: VideoMonitoringConfig) {
  // 1. Request webcam permission
  // 2. Initialize WebSocket connection to face detection service
  // 3. Capture frames from canvas
  // 4. Send frames as base64 JPEG
  // 5. Listen for responses
  // 6. Call onMultipleFacesDetected if face_count >= 2
  // 7. Handle cleanup on unmount
}
```

#### 2.2 Create Video Monitoring Component
**File**: `frontend/src/components/QuizVideoMonitoring.tsx` (NEW)
```typescript
export interface QuizVideoMonitoringProps {
  active: boolean;
  onCheatingDetected: () => void;
  faceDetectionServiceUrl: string;
}

export function QuizVideoMonitoring({ 
  active, 
  onCheatingDetected,
  faceDetectionServiceUrl 
}: QuizVideoMonitoringProps) {
  // Displays:
  // - Small video preview (top corner)
  // - Webcam indicator (red dot when recording)
  // - Face detection status
  // - Permission denied message if needed
}
```

#### 2.3 Update QuizTestPage Component
**File**: `frontend/src/pages/QuizTestPage.tsx`
- Import `QuizVideoMonitoring` component
- Import `useVideoMonitoring` hook
- Add state: `cheatingDetected: boolean`
- Add state: `videoCheatingReason: string`
- In quiz phase: Render `<QuizVideoMonitoring />`
- When multiple faces detected:
  - Set `cheatingDetected = true`
  - Call `handleQuizStopped('Multiple faces detected')`
  - Show alert to student
  - Submit quiz with partial answers + `cheating_detected: true`

#### 2.4 Update Quiz Service
**File**: `frontend/src/services/quizProcessService.ts`
- Add to `EndQuizRequest`:
  ```typescript
  interface EndQuizRequest {
    quiz_id: number;
    user_id: number | null;
    answers: AnswerDTO[];
    cheating_detected?: boolean;  // NEW
    reason?: string;  // NEW
  }
  ```

#### 2.5 Add Configuration
**File**: `frontend/src/config/env.ts` (or update existing)
```typescript
export const FACE_DETECTION_SERVICE_URL = 
  import.meta.env.VITE_FACE_DETECTION_SERVICE_URL 
  || 'ws://localhost:8001/v1/video/stream';
```

---

### 3. **Configuration Changes**

#### 3.1 Environment Variables
**Frontend `.env.example`**:
```
VITE_FACE_DETECTION_SERVICE_URL=ws://localhost:8001/v1/video/stream
```

**Backend `.env.example`** (optional, if you want API communication):
```
FACE_DETECTION_SERVICE_URL=http://face-detection:8000
```

#### 3.2 Docker Configuration
**`docker-compose.yml`** (if standalone):
- Ensure face detection service is accessible to both frontend and backend
- Both need network access to the service

---

## Implementation Order

1. **Phase 1: Backend Setup** (1-2 hours)
   - [ ] Update models (add cheating_detected, reason_for_stop fields)
   - [ ] Update schemas
   - [ ] Update endpoint to handle cheating flag
   - [ ] Test with manual API calls

2. **Phase 2: Frontend Video Capture** (2-3 hours)
   - [ ] Create `useVideoMonitoring` hook
   - [ ] Implement WebSocket connection to face detection
   - [ ] Implement frame capture and sending
   - [ ] Handle permissions and errors

3. **Phase 3: Frontend UI Integration** (1-2 hours)
   - [ ] Create `QuizVideoMonitoring` component
   - [ ] Integrate into `QuizTestPage`
   - [ ] Add cheating detection handling
   - [ ] Update service calls

4. **Phase 4: Testing & Integration** (1-2 hours)
   - [ ] End-to-end testing
   - [ ] Handle edge cases (connection loss, permission denied, etc.)
   - [ ] Test with multiple browsers/scenarios

---

## Estimated Timeline
**Total: 5-9 hours of development work**

---

## Key Considerations

### Security
- Client-side only checks (advisory)
- No server-side recording of video (privacy)
- Just using the face detection API as-is

### User Experience
- Clear permission requests
- Visible webcam indicator
- Graceful error handling if camera access denied
- Can be skipped/retried by student (optional: make mandatory via admin settings)

### Performance
- Frame sampling (send every Nth frame to reduce bandwidth)
- Base64 encoding overhead
- Consider quality trade-off

### Error Handling
- WebSocket connection failures
- Camera access denied
- Service unavailable
- Network latency

---

## Testing Checklist
- [ ] Quiz starts with camera permission request
- [ ] Video frames send successfully
- [ ] Face detection responds correctly (1 face, 2 faces)
- [ ] Quiz stops immediately when 2+ faces detected
- [ ] Backend records cheating flag correctly
- [ ] Results show as stopped/cheating
- [ ] Works on multiple browsers
- [ ] Handles camera disconnection
- [ ] Privacy: No video stored anywhere
