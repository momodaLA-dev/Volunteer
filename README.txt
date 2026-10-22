暖心同行｜複點 V2 派發修正（2026-10-22）

修正範圍：
1. 清點模組志工選單會顯示已確認 UID 的 V0001 小安、V0002 小恩；其他志工仍從 Firebase /v9/directory 讀取，新增名單請在「志工帳號名冊」填寫正確 Firebase UID。
2. 管理員派發 V2/V3 時：送出後必須回讀 rounds、assigned、statuses，確認三處資料存在才顯示成功。
3. 派發進行時停用送出按鈕，降低連續點擊重複產生任務的風險。
4. 原本 index.html、admin.html、firebase-config.js、Firebase 資料庫規則不修改。

上傳：把 ZIP 內四個網站檔案上傳至 GitHub 專案根目錄，覆蓋同名檔案並 Commit。切勿上傳 README 以外的私人備份。

測試：幹部 A0001 -> 清點紀錄／複點 -> 已有 V1 送審的單據 -> 查看／複點 -> 選小恩 V0002 -> 全單複點 -> 建立並派發 V2。成功後用 V0002 登入 inventory-volunteer.html 確認 V2 任務。

注意：原本首頁的「示範志工名冊」是本機資料，並非 Firebase 身分名冊；此修正對已知兩個帳號使用已驗證的 Firebase UID 作為過渡名冊，並不會同步本機名冊。未實機驗證正式環境，派發需依實際結果確認。
