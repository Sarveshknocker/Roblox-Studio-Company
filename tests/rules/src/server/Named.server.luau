local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Remotes = ReplicatedStorage.Remotes
local Shop = require(script.Parent.Shop)

local function onBuy(player, itemId, price)
	player.leaderstats.Coins.Value -= price
end

local function onHit(player, targetId)
	if typeof(targetId) ~= "number" then
		return
	end
	print(targetId)
end

local Handlers = {}
function Handlers.onEquip(player, slot)
	player:SetAttribute("Slot", slot)
end

-- ruleid: rbx.remote-trusts-client-value, rbx.remote-unvalidated
Remotes.Buy.OnServerEvent:Connect(onBuy)
-- ok: rbx.remote-trusts-client-value, rbx.remote-unvalidated
Remotes.Hit.OnServerEvent:Connect(onHit)
-- ruleid: rbx.remote-unvalidated
Remotes.Equip.OnServerEvent:Connect(Handlers.onEquip)
-- ruleid: rbx.remote-unvalidated
Remotes.Sell.OnServerEvent:Connect(Shop.onSell)
