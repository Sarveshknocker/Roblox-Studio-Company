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

local Flow = Enum.AnalyticsEconomyFlowType
local Transaction = Enum.AnalyticsEconomyTransactionType

local Economy = {}
local ownedPasses: { [Player]: { [number]: boolean } } = {}

local function isMultiplierPass(offer: any): boolean
	return offer.kind == "pass" and (offer.gamePassId or 0) > 0 and (offer.effect or {}).multiplier ~= nil
end
local passById: { [number]: any } = {}
for _, offer in Config.robux do
	if isMultiplierPass(offer) then
		passById[offer.gamePassId] = offer
	end
end

local unlockById: { [string]: any } = {}
local unlockIds: { string } = {}
for _, unlock in Config.unlocks do
	unlockById[unlock.id] = unlock
	table.insert(unlockIds, unlock.id)
end

local function logEconomy(
	player: Player,
	flow: Enum.AnalyticsEconomyFlowType,
	currency: string,
	amount: number,
	balance: number,
	transaction: string,
	sku: string?
)
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
	logEconomy(player, Flow.Source, currency, amount, data[currency], transaction, sku)
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
	logEconomy(player, Flow.Sink, unlock.currency, unlock.price, data[unlock.currency], Transaction.Shop.Name, unlockId)
	PlayerData.refreshLeaderstats(player)
	Net.fire("Notify", player, "unlocked", unlockId)
end

-- Passes stack by multiplying. Computed from the owned set, so a pass bought mid-session counts straight away.
local function multiplierFor(player: Player, currency: string): number
	local factor = 1
	for gamePassId in ownedPasses[player] or {} do
		factor *= passById[gamePassId].effect.multiplier[currency] or 1
	end
	return factor
end

local function ownedSet(player: Player): { [number]: boolean }?
	if player.Parent == nil then
		return nil -- left already; do not create state that PlayerRemoving will never clear
	end
	local owned = ownedPasses[player] or {}
	ownedPasses[player] = owned
	return owned
end

local function loadPasses(player: Player)
	local owned = ownedSet(player)
	if owned == nil then
		return
	end
	for gamePassId in passById do
		local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, gamePassId)
		if ok and owns then
			owned[gamePassId] = true
		end
	end
end

-- Fired on the server by Roblox, not by the client, so `purchased` can be trusted. UserOwnsGamePassAsync is cached
-- and can still return false right after buying, so the pass is applied from this event instead of a re-check.
local function onPassPurchased(player: Player, gamePassId: number, purchased: boolean)
	local offer = passById[gamePassId]
	local owned = if purchased and offer then ownedSet(player) else nil
	if owned then
		owned[gamePassId] = true
		Net.fire("Notify", player, "purchased", offer.id)
	end
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
			local factor = multiplierFor(player, source.currency)
			local growth = source.growthPerLevel or 0
			local amount = Progression.incomePerMinute(source.perMinute, growth, data.Level, bonus, factor)
			Economy.award(player, source.currency, amount, Transaction.Gameplay.Name, source.id)
		end
	end
	local lv = Config.levels
	local before = data.Level
	data.Level, data.Xp = Progression.addXp(data.Level, data.Xp, lv.xpPerMinute, lv.base, lv.exponent, lv.max)
	if data.Level > before then
		Net.fire("Notify", player, "levelUp", data.Level)
	end
end

function Economy.start()
	Net.on("BuyUnlock", { Validate.oneOf(unlockIds) }, function(player: Player, unlockId: string)
		Economy.tryBuyUnlock(player, unlockId)
	end)
	PlayerData.onLoaded(function(player: Player)
		loadPasses(player)
		for _, source in Config.sources do
			if source.perSession then
				Economy.award(player, source.currency, source.perSession, Transaction.TimedReward.Name, source.id)
			end
		end
	end)
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(onPassPurchased)
	Players.PlayerRemoving:Connect(function(player: Player)
		ownedPasses[player] = nil
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
