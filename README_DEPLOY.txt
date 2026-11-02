VolunteerCare 母單／子單獨立試辦版 MC1  (2026-11-02)

設計原則：
1 幹部建立母單、開放／關閉清點、核准或排除子單。
2 志工只選現有開放母單，草稿存於自己手機的 IndexedDB（不是雲端）。
3 送出才使用 Firebase v10/childOrders；每張子單 clientId 使用 UUID，重試同一筆不改單號。
4 審核寫入 v10/approvals，母單核定總數由核准子單即時算出，防重複核准。
5 既有 v9/ 與 index.html、admin.html、simple-count.* 均不修改。

部署到 GitHub repo 根目錄的四個新檔：
- master-child-volunteer.html
- master-child-admin.html
- master-child.js
- master-child.css
不要上傳 README 或 V10_RULES_FRAGMENT.json 當成程式。firebase-config.js 使用既有檔案，不要更換。

!!! 必須另外新增 Firebase Realtime Database Security Rules !!!
V10_RULES_FRAGMENT.json 只是一個 v10 規則片段，不是完整規則！請先備份 Firebase Console 正式規則，將其中的 "v10": {...} 物件合併到現有 rules 根節點內，勿覆蓋既有 v9、roles 等規則。
在 Rules Playground/Emulator 驗證授權與拒絕案例，再部署到正式專案。尚未套用規則時，網頁可開啟但母單建立、子單送出可能 PERMISSION_DENIED。

頁面：
https://momodala-dev.github.io/Volunteer/master-child-volunteer.html
https://momodala-dev.github.io/Volunteer/master-child-admin.html

測試步驟：
1 A0001 登入幹部頁建立 TEST 母單，確認母單出現在志工下拉清單。
2 V0001 登入志工頁選母單，輸入 008倉 / 08 / 111 / 202701，儲存本機，關閉重開，確認資料仍在。
3 V0002 另用手機新增另一張本機子單，互不影響。
4 V0001 正式送出；在幹部頁確認子單只出現一次、仍待審。
5 A0001 核准該子單，確認母單品號 08 核定數字為 111；重複點核准不會重複加總。
6 A0001 核准第二張子單，核對彙總與 CSV；測試排除另一張，數量不得增加。
7 關閉母單後，志工不能再送新的子單（必須由資料庫規則拒絕，即使保留舊頁面）。
8 測試另一個志工 UID 不能直接讀取／寫入別人的子單，非幹部不能建立母單或核准。

重要限制：
- 尚未部署 Firebase Rules，也尚未在實際 Firebase 專案完成線上端對端驗收；這是試辦候選版，不是已正式上線。
- 目前既有登入代號只設定 A0001/V0001/V0002。虛擬 Email 帳號復原問題尚未解決。
- 若手機清除網站資料、換手機或 LINE 內建瀏覽器清掉儲存，未送出的本機草稿可能永久遺失。
- 建立子單時已選母單，不允許事後換母單；每張子單的 4 欄逐筆原樣保留。
- 母單合計僅由被核准且不重複計算的子單組成；幹部仍需人工判斷同批物資是否重複清點。
- 母單可關閉，但本試辦版不提供修改、重開、撤銷審核；操作應以測試資料為主。
- 若送出後雲端回讀失敗，請保留手機草稿並重新按同一張的送出，不要刪除或另建單。
- 若 IndexedDB 在裝置／瀏覽器被禁用，無法保證本機保存，請改用允許網站儲存的正常瀏覽器。
- 本試辦版只採一個獨立資料 namespace v10，不遷移 v9 舊資料。

回復方式：移除四個新檔或停止使用試辦 URL，v9 舊系統保持原樣；不可刪除 v10 資料或未備份的規則。
