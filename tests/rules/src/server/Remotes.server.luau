local ReplicatedStorage = game:GetService("ReplicatedStorage")
local buy = ReplicatedStorage.Remotes.Buy
local hit = ReplicatedStorage.Remotes.Hit
-- ruleid: rbx.remote-trusts-client-value, rbx.remote-unvalidated
buy.OnServerEvent:Connect(function(player, itemId, price)
	player.leaderstats.Coins.Value -= price
end)
-- ok: rbx.remote-trusts-client-value, rbx.remote-unvalidated
hit.OnServerEvent:Connect(function(player, targetId)
	if typeof(targetId) ~= "number" then
		return
	end
	print(targetId)
end)
-- ruleid: rbx.invoke-client
local answer = ReplicatedStorage.Remotes.Ask:InvokeClient(somePlayer)
