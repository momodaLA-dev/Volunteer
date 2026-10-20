# 暖心同行 v7｜Firebase 跨手機「隔離測試版」

這是跨手機測試專用入口，**沒有改動** v6.2 原始 `index.html`（志工端）與 `admin.html`（幹部端），其舊版本機資料也不會自動上傳。正式整合要等測試通過。

## 先決條件：Firebase（使用獨立測試專案）
1. 建立或選擇**專用測試 Firebase 專案**。Firebase Console → Build → Authentication → Sign-in method → 啟用「Email/Password」。
2. Authentication → Users → Add user：建立一位幹部測試帳號、兩位志工測試帳號。記下各個 UID。不用真實姓名及正式資料。
3. Build → Realtime Database → 建立資料庫，建議先選**鎖定模式**（不要選測試模式），複製 databaseURL。
4. Realtime Database → Rules：貼上 `database.rules.json` 的全部內容並 Publish。
5. 在 Realtime Database → Data，以管理員身分手動新增唯一幹部角色：`roles/{幹部UID}`，值是文字 `admin`。在 Firebase Console Data 中點「+」新增 `roles` 物件及子項。**不能在網頁上自行設定 admin**。
6. Firebase Console → Project settings → Your apps → 新增 Web App；把取得的 `firebaseConfig` 各欄位填入 `firebase-config.js`。務必包含 `databaseURL`，保留引號。
7. Authentication → Settings → Authorized domains：確保 `momodala-dev.github.io` 是允許網域。必要時新增。注意勿把 GitHub 誤寫成有路徑的完整網址。
8. 將整包 ZIP 解壓的檔案上傳 GitHub `Volunteer` 根目錄。公開靜態網站含 Firebase API key 正常，但絕不可把 service account 私鑰或真正密碼放進 GitHub。

## 分別開啟（同一 GitHub Pages 專案）
- 原始 v6.2 志工介面：`https://momodala-dev.github.io/Volunteer/`
- 原始 v6.2 後台：`https://momodala-dev.github.io/Volunteer/admin.html`
- **Firebase 志工同步測試：** `https://momodala-dev.github.io/Volunteer/sync-test.html`
- **Firebase 幹部同步測試：** `https://momodala-dev.github.io/Volunteer/sync-admin.html`

## 三裝置測試流程
1. 幹部在電腦開 `sync-admin.html`，以管理員信箱登入。
2. 按「建立派發任務」：選志工 A 的 Firebase UID，填兩筆範例（A倉,#01,10,202712），選擇核對方式，派發。
3. 志工 A 以手機開 `sync-test.html`，用志工 A 帳號登入。看到任務、核對、送出，畫面顯示雲端已收到。
4. 電腦幹部畫面無須重新整理即可看到送審，查看比對與審核狀態，寫入內部備註。
5. 幹部點「依此單建立下一輪複點」，把 UID 改成志工 B，選三種範圍之一與「隱藏答案」或「顯示參考資料」，派發。志工 B 在第二支手機登入接任務。
6. 第二支手機送審後，幹部可繼續無限次建立新一輪任務。每輪獨立雲端記錄，沒有覆寫上一輪。
7. 幹部點「審核通過」或「退回」，志工手機只會看到狀態。**幹部內部備註不可由志工帳號讀取**，不只是 UI 隱藏。

## 重要限制
- v7 是一個**可跨手機測試的獨立模組**，不是完整 v6.2 與 Firebase 的整合；v6.2 原本班表、通知聊天、物資統計及複點頁面目前仍是本機版。
- 測試模組的三種範圍可選擇並標示，但**異常項次自動挑選、儲位主檔及全單實體盤點防漏列**尚未實作；參考明細由幹部自行指定。
- 測試時由幹部將上一輪結果手動核對後建立下一輪參考任務，尚非自動 V1/V2 精準配對引擎。
- 這個測試模組在有網路時即時同步，**不支援離線成功送審**；離線時只能保留瀏覽器草稿，連網後需再次點送審。
- 尚未建立正式庫存交易、結單後入庫、Excel 原生 XLSX 匯入和伺服器防重複庫存寫入。請勿用於真實庫存。
- Firebase 電子郵件密碼測試帳號，勿放在 GitHub。不要使用真實個資。
- UID 是 Firebase Auth 使用者識別碼，並非使用者姓名。身分與權限由資料庫規則審查。
