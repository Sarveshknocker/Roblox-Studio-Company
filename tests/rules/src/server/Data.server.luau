local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("Players")
-- ruleid: rbx.datastore-no-pcall
local data = store:GetAsync(key)
-- ok: rbx.datastore-no-pcall
local ok, saved = pcall(store.GetAsync, store, key)
-- ok: rbx.datastore-no-pcall
local ok2, value = pcall(function() return store:GetAsync(key) end)
-- ruleid: rbx.setasync-player-data
pcall(function() store:SetAsync(tostring(player.UserId), data) end)
-- ok: rbx.setasync-player-data
pcall(function() store:SetAsync("server-config", data) end)
-- ruleid: rbx.localplayer-on-server
local me = game:GetService("Players").LocalPlayer
-- ruleid: rbx.renderstepped-server
game:GetService("RunService").RenderStepped:Connect(function() end)
