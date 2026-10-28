暖心同行｜第一階段穩定候選版 RC1 (2026-10-28)

1. 請先備份 GitHub 目前的四個同名檔案。
2. 將 simple-count-volunteer.html、simple-count-admin.html、simple-count.js、simple-count.css 上傳至 Volunteer 儲存庫根目錄，覆蓋同名檔案。
3. 不要上傳 patch.py、README_DEPLOY.txt 或覆蓋 firebase-config.js、index.html、admin.html、inventory-cloud.js、Firebase rules。
4. 志工測試入口：https://momodaLA-dev.github.io/Volunteer/simple-count-volunteer.html
5. 幹部測試入口：https://momodaLA-dev.github.io/Volunteer/simple-count-admin.html
6. 請用 V0001 建立包含同品號兩筆的測試清點單，儲存雲端草稿、重新整理、送出；再用 A0001 收件及 CSV 匯出。正式送出後，原始逐筆資料不得更動。
7. 測試網路中斷、反覆點送出、跨裝置編輯、未授權帳號登入等情況。上述線上驗收尚未代為完成。

本版改進：送出唯一單號保留、回讀核對、失敗時保留本機草稿、多裝置草稿版本檢查、歷史載入基準時間、登出清除頁面狀態、CSV 基本公式注入防護。

重要限制：
- 並非完全離線系統；localStorage 可能被清除，且在公用裝置有隱私風險。
- 雲端安全仍取決於「已部署的 Firebase Database Rules」，本包不包含規則更動；務必實際檢驗志工只能寫自己的資料，送出後不能覆寫，幹部能讀取。
- 多裝置同時寫入的競爭情況，單靠前端版本比較無法提供原子保證；需在正式大規模啟用前再加伺服器端防衝突規則/交易。
- 既有 V0002 登入密碼問題不在這個檔案更新範圍。
- 本版不提供新增志工帳號、幹部指派或 V1/V2/V3。
