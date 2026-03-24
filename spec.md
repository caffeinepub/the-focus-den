# The Focus Den

## Current State
Community Feed supports session and aesthetic posts with image viewing and owner-only deletion. Reactions (fire, validate) are client-side only and not persisted. No comment system exists.

## Requested Changes (Diff)

### Add
- Persistent likes on community posts (per-user, toggle on/off, stored in backend)
- Comments on community posts (add, view, delete own comments)
- `PostComment` type: commentId, postId, userId, userName, text, createdAt
- Backend: `togglePostLike(postId)` → returns updated like count
- Backend: `getPostLikes(postId)` → returns count + whether caller has liked
- Backend: `addComment(postId, text)` → creates comment
- Backend: `getComments(postId)` → returns comments sorted oldest-first
- Backend: `deleteComment(commentId)` → owner only
- Frontend: Like button on each post card showing real count, toggled state
- Frontend: Comment section expandable per post, shows up to 3 comments with "View all" option
- Frontend: Comment input field per post

### Modify
- CommunityFeed.tsx: Replace local reaction state with real like/comment hooks
- useQueries.ts: Add useToggleLike, useGetPostLikes, useAddComment, useGetComments, useDeleteComment hooks

### Remove
- Local-only reaction state in CommunityFeed (replaced by persisted likes)

## Implementation Plan
1. Update backend with PostComment type, postLikes map, postComments map, and new functions
2. Add new query/mutation hooks in useQueries.ts
3. Update CommunityFeed.tsx with real like counts, toggleable like button, and comment UI
