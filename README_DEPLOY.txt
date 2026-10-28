暖心同行｜自行清點 → 幹部收件匣｜V3.1 試辦版（2026-10-28）

【只上傳這 4 個檔案到 GitHub 倉庫根目錄】
  simple-count-volunteer.html
  simple-count-admin.html
  simple-count.js
  simple-count.css

這是獨立試辦入口，不更動 index.html、admin.html、inventory-cloud.js、firebase-config.js 或 Firebase Rules。
先不要把這兩個新網址放到所有志工可見的主選單；僅提供測試帳號試辦。
志工端：https://momodala-dev.github.io/Volunteer/simple-count-volunteer.html
幹部端：https://momodala-dev.github.io/Volunteer/simple-count-admin.html

【資料路徑】
沿用已存在的 v9/selfCounts/$uid/$id。
使用原本的 Firebase Authentication 和 roles/$uid = admin 管理權限。
不自動修改 v9/assigned、v9/rounds、v9/submissions 或舊清點資料。
需要線上 Rules 仍允許原有的 selfCounts，若出現 PERMISSION_DENIED 請先匯出現行規則比對，絕對不要直接以舊 ZIP 規則覆蓋。

【實作功能】
志工：登入；建立清點單；多筆倉別、品號、數量、效期；本機草稿；雲端草稿；固定單號送出；送出回讀確認；查看自己的歷史。
幹部：登入權限檢查；讀取 v9/selfCounts 所有志工；僅顯示 submitted；搜尋及 CSV；唯讀查看明細。
正式提交後不能透過本頁修改原資料；依目前所附舊版規則，志工不可覆寫 submitted 記錄。

【試辦限制／注意】
* 沒有在 Firebase 線上環境進行實測；這是可部署的候選版，須以 V0001 和 A0001 進行真實端到端驗收。
* PIN/Email 必須與 Firebase Auth 中現存憑證相符；不會繞過 auth/invalid-credential。
* 使用公用裝置須注意本機 localStorage 草稿隱私，完成送出會清掉本機草稿。
* 雲端草稿需要至少一筆完整項目才能通過原有規則；空白草稿只能先保存在本機。
* 同一倉庫多人重複清點不會自動阻止，幹部需判斷範圍與清點時間。
* 目前不做庫存自動入帳、不做獨立複點、不做送件後補正或幹部改動原始數據。
* 網路異常時可能發生伺服器成功但客戶端沒收到確認；應以原單號回讀核對，勿立即重建。
* csv 已加 UTF-8 BOM，並防止以公式特殊字元起頭的欄位直接被試算表執行；仍應在 Excel 開啟後抽查。
* 此候選版沒有整合 GitHub Pages 舊 PWA Service Worker 更新路徑；測試時可使用無痕視窗排除快取。

【五步驗收】
1. V0001 在 simple-count-volunteer.html 登入，輸入至少兩筆，包含不同效期。
2. 按「同步雲端草稿」，看到回讀成功；重新整理看本機草稿。
3. 按「正式送出給幹部」，確認下方歷史出現「已送出」。
4. A0001 在 simple-count-admin.html 登入，按更新收件匣，逐筆核對數量、效期、清點時間。
5. 匯出 CSV，確認每筆數值；志工端測試不能改動已送出的原單。

本次上傳不含 TXT。
