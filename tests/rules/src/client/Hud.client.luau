local HttpService = game:GetService("HttpService")
-- ruleid: rbx.client-http
local r = HttpService:GetAsync("https://example.com/api")
-- ok: rbx.localplayer-on-server
local me = game:GetService("Players").LocalPlayer
-- ok: rbx.renderstepped-server
game:GetService("RunService").RenderStepped:Connect(function() end)
