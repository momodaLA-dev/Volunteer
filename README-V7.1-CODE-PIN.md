# 暖心同行 v7.1｜志工代號＋PIN 跨手機同步「隔離測試版」

**此版尚未連上你的 Firebase 專案，必須自行設定 Firebase 才可跨手機同步。** 原有 `index.html`、`admin.html` 維持 v6.2 本機版；新入口為 `sync-test.html`（志工）和 `sync-admin.html`（幹部）。

## 登入改變了什麼？
- 志工登入輸入 `V001`、`V002` 等代號＋至少 6 碼 PIN。
- 幹部登入輸入 `A001` 等代號＋至少 6 碼 PIN。
- **不用真實 Email**。為了使用 Firebase Authentication 現有的 Email/Password 驗證，本測試版程式在背景將 `V001` 轉成 `v001@volunteer.example.com`（保留網域 example.com 為示範用途）。PIN 仍交由 Firebase 驗證，而非儲存在 GitHub 或前端程式。
- 這只是方便跨裝置的**測試用登入別名**，不是 Firebase 原生「代號驗證」。正式版必須有管理後端做帳號開通、PIN 重設、速率限制、登入風險控制和幹部更強驗證。

## 手把手設定（需使用**獨立測試 Firebase 專案**）
1. Firebase Console → Authentication → Sign-in method → 啟用 **Email/Password**。
2. Authentication → Users → Add user，建立下列 **測試帳號**（這些 Email 是程式內部代號，不要寄信給它們）。選擇不同、隨機且至少 6 位數的密碼作為各人的 PIN：
   - `a001@volunteer.example.com`（幹部代號 A001）
   - `v001@volunteer.example.com`（志工 V001）
   - `v002@volunteer.example.com`（志工 V002）
   Firebase 會拒絕重複 Email，因此代號不會重複。
3. 記下三個 Firebase 使用者的 **UID**（可從 Authentication Users 複製），不可把密碼或 PIN 放在任何 GitHub 檔案。
4. Firebase → Realtime Database → 建立資料庫，選鎖定模式；在 Rules 貼入 `database.rules.json` 的內容並 Publish。
5. Realtime Database → Data → 手動建立 `roles/{A001 的 UID}`，值為字串 `admin`。**只有 Firebase 控制台管理員才能設定這個角色**。志工不應擁有 admin。
6. Firebase → Project settings → Your apps → Web app；把設定填入 `firebase-config.js`，包括 `databaseURL`。這些是公開的 Firebase 專案設定，不是 PIN 或私鑰。
7. Authentication → Settings → Authorized domains：新增 `momodala-dev.github.io`（如果還沒允許）。
8. 將 ZIP 解壓後全部檔案上傳 GitHub `Volunteer` 專案根目錄，然後等待 GitHub Pages 部署完成。

## 開啟
- 志工測試：`https://momodala-dev.github.io/Volunteer/sync-test.html`
- 幹部測試：`https://momodala-dev.github.io/Volunteer/sync-admin.html`

## 跨手機驗證
1. 幹部電腦用代號 `A001`＋PIN 登入 `sync-admin.html`；把任務指派給志工 V001 的 Firebase UID。
2. 手機 A 用 `V001`＋PIN 登入 `sync-test.html`，應看到指派任務；核對並送審。
3. 幹部後台應即時顯示送審、審核結果；可指派第二輪給 V002 的 UID。
4. 手機 B 用 `V002`＋PIN 登入測試頁，完成複點並送審。
5. 只有志工自己的任務與**審核狀態**會傳給志工端；`privateNotes` 由資料庫權限規則禁止志工讀取。幹部內部備註不會修改原始清點內容。

## 嚴格限制
- **只能使用假人名、假倉別、假品號與假庫存。** 不能直接用於真實協會倉儲或志工個資。
- 現階段 PIN 至少 6 碼是 Firebase Email/Password 的要求；6 位純數字 PIN 並非足夠的正式後台保護。正式使用前，幹部登入須採用更強的驗證或 MFA。
- 志工登入使用固定代號，但指派任務目前仍需要在後台輸入 Firebase UID，不是代號，下一階段可製作受權限保護的名冊對照。
- **不會自動同步舊版 localStorage**；v7.1 僅測試獨立雲端頁面，仍未支援正式庫存入庫、實體盤點增漏項、完整差異配對及原生 XLSX。
- 登入會有雲端網路需求；斷線只能保留部分本機草稿，不能聲稱送審成功。
