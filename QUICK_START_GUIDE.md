# Quick Start Guide - Quiz Proctoring Setup

## 1. Backend Setup (5-10 minutes)

### Step 1: Create & Apply Database Migration

```bash
# Navigate to backend
cd backend

# Create the migration
alembic revision --autogenerate -m "Add cheating detection fields to results"

# Verify migration file looks correct (check backend/app/migrations/versions/)

# Apply migration
alembic upgrade head

# Verify with: alembic current
```

### Step 2: Verify Backend Models

The following changes should already be in place:
- ✅ `app/models/results/model.py` - Has `cheating_detected` and `reason_for_stop` fields
- ✅ `app/modules/quiz_process/schemas.py` - Has updated request/response DTOs
- ✅ `app/modules/quiz_process/repository.py` - Handles cheating flag logic

### Step 3: Test Backend Endpoint

```bash
# Start backend (if not already running)
python -m uvicorn app.main:app --reload

# Test endpoint with curl
curl -X POST http://localhost:8000/api/quiz_process/end_quiz \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 1,
    "user_id": 1,
    "answers": [],
    "cheating_detected": true,
    "reason": "Multiple faces detected"
  }'
```

---

## 2. Frontend Setup (5 minutes)

### Step 1: Create `.env.local`

In the frontend directory, create `.env.local`:

```env
# Face Detection Service WebSocket URL
VITE_FACE_DETECTION_SERVICE_URL=ws://localhost:8001/v1/video/stream

# Enable quiz proctoring
VITE_ENABLE_QUIZ_PROCTORING=true

# Backend API URL (if different)
VITE_API_URL=http://localhost:8000/api
```

### Step 2: Verify Frontend Files

Check these files are in place:
- ✅ `src/hooks/useVideoMonitoring.ts` - Video capture hook
- ✅ `src/components/QuizVideoMonitoring.tsx` - Video monitoring UI component
- ✅ `src/config/env.ts` - Environment config
- ✅ `src/pages/QuizTestPage.tsx` - Updated with video monitoring integration
- ✅ `src/services/quizProcessService.ts` - Updated request/response types

### Step 3: Install Dependencies (if needed)

```bash
npm install  # or yarn install
```

---

## 3. Face Detection Service (prerequisite)

Make sure the face detection service is running on port 8001:

```bash
# From the face detection project directory
cd ndktu-student-face-detection

# Option 1: Direct Python
python -m uvicorn app.main:app --port 8001

# Option 2: Docker
docker run -p 8001:8000 face-detection:latest

# Verify it's running
curl http://localhost:8001/docs  # Should show Swagger UI
```

---

## 4. Run Development Environment

### Terminal 1: Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Face Detection Service

```bash
cd ndktu-student-face-detection
python -m uvicorn app.main:app --reload --port 8001
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev
```

Now open browser: http://localhost:5173

---

## 5. Test the Feature

### Test Flow:

1. **Login as Student** → Go to Quiz page
2. **Start a Quiz** → Enter PIN
3. **During Quiz** → You should see camera indicator in bottom-right corner
4. **Grant Webcam Permission** → Click allow in browser prompt
5. **See Status** → Green indicator shows camera is active and faces detected
6. **Test with 2+ Faces** → Hold up two faces to camera (yourself + mirror/photo/person)
7. **Result:** Quiz should stop immediately and show cheating alert

### Quick Test Without 2 Faces:

To test without multiple faces:
- Set `VITE_ENABLE_QUIZ_PROCTORING=false` in `.env.local`
- Quiz runs normally without camera monitoring
- Re-enable when ready to test full feature

---

## 6. Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_FACE_DETECTION_SERVICE_URL` | `ws://localhost:8001/v1/video/stream` | WebSocket URL for face detection |
| `VITE_ENABLE_QUIZ_PROCTORING` | `true` | Enable/disable camera monitoring |
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API endpoint |

### Feature Flags

To **disable** proctoring temporarily:
```env
VITE_ENABLE_QUIZ_PROCTORING=false
```

To **use different face detection service**:
```env
VITE_FACE_DETECTION_SERVICE_URL=ws://your-domain:port/v1/video/stream
```

---

## 7. Troubleshooting

### Issue: "Unable to connect to face detection service"

**Solution:**
- Verify face detection service is running on port 8001
- Check WebSocket URL in `.env.local`
- Check browser console for exact error
- Try: `ws://localhost:8001/v1/video/stream`

### Issue: Camera not showing up

**Solution:**
- Grant webcam permission in browser
- Check browser security settings
- Ensure camera is not in use by other apps
- Try different browser (Chrome, Firefox, Edge)

### Issue: "Database error: unknown table/column"

**Solution:**
- Run database migration: `alembic upgrade head`
- Verify migration executed: `alembic current`
- Check for errors in migration output

### Issue: Face detection not triggering

**Solution:**
- Verify face detection service is receiving frames
- Check service logs: http://localhost:8001/docs (Swagger)
- Manually test: `curl -X POST http://localhost:8001/v1/video/analyze` with video file
- Check face detection service has BlazeFace model loaded

### Issue: Quiz continues after 2 faces detected

**Solution:**
- Verify `VITE_ENABLE_QUIZ_PROCTORING=true` in `.env.local`
- Check WebSocket is connected (green indicator in UI)
- Wait a moment - there's a 500ms delay before stopping
- Check browser console for errors
- Verify face detection service is responding (check logs)

---

## 8. Before Production

### Deployment Checklist

- [ ] Database migrations applied in production
- [ ] Environment variables set in production:
  - [ ] `VITE_FACE_DETECTION_SERVICE_URL` points to production service
  - [ ] `VITE_ENABLE_QUIZ_PROCTORING=true`
- [ ] Face detection service running and accessible
- [ ] SSL/TLS enabled (if HTTPS/WSS required)
- [ ] Tested with multiple browsers
- [ ] Tested with different network conditions
- [ ] User documentation updated for students (camera permission, proctoring rules)
- [ ] Informed teachers about cheating detection feature

### Security Review

- ✅ No video recording/storage
- ✅ Only face count transmitted
- ✅ WebSocket uses existing security model
- ✅ Cheating flag audit trail in database
- ✅ Graceful fallback if service unavailable

---

## 9. Supporting Documentation

For more detailed information, see:

- **Full Implementation Guide:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Architecture Plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Face Detection API:** `ndktu-student-face-detection/README.md`

---

## 10. Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for JavaScript errors
3. Check backend logs for API errors
4. Check face detection service logs
5. Verify all three services are running
6. Check network connectivity between services

---

**You're all set!** The quiz proctoring feature should now be fully functional.
