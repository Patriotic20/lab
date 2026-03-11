# Quiz Proctoring with Face Detection - Implementation Complete

## Summary of Changes

This document outlines all changes made to implement real-time webcam monitoring during student quizzes. When a student begins a quiz, the system will capture video from their webcam and send it to the face detection service. If 2 or more faces are detected, the quiz will be immediately stopped and marked with a cheating flag.

---

## Backend Changes

### 1. Database Model Updates

#### File: `backend/app/models/results/model.py`

**Changes:**
- Added two new fields to the `Result` model:
  - `cheating_detected: bool` (default: False) - Flag to indicate if quiz was stopped due to multiple faces
  - `reason_for_stop: str | None` - Stores the reason for stopping (e.g., "Multiple faces detected")

**Code:**
```python
# Added imports
from sqlalchemy import Boolean, String

# Added fields to Result class
cheating_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
reason_for_stop: Mapped[str | None] = mapped_column(String(255), nullable=True)
```

**Database Migration Required:**
You will need to create an Alembic migration to add these columns:
```bash
cd backend
alembic revision --autogenerate -m "Add cheating detection fields to results"
alembic upgrade head
```

---

### 2. API Schemas

#### File: `backend/app/modules/quiz_process/schemas.py`

**Changes:**
- Updated `EndQuizRequest` to accept optional cheating detection fields:
  ```python
  cheating_detected: Optional[bool] = False
  reason: Optional[str] = None
  ```

- Updated `EndQuizResponse` to return cheating detection status:
  ```python
  cheating_detected: Optional[bool] = False
  reason: Optional[str] = None
  ```

---

### 3. Quiz Process Logic

#### File: `backend/app/modules/quiz_process/repository.py`

**Changes in `end_quiz()` method:**

1. **Early cheating detection handling:** If `cheating_detected=True`, the method now:
   - Creates a Result with 0 correct answers
   - Sets grade to 2 (failing)
   - Marks `cheating_detected=True` in database
   - Records the reason for stopping
   - Returns early without processing answers

2. **Normal quiz completion:** If no cheating detected:
   - Processes answers normally (unchanged)
   - Sets `cheating_detected=False`
   - Sets `reason_for_stop=None`

**Code Example:**
```python
# If cheating is detected, create result with minimal data
if data.cheating_detected:
    result = Result(
        user_id=user.id,
        quiz_id=quiz.id,
        subject_id=quiz.subject_id,
        group_id=quiz.group_id,
        correct_answers=0,
        wrong_answers=len(data.answers) if data.answers else 0,
        grade=2,  # Failing grade
        cheating_detected=True,
        reason_for_stop=data.reason or "Multiple faces detected"
    )
    # ... save and return
```

---

## Frontend Changes

### 1. Video Monitoring Hook

#### File: `frontend/src/hooks/useVideoMonitoring.ts` (NEW)

**Features:**
- Requests webcam permission from user
- Captures video frames and sends them via WebSocket to face detection service
- Listens for face detection responses
- Triggers callback when 2+ faces detected
- Handles errors (permission denied, connection failed, etc.)
- Cleans up resources on unmount

**Key Functions:**
- `startMonitoring()` - Initialize camera and WebSocket connection
- `stopMonitoring()` - Clean up all resources
- State includes: `isActive`, `hasPermission`, `isConnected`, `lastFaceCount`, `error`

**Usage:**
```typescript
const { state, startMonitoring, stopMonitoring } = useVideoMonitoring({
    faceDetectionServiceUrl: 'ws://localhost:8001/v1/video/stream',
    onMultipleFacesDetected: () => console.log('Cheating detected!'),
    frameInterval: 500, // Send frame every 500ms
});
```

---

### 2. Video Monitoring Component

#### File: `frontend/src/components/QuizVideoMonitoring.tsx` (NEW)

**Features:**
- Visual indicator showing webcam status (red dot for recording)
- Small video preview in corner (mirrored to match webcam perspective)
- Real-time face count display
- Connection status (active, connecting, disconnected, error)
- Information box explaining the proctoring rules
- Only visible during active quiz phase

**Displays:**
- Camera indicator and recording status
- Connection status with face count
- Small video preview with border
- Error messages if permission denied or connection fails
- Instructional text (in Uzbek) about proctoring requirements

---

### 3. Environment Configuration

#### File: `frontend/src/config/env.ts` (NEW)

**Configuration Variables:**
```typescript
FACE_DETECTION_SERVICE_URL = 'ws://localhost:8001/v1/video/stream'
ENABLE_QUIZ_PROCTORING = true (can be disabled via VITE_ENABLE_QUIZ_PROCTORING=false)
```

**How to override:** Create `.env.local` file:
```
VITE_FACE_DETECTION_SERVICE_URL=ws://your-domain:8001/v1/video/stream
VITE_ENABLE_QUIZ_PROCTORING=true
```

---

### 4. Quiz Test Page Integration

#### File: `frontend/src/pages/QuizTestPage.tsx` (MODIFIED)

**Changes:**

1. **New imports:**
   ```typescript
   import { QuizVideoMonitoring } from '@/components/QuizVideoMonitoring';
   import { FACE_DETECTION_SERVICE_URL, ENABLE_QUIZ_PROCTORING } from '@/config/env';
   import { AlertTriangle } from 'lucide-react'; // for cheating alert icon
   ```

2. **New state variables:**
   ```typescript
   const [cheatingDetected, setCheatingDetected] = useState(false);
   const [cheatingReason, setCheatingReason] = useState('Multiple faces detected');
   ```

3. **New handler function:**
   ```typescript
   const handleCheatingDetected = () => {
       setCheatingDetected(true);
       setCheatingReason('Multiple faces detected');
       // Auto-submit quiz after brief delay
       setTimeout(() => handleSubmit(), 500);
   };
   ```

4. **Updated `handleSubmit()`:**
   - Now includes `cheating_detected` and `reason` in the API request
   - Passes these fields to backend

5. **Updated results phase:**
   - Checks if `results.cheating_detected` is true
   - Shows red alert banner if cheating was detected
   - Displays special message instead of normal completion message
   - Shows red failing grade if caught cheating

6. **Quiz phase rendering:**
   - Adds `<QuizVideoMonitoring />` component
   - Component is active during quiz
   - Disabled when cheating is detected (or if `ENABLE_QUIZ_PROCTORING=false`)

---

### 5. Quiz Service Types

#### File: `frontend/src/services/quizProcessService.ts` (MODIFIED)

**Updated TypeScript interfaces:**
```typescript
export interface EndQuizRequest {
    quiz_id: number;
    user_id?: number | null;
    answers: AnswerDTO[];
    cheating_detected?: boolean;      // NEW
    reason?: string;                  // NEW
}

export interface EndQuizResponse {
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    grade: number;
    cheating_detected?: boolean;      // NEW
    reason?: string;                  // NEW
}
```

---

## Database Migration Guide

To add the cheating detection fields to your database:

```bash
# From backend directory
cd backend

# Create migration (auto-detects model changes)
alembic revision --autogenerate -m "Add cheating detection fields to results"

# Review the generated migration file in backend/app/migrations/versions/

# Apply migration
alembic upgrade head
```

---

## Environment Setup

### Frontend `.env.local`

```env
# Face Detection Service WebSocket URL
VITE_FACE_DETECTION_SERVICE_URL=ws://localhost:8001/v1/video/stream

# Enable quiz proctoring (set to false to disable)
VITE_ENABLE_QUIZ_PROCTORING=true

# API endpoint (if needed)
VITE_API_URL=http://localhost:8000/api
```

### Docker Compose Notes

Ensure both frontend and backend can reach the face detection service:

```yaml
services:
  face-detection:
    # ... existing config ...
    ports:
      - "8001:8000"  # Expose on port 8001

  ndktu-student-platform-frontend:
    environment:
      - VITE_FACE_DETECTION_SERVICE_URL=ws://face-detection:8000/v1/video/stream
    # ... rest of config ...

  ndktu-student-platform-backend:
    # Backend doesn't need face detection service direct access
    # (frontend handles the WebSocket connection)
    # ... rest of config ...
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] **Database migration applied successfully**
- [ ] **Backend API** accepts `cheating_detected` and `reason` in `/quiz_process/end_quiz`
- [ ] **Backend API** returns these fields in response
- [ ] **Frontend** requests camera permission on quiz start
- [ ] **Frontend** WebSocket connects to face detection service
- [ ] **Frontend** sends video frames correctly
- [ ] **Quiz stops immediately** when 2+ faces detected
- [ ] **Quiz result shows** cheating flag in database
- [ ] **Results page displays** cheating alert when applicable
- [ ] **Webcam indicator** shows in quiz UI (if enabled)
- [ ] **Works across browsers:** Chrome, Firefox, Safari, Edge
- [ ] **Graceful error handling:**
  - [ ] Camera permission denied → shows error, quiz continues
  - [ ] Face detection service unavailable → shows error message
  - [ ] WebSocket connection lost → displays error, allows retry
- [ ] **Privacy preserved:** No video is stored, only face count analyzed
- [ ] **Feature can be disabled** via `VITE_ENABLE_QUIZ_PROCTORING=false`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Student Browser                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  QuizTestPage Component                                │  │
│  │  ├─ Quiz Phase                                         │  │
│  │  │  └─ QuizVideoMonitoring (if enabled)              │  │
│  │  │     ├─ useVideoMonitoring Hook                    │  │
│  │  │     │  ├─ getUserMedia() → Webcam permission     │  │
│  │  │     │  ├─ Canvas Capture → Video frames          │  │
│  │  │     │  └─ WebSocket → Face Detection Service     │  │
│  │  │     └─ Display: Camera preview + Status          │  │
│  │  └─ Results Phase                                     │  │
│  │     └─ Show cheating alert if detected              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────┬─────────────┘
           │                                      │
           │ HTTP API                            │ WebSocket
           │ /quiz_process/start_quiz            │ /v1/video/stream
           │ /quiz_process/end_quiz              │
           │                                      │
    ┌──────▼──────┐                      ┌───────▼──────────┐
    │ Backend API │                      │ Face Detection   │
    │             │                      │ Service          │
    │ Quiz Logic  │                      │                  │
    │ -Validate   │                      │ Uses BlazeFace   │
    │ -Grade      │                      │ to detect faces  │
    │ -Store      │                      │ in video frames  │
    │  Results    │                      │                  │
    │             │                      │ Returns:         │
    │ Database:   │                      │ {face_count: 1}  │
    │ -Quiz       │                      │ or              │
    │ -Results    │                      │ {face_count: 2+} │
    │ -Questions  │                      └──────────────────┘
    └─────────────┘
```

---

## User Flow

### Student Perspective

1. **Takes Quiz:**
   - Clicks "Testni boshlash" (Start Quiz)
   - Enters PIN
   - Quiz loads with camera monitoring (if enabled)

2. **During Quiz:**
   - Camera preview visible in bottom-right corner (red recording indicator)
   - Takes questions normally
   - System monitors face count in real-time

3. **If Caught Cheating:**
   - Multiple faces detected by system
   - Quiz auto-stops immediately
   - Red alert appears: "Test to'xtatildi" (Quiz Stopped)
   - Reason shown: "Ko'p juzli shaxs aniqlandi" (Multiple faces detected)
   - Grade set to 2 (failing)
   - Cheating flag recorded in database

4. **After Quiz:**
   - Results page shows score
   - If cheating detected: Red alert banner displayed
   - Can start another quiz

### Teacher Perspective

- Can view student results including:
  - `cheating_detected` flag (true/false)
  - `reason_for_stop` (if applicable)
  - Grade given for the attempt

---

## Performance Considerations

### Frontend
- **Frame interval:** Default 500ms (2 frames/second) to balance responsiveness vs bandwidth
- **Image quality:** JPEG at 80% compression for smaller payload
- **Canvas size:** 640x480 resolution (scales to available)

### Backend
- **Face detection:** Uses lightweight BlazeFace model (runs on CPU)
- **No video storage:** Only face count processed, no recording

### Network
- **WebSocket:** Keep-alive connection during quiz
- **Bandwidth:** ~50-100 KB/s per connection
- **Latency tolerance:** Should handle 100-200ms latency gracefully

---

## Troubleshooting

### "Camera permission denied"
- User needs to grant webcam access in browser settings
- Can manually enable: Settings → Privacy & Security → Camera
- Quiz can continue without camera (if ENABLE_QUIZ_PROCTORING allows)

### "Unable to connect to face detection service"
- Verify face detection service is running
- Check WebSocket URL configuration
- Ensure network/firewall allows WebSocket connection
- Check CORS/proxy configuration

### Video stream not showing
- Camera device not available or in use
- Browser privacy settings blocking camera
- Check browser console for detailed errors

### Multiple faces not being detected
- Ensure VITE_ENABLE_QUIZ_PROCTORING=true
- Check face detection service is responding
- Verify face detection model is loaded (check service logs)

---

## Security Considerations

### Privacy
- ✅ No video is stored or transmitted beyond this session
- ✅ Only face count (integer) is processed
- ✅ No biometric data is collected
- ✅ WebSocket connection uses your existing HTTPS/WSS setup

### Fraud Prevention
- ⚠️ This is a **client-side advisory** system
- ⚠️ Sophisticated attacks (deepfakes, etc.) not prevented
- ✅ Deters casual cheating attempts
- ✅ Audit trail in database (cheating_detected flag)

### Recommendations
- Use alongside other proctoring measures for high-stakes assessments
- Consider requiring full-screen mode during quiz
- Implement test randomization
- Monitor suspicious result patterns

---

## Future Enhancements

Potential features for future versions:

1. **Server-side validation:** Re-verify face count server-side for tamper resistance
2. **Video recordings:** Optional recording for compliance (with consent)
3. **Screen recording:** Detect alt-tabs or window switching
4. **Audio detection:** Detect unusual sounds (other voices)
5. **Admin dashboard:** View cheating incidents, analytics
6. **Adjustable threshold:** Allow teachers to configure face detection sensitivity
7. **Retake policies:** Different handling for first-time vs repeat violations
8. **Better error recovery:** Pause quiz if connection lost, resume when reconnected

---

## Files Modified/Created

### Created
- ✅ `frontend/src/hooks/useVideoMonitoring.ts` - Video capture and face detection integration
- ✅ `frontend/src/components/QuizVideoMonitoring.tsx` - UI component for video monitoring
- ✅ `frontend/src/config/env.ts` - Environment configuration

### Modified
- ✅ `backend/app/models/results/model.py` - Added cheating detection fields
- ✅ `backend/app/modules/quiz_process/schemas.py` - Updated API schemas
- ✅ `backend/app/modules/quiz_process/repository.py` - Enhanced end_quiz logic
- ✅ `frontend/src/pages/QuizTestPage.tsx` - Integrated video monitoring
- ✅ `frontend/src/services/quizProcessService.ts` - Updated request/response types

### Database
- ⚠️ **Requires migration:** Add `cheating_detected` and `reason_for_stop` columns to `results` table

---

## Summary

The implementation is **complete and ready for integration testing**. The system provides:

✅ Real-time face detection during quizzes  
✅ Automatic quiz termination on cheating detection  
✅ Database audit trail for compliance  
✅ User-friendly error handling  
✅ Graceful degradation if service unavailable  
✅ Privacy-respecting (no video storage)  
✅ Configurable via environment variables  

**Next Steps:**
1. Run database migration
2. Configure environment variables
3. Test with face detection service running
4. Deploy to staging environment
5. Conduct user acceptance testing with students
