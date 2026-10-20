# 暖心同行 v7.2｜派發操作與既有志工入口修正

本更新包只有 6 個檔案：sync.js、sync-admin.html、sync-test.html、sync.css、index.html、admin.html。全部解壓縮後上傳 GitHub `Volunteer` 儲存庫的根目錄，覆蓋同名檔案。

**請保留你已設定好的 firebase-config.js。** 本 ZIP 不包含它，也不會覆蓋 Firebase 安全規則。

## 派發改善
- 受派人員輸入 V0001 或 V0002；對應先前已建立的 Firebase UID。新增其他志工代號時需要擴充對應與帳號名冊。
- 參考明細使用表格逐筆新增／刪除，不再需要手打 CSV 格式；品號兩碼、效期六碼 YYYYMM。
- 仍需在 Firebase Authentication 使用原有代號／PIN 登入。

## 志工端為何不同
原版 index.html 是本機資料介面（通知、今日服務、物資清點、品號、聊天、我的紀錄）；sync-test.html 是 Firebase 雲端指派測試頁。這次新增可見導覽入口，但**未將原本本機資料轉成雲端同步**；兩者仍為獨立模組。通知聊天目前也不會跨手機同步，管理員備註志工不可讀取。

## 測試步驟
1. A0001 在 sync-admin.html 登入。
2. 指派 V0001、輸入測試物資表格並建立。
3. V0001 在另一支手機 sync-test.html 登入核對、送審。
4. 幹部查看審核結果；志工只見自己的審核狀態。

注意：僅供假資料測試；雲端版本尚未整合成正式庫存與完整志工端，不應直接放真實個資或正式庫存。
