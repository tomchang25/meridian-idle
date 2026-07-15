# Service Worker Cache Versioning

Service worker 會在舊 page 與新 deployment 之間形成第二個 runtime owner。沒有版本與 activation policy 時，HTML、JavaScript chunks 與 static data 可來自不同版本，造成無法重現的啟動或 save compatibility 問題。

## Hazard

- Development 註冊 service worker，將 HMR 或本地 chunks 快取為 stale response。
- Cache-first 處理 navigation HTML，但 chunks 來自另一個 deployment。
- Activate 時刪除所有 origin caches，誤刪其他 application 或 tooling 的 cache。
- 新 worker 在舊 page 仍執行時強制 takeover，使同一 session 中途切換 asset contract。

## Safe shape

1. 只在 production 註冊 service worker，並提供清除本專案舊 worker/cache 的開發 recovery path。
2. Cache names 含 application prefix 與 deployment/schema version；activation 只刪除同 prefix 的過期 caches。
3. Navigation、hashed static assets、runtime data 使用明確不同 strategy，不用一個 blanket handler。
4. Update UI 明確告知玩家需要 reload，不在進行中 transaction 靜默切換 worker。
5. Save payload migration 不依賴舊 JavaScript chunk 與新 content 混用；deployment 前保留 sequential migration path。
6. Tests/build smoke 檢查 first install、update waiting、activation、offline navigation 與 old-cache cleanup。

## Review prompts

- 每種 request 的 cache strategy 是否與資源的 versioning 方式一致？
- Activation 是否只清理本 application 的舊 cache？
- 舊 page 與新 worker 交叠時，是否可能在同一 gameplay transaction 中混用版本？
