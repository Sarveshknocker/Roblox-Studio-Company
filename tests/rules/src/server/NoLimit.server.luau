local remote = game:GetService("ReplicatedStorage").Remotes.Ping
-- ruleid-file: rbx.remote-no-rate-limit
remote.OnServerEvent:Connect(function(player, n)
	assert(type(n) == "number")
end)
