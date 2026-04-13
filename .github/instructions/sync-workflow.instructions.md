---
name: Sync `ndktu-student-platform` into `ndktu-student-face-platform`
description: "Sync the embedded source repo into the face-detection target repo while preserving face-detection-specific backend, frontend, and migration changes."
applyTo: "**/*"
---

## Goal

Sync new source changes from `ndktu-student-platform/` into `ndktu-student-face-platform/ndktu-student-platform/` without overwriting face-detection-specific modifications in the target.

## Preserve Target-Only Face Detection Changes

### Backend
- Keep extra result model fields in `app/models/results/model.py`:
  - `cheating_detected`
  - `reason_for_stop`
  - `cheating_image_url`
- Preserve extended quiz process schemas in `app/modules/quiz_process/schemas.py`:
  - `StartQuizResponse.image_url`
  - `EndQuizRequest.cheating_detected`, `reason`, `cheating_image_url`
  - `EndQuizResponse.cheating_detected`, `reason`
  - `UploadCheatingImageRequest`
  - `UploadCheatingImageResponse`
- Preserve face evidence upload endpoint in `app/modules/quiz_process/router.py`.
- Preserve quiz repository changes in `app/modules/quiz_process/repository.py`.
- Preserve `app/main.py` face-platform specifics:
  - `logfire.configure()`
  - `settings.absolute_upload_dir`
  - static mount for `/evidence`
  - router prefix `/api`
  - CORS including `localhost:3000` and `127.0.0.1:3000`
  - `ForceHTTPSMiddleware` skipping localhost.
- Preserve `app/core/config.py` additional config properties:
  - `absolute_upload_dir`
  - `evidence_dir`
- Keep face-platform Alembic migrations unique to target:
  - `0f1f0c528369_add_cheating_image_url.py`
  - `b22a8c788237_add_cheating.py`
  - `16e559917160_post_merge_sync.py`
  - `e9a039fd8295_your_descriptive_message_here.py`

### Frontend
- Keep face monitoring UI and hooks:
  - `src/components/QuizVideoMonitoring.tsx`
  - `src/hooks/useVideoMonitoring.ts`
- Keep cheating evidence upload service:
  - `src/services/cheatingImageService.ts`
- Keep face-detection config in `src/config/env.ts`:
  - `FACE_DETECTION_SERVICE_URL`
  - `API_BASE_URL`
  - `ENABLE_QUIZ_PROCTORING`
- Preserve face-specific page integration in quiz pages and results.

## Sync New Source-Only Features

### Backend
- Add source-only models and modules from the source repo, especially:
  - `hemis_transaction/`
  - `yakuniy/`
  - updated business logic in `hemis/`, `faculty/`, `group/`, `kafedra/`, `permission/`, `question/`, `quiz/`, `result/`, `statistics/`, `student/`, `subject/`, `teacher/`, `user/`, `user_answers/`, `yakuniy/`

### Frontend
- Add missing source pages and hooks:
  - `HemisSyncPage.tsx`, `HemisTransactionsPage.tsx`, `StudentUsersPage.tsx`, `YakuniyPage.tsx`
  - `ChangeGroupModal.tsx`, `HemisImportModal.tsx`
  - `useHemisTransactions.ts`, `useStudentUsers.ts`, `useYakuniy.ts`
  - `hemisTransactionService.ts`
- Update routing and navigation:
  - `App.tsx`
  - `Sidebar.tsx`
  - `Navbar.tsx`

### Migrations
- Copy source-only Alembic migrations into target while keeping all target-only face-detection migrations.
- If needed, generate a merge migration and apply `alembic upgrade head`.

## Merge Strategy

1. Run a diff between source and embedded target:
   - `diff -rq ndktu-student-platform/ ndktu-student-face-platform/ndktu-student-platform/ --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='.env'`
2. Categorize files:
   - `SOURCE-ONLY`: copy from source to target
   - `TARGET-ONLY`: preserve, do not delete
   - `BOTH-MODIFIED`: manually merge with face-platform logic preserved
3. For both-modified files, preserve face-platform customizations and add source enhancements around them.

## Verification

- Confirm backend build and routes still work.
- Confirm face detection service still runs and websocket logic remains intact.
- Confirm frontend still loads with new source routes/pages.
- Confirm database migrations include both source and target changes.

## Notes

- Never remove face-detection-specific backend or frontend logic.
- Never remove target-only Alembic migrations.
- Keep all Uzbek UI strings and `/api` prefix behavior.
