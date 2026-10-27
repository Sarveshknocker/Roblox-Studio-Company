-- ruleid-file: rbx.connection-leak
game:GetService("RunService").Heartbeat:Connect(function(dt)
	spin(dt)
end)
