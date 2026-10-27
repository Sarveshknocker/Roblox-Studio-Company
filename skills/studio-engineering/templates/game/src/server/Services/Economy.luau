--!strict
-- Server-authoritative economy: income, XP, unlock purchases. Numbers come from Shared/Config/Economy (generated from
-- the design team's economy.json); formulas come from Shared/Pure/Progression (the same ones the simulator uses).

local AnalyticsService = game:GetService("AnalyticsService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config.Economy) :: any
local Progression = require(Shared.Pure.Progression)
local Validate = require(Shared.Pure.Validate)
local Net = require(script.Parent.Parent.Net)
local PlayerData = require(script.Parent.PlayerData)

local Economy = {}
local multipliers: { [Player]: { [string]: number } } = {}

local unlockById: { [string]: any } = {}
local unlockIds: { string } = {}
for _, unlock in Config.unlocks do
	unlockById[unlock.id] = unlock
	table.insert(unlockIds, unlock.id)
end

local function logEconomy(player: Player, flow: Enum.AnalyticsEconomyFlowType, currency: string, amount: number, balance: number, transaction: string, sku: string?)
	-- Analytics must never break gameplay.
	pcall(function()
		AnalyticsService:LogEconomyEvent(player, flow, currency, amount, balance, transaction, sku)
	end)
end

function Economy.award(player: Player, currency: string, amount: number, transaction: string, sku: string?): boolean
	local profile = PlayerData.get(player)
	if profile == nil or amount <= 0 then
		return false
	end
	local data = profile.Data :: any
	data[currency] += amount
	logEconomy(player, Enum.AnalyticsEconomyFlowType.Source, currency, amount, data[currency], transaction, sku)
	PlayerData.refreshLeaderstats(player)
	return true
end

local function upgradeBonus(data: any): number
	local bonus = 0
	for id in data.Unlocks do
		local unlock = unlockById[id]
		if unlock and unlock.effect and unlock.effect.income then
			bonus += unlock.effect.income
		end
	end
	return bonus
end

function Economy.tryBuyUnlock(player: Player, unlockId: string)
	local profile = PlayerData.get(player)
	local unlock = unlockById[unlockId]
	if profile == nil or unlock == nil then
		return
	end
	local data = profile.Data :: any
	if data.Unlocks[unlockId] or data.Level < (unlock.level or 1) or data[unlock.currency] < unlock.price then
		return -- the client asked for something it cannot have; ignore quietly
	end
	data[unlock.currency] -= unlock.price
	data.Unlocks[unlockId] = true
	logEconomy(player, Enum.AnalyticsEconomyFlowType.Sink, unlock.currency, unlock.price, data[unlock.currency], Enum.AnalyticsEconomyTransactionType.Shop.Name, unlockId)
	PlayerData.refreshLeaderstats(player)
	Net.fire("Notify", player, "unlocked", unlockId)
end

local function loadPassMultipliers(player: Player)
	local result: { [string]: number } = {}
	for _, offer in Config.robux do
		if offer.kind == "pass" and offer.gamePassId and offer.gamePassId > 0 and offer.effect and offer.effect.multiplier then
			local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, offer.gamePassId)
			if ok and owns then
				for currency, factor in offer.effect.multiplier do
					result[currency] = (result[currency] or 1) * factor
				end
			end
		end
	end
	multipliers[player] = result
end

local function tickMinute(player: Player)
	local profile = PlayerData.get(player)
	if profile == nil then
		return
	end
	local data = profile.Data :: any
	local bonus = upgradeBonus(data)
	for _, source in Config.sources do
		if source.perMinute then
			local factor = (multipliers[player] or {})[source.currency] or 1
			local amount = Progression.incomePerMinute(source.perMinute, source.growthPerLevel or 0, data.Level, bonus, factor)
			Economy.award(player, source.currency, amount, Enum.AnalyticsEconomyTransactionType.Gameplay.Name, source.id)
		end
	end
	local levels = Config.levels
	local before = data.Level
	data.Level, data.Xp = Progression.addXp(data.Level, data.Xp, levels.xpPerMinute, levels.base, levels.exponent, levels.max)
	if data.Level > before then
		Net.fire("Notify", player, "levelUp", data.Level)
	end
end

function Economy.start()
	Net.on("BuyUnlock", { Validate.oneOf(unlockIds) }, function(player: Player, unlockId: string)
		Economy.tryBuyUnlock(player, unlockId)
	end)
	PlayerData.onLoaded(function(player: Player)
		loadPassMultipliers(player)
		for _, source in Config.sources do
			if source.perSession then
				Economy.award(player, source.currency, source.perSession, Enum.AnalyticsEconomyTransactionType.TimedReward.Name, source.id)
			end
		end
	end)
	Players.PlayerRemoving:Connect(function(player: Player)
		multipliers[player] = nil
	end)
	-- One loop for everyone (not one per player): fewer threads, predictable cost.
	task.spawn(function()
		while true do
			task.wait(60)
			for _, player in Players:GetPlayers() do
				task.spawn(tickMinute, player)
			end
		end
	end)
end

return Economy
