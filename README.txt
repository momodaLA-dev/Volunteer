VolunteerCare V2.9 IntegrationTest (2026-10-22)

這次才是真正可操作的雲端測試工具，不是只有核取方塊的檢查表。
請只將 inventory-integration-test.html 上傳到 GitHub Volunteer 專案根目錄。
網址：https://momodala-dev.github.io/Volunteer/inventory-integration-test.html

既有 firebase-config.js 必須存在於同一目錄；需可載入 Google Firebase CDN。
每個帳號在獨立瀏覽器環境登入，或直接使用有效的既有 Firebase 登入狀態。
帳號：A0001、V0001、V0002；請使用本人原 PIN（未儲存 PIN）。

路線 A：幹部 A0001「建立並指派 V1」→志工 V0001「讀取任務、填資料、存草稿、讀回、提交」→幹部派 V2 給 V0002→小恩提交→幹部比對與 CSV→可繼續派 V3。
路線 B：志工 V0001 填資料、按「自行送出 V1」→幹部「接收志工自行 V1」→派 V2 給 V0002→提交、比對、CSV。

所有測試單使用 TEST29- 前綴；不覆蓋正式 INV、SELF 或以前的 DIAG 單。測試資料仍會寫入同一 Firebase 正式專案的 v9 節點，請只用假資料。沒有自動清理（防止誤刪）。
提示：實際 Firebase 網路／帳號／規則驗收尚未執行，產生的測試記錄會逐步顯示詳細權限錯誤。
如既有登入系統遭隱藏，可在本測試頁直接用帳號與原 PIN 登入；不會繞過 Firebase Auth。
目前測試工具尚不包含安全的離線佇列、完整跨裝置版本合併或正式交易性的跨節點派發；這些要在驗收後再進行正式程式整合。
