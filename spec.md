# The Focus Den

## Current State
Dashboard shows a "Total Study Time" display that auto-increments a `ticker` interval on page load, making the clock tick even with no active session. StudySession timer state (`isRunning`) starts as `false` and is only set `true` after `startSession.mutateAsync` succeeds -- but the backend call is failing with "failed to start session" because the photo blob bytes are embedded directly in the session object, which can exceed ICP per-message limits.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- **Dashboard.tsx**: Remove the auto-start `setInterval` ticker. Show `totalSeconds` statically (no live increment). Dashboard is a summary view, not a live timer.
- **StudySession.tsx**: Upload the photo blob separately before calling `startSession`. Pass only metadata (no raw bytes) in the session record for the start call. Ensure `isRunning` is never set `true` unless `startSession.mutateAsync` resolves without error. Improve error toast to include the actual error message.

### Remove
- `ticker` state and its `useEffect`/`setInterval` from Dashboard.tsx

## Implementation Plan
1. Remove `ticker` state, `timerRef`, and the `useEffect` in Dashboard.tsx. Replace `formatTime(totalSeconds + (ticker % 60))` with `formatTime(totalSeconds)`.
2. In StudySession `handleCaptureStart`: use `blob.upload()` (ExternalBlob upload API) before building the session object so the session stores a reference, not raw bytes. If upload fails, show error and do NOT proceed to startSession.
3. Ensure the `catch` block in `handleCaptureStart` re-throws only after setting `isRunning` to false and logging the actual error string.
