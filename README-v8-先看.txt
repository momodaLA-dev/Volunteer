# 暖心同行 v8.0｜Firebase 雲端整合預覽（2026-10-21）

## 請先看（避免舊資料遺失）
本套提供「雲端統一版」的完整程式來源與安全預覽入口。**安全部署時不要覆蓋 index.html、admin.html**：上傳 `cloud-preview.html`、`cloud-preview-admin.html`、`cloud-hub.js`、`cloud-hub.css`、`sync.js`、`sync-test.html`、`sync-admin.html` 及下列規則檔（規則檔不能用 GitHub 上傳取代 Firebase 規則發布）。

預覽網址：
- https://momodala-dev.github.io/Volunteer/cloud-preview.html
- https://momodala-dev.github.io/Volunteer/cloud-preview-admin.html

ZIP 中 `index.html` 與 `admin.html` 是未來切換正式入口用的候選版本，暫時**不要上傳覆蓋**，否則原版 localStorage 清點紀錄不會自動出現（原瀏覽器資料尚在，但新版頁面不讀）。

## 新版工作方式
- 既有管理員 A0001：Firebase Authentication + roles UID=admin。
- 志工 V0001 小安、V0002 小恩，V0003 小樂（**V0003 必須先建立 Firebase Authentication 帳號並在名冊中綁定 UID**）。
- 新增 V0004、V0005：Firebase Authentication 新增對應 Email/PIN 帳號（統一命名 v0004@gmail.com）、在新版管理端志工名冊貼入 UID／設定姓名。**不需要修改任何網站程式或資料庫規則**。日後正式營運建議使用真正受控的身分驗證與帳號救援機制，不宜依賴無法接收信件的測試 Email。
- 公告 `announcements`、今日工作 `workAssignments/$uid`、回報 `workReports/$uid`、訊息 `conversations/$uid` 都在 Firebase。
- 清點與複點沿用 Firebase `tasks` + `assignments/$uid` + `submissions` + `drafts` + `reviewStatus`；主單號及複點版次 V1/V2...。
- 管理員可讀取所有；志工讀取自己被指派的資料並寫入自己的回報，不可讀私人備註。

## 必做的 Firebase 規則部署
1. 在 Firebase Console > Volunteer Care > Realtime Database > 規則，**先備份現行完整規則**。
2. 將本包 `database.rules.json` 的完整內容貼上並發布，不能只新增單一區塊。此規則適用於此預覽系統，需實際模擬各帳號的允許/拒絕後再用真實資料。
3. 使用 A0001 模擬讀取 `/privateNotes` 與 `/workAssignments`，使用 V0001 模擬讀取 `/workAssignments/<自己的UID>`，並確認志工不能讀其他 UID 的指派或私人備註。

## 既有資料警告
既有本機單據例如 INV-20261021-001 與原始的公告／今日服務／聊天／品號等，只在原瀏覽器 localStorage 的資料**不會自動搬移到雲端**。請先使用舊版匯出 CSV/JSON 保留備份。此包目前沒有自動匯入／資料去重／衝突合併功能。不要為了模擬雲端清點而刪掉原始單據。

## 目前限制（不要作為正式庫存系統）
- 清點／複點和服務工作使用不同 Firebase 節點與任務頁，尚未合併成同一張業務主單。
- 舊版的清點歷史、庫存、品號表、排班及訊息不會自動遷移。
- 同一雲端草稿在兩台裝置同時編輯仍可能衝突；離線只能依瀏覽器本機草稿，不能保證跨裝置即時合併。
- 系統目前沒有後端稽核紀錄、容量監控、正式匯入遷移、永久刪除流程及強驗證；規則只是初步防護，正式上線前需實測及安全審核。
- 雲端清點任務由管理員在「物資清點／複點」分頁派發；建立工作班次不會自動建立清點單。

## 安全測試
1. A0001 於預覽後台發布公告，V0001 登入預覽志工端是否看得到。
2. A0001 指派「今日工作」給 V0002，確認 V0002 看得到、V0001 看不到。
3. V0002 完成回報，A0001 回報紀錄看得到。
4. A0001 指派物資清點給 V0002，V0002 能送審且他人無法擅自修改。
5. 確認三個帳號皆無 `permission_denied`，測試瀏覽器關閉重新登入。

此次為程式整合候選版，已離線檢查語法、JSON 及壓縮包；未連線至你的實際 Firebase 執行測試，尚未代替你部署 GitHub 或 Firebase。
