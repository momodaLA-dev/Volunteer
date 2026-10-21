暖心同行｜登入畫面中斷修補版

檔案：unified.js、index.html、admin.html、service-worker.js

1. 先備份 GitHub 現有檔案。
2. 將這四個檔案上傳 Volunteer 儲存庫根目錄，覆蓋同名檔案。
3. 不要覆蓋 firebase-config.js 或修改 Realtime Database 規則。
4. 等 GitHub Pages 部署完成，使用無痕視窗測試。
5. 先用測試清點資料驗證 10-15 分鐘，不要當成已驗收的正式版。

修補：同帳號回呼不再隱藏畫面或重載 iframe；不因錯誤頁面自動登出；更新快取名稱並清理舊版快取。
注意：系統若真正登出仍會返回登入頁。雲端草稿未儲存成功前請勿關閉頁面；本修補不包含全面離線同步或資料遷移。
