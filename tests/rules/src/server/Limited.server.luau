local RateLimiter = require(script.Parent.RateLimiter)
local limiter = RateLimiter.new(5, 2)
-- ok-file: rbx.remote-no-rate-limit
game:GetService("ReplicatedStorage").Remotes.Ping.OnServerEvent:Connect(function(player, n)
	if not limiter:allow(player, os.clock()) then return end
	assert(type(n) == "number")
end)
