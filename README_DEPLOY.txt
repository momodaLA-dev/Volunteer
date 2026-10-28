VolunteerCare Phase 1: per-document Firebase ID (2026-10-28)

Upload only these 4 files to the GitHub Pages project root:
- simple-count.js
- simple-count-volunteer.html
- simple-count-admin.html
- simple-count.css
README_DEPLOY.txt is for reference only.

Changes:
1. New button '+ 新增清點單（全新雲端編號）' immediately creates a unique push-key draft in v9/selfCounts/{auth.uid}/{docId} using a create-only Firebase transaction.
2. New document is opened only after cloud write and verification succeed.
3. Dirty local modifications block creating another document until saved to the cloud.
4. Existing '＋新增一筆' continues to add a row to the current document.
5. Multiple phones creating separate documents get distinct IDs; two phones editing the SAME existing document still require separate conflict-control work.
6. Existing selfCounts and V1/V2 records are not modified or migrated.

Important:
- Firebase Auth is required.
- No Firebase rules are included or deployed. Rules currently in the repo support the draft data shape; actual live rules must be validated.
- GitHub Pages hosts static files only. This package does not modify live Firebase data until operated by signed-in users.
- Backup the prior four files before replacing.

Smoke test:
A. Phone 1: log in V0001, click NEW DOCUMENT; note ID A.
B. Phone 2: same account, click NEW DOCUMENT; note ID B; ensure A != B.
C. Enter and sync different item rows from both devices; refresh history to see both draft cards.
D. Submit document A, verify admin inbox shows A; B remains a draft.
E. While unsaved edits exist, NEW DOCUMENT must be blocked.
F. Verify each row stays separate and totals are calculated only for display.

No production Firebase tests were run by this package author. Verify under a trial account before wider rollout.
