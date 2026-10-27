-- ok-file: rbx.connection-leak
local conn = game:GetService("RunService").Heartbeat:Connect(function(dt)
	spin(dt)
end)
script.Destroying:Connect(function() conn:Disconnect() end)
