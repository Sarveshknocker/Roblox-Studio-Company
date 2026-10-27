local MarketplaceService = game:GetService("MarketplaceService")
local function roll()
	-- ruleid-file: rbx.paid-random-policy
	return math.random(1, 100)
end
MarketplaceService.ProcessReceipt = function(receipt)
	return roll()
end
