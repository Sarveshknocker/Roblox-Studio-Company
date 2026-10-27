local MarketplaceService = game:GetService("MarketplaceService")
local PolicyService = game:GetService("PolicyService")
-- ok-file: rbx.paid-random-policy
local function allowed(player)
	return not PolicyService:GetPolicyInfoForPlayerAsync(player).ArePaidRandomItemsRestricted
end
local function roll()
	return math.random(1, 100)
end
MarketplaceService.ProcessReceipt = function(receipt)
	return roll()
end
