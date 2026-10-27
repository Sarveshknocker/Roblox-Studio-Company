--!strict
-- Developer-product purchases, granted exactly once and only reported as granted after the grant is saved.
-- Pattern: record the PurchaseId in the player's data together with the reward, then wait until ProfileStore's last
-- saved copy contains that PurchaseId before returning PurchaseGranted. If anything fails, Roblox retries later
-- (NotProcessedYet) and the ledger prevents a double grant.

local AnalyticsService = game:GetService("AnalyticsService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared.Config.Economy) :: any
local ReceiptLedger = require(Shared.Pure.ReceiptLedger)
local Net = require(script.Parent.Parent.Net)
local PlayerData = require(script.Parent.PlayerData)

local SAVE_WAIT_SECONDS = 20

local Purchases = {}
local productById: { [number]: any } = {}
for _, offer in Config.robux do
	if offer.kind == "product" and offer.productId and offer.productId > 0 then
		productById[offer.productId] = offer
	end
end

local function savedContains(profile: any, purchaseId: string): boolean
	local saved = profile.LastSavedData
	return saved ~= nil and saved.ReceiptLedger ~= nil and ReceiptLedger.has(saved.ReceiptLedger, purchaseId)
end

local function processReceipt(receipt: any): Enum.ProductPurchaseDecision
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	local offer = productById[receipt.ProductId]
	if player == nil or offer == nil then
		if offer == nil then
			warn(`[Purchases] no handler for product {receipt.ProductId}: add it to economy.json with its productId`)
		end
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local profile = PlayerData.waitFor(player, 30)
	if profile == nil or not profile:IsActive() then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local purchaseId = tostring(receipt.PurchaseId)
	local data = profile.Data :: any
	if ReceiptLedger.record(data.ReceiptLedger, purchaseId) then
		for currency, amount in offer.grants do
			data[currency] += amount
			pcall(function()
				AnalyticsService:LogEconomyEvent(player, Enum.AnalyticsEconomyFlowType.Source, currency, amount, data[currency], Enum.AnalyticsEconomyTransactionType.IAP.Name, offer.id)
			end)
		end
		PlayerData.refreshLeaderstats(player)
	end
	profile:Save()
	local deadline = os.clock() + SAVE_WAIT_SECONDS
	while profile:IsActive() and os.clock() < deadline do
		if savedContains(profile, purchaseId) then
			Net.fire("Notify", player, "purchased", offer.id)
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end
		task.wait(0.5)
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

function Purchases.start()
	-- Only one script in the whole game may set ProcessReceipt.
	MarketplaceService.ProcessReceipt = processReceipt
end

return Purchases
