--!strict
-- Applies a product's currency grants to player data all-or-nothing: if any currency is unknown or any amount is not
-- a positive number, nothing changes and the reason is returned. Purchases relies on this so a bad economy.json entry
-- can never mark a purchase as handled without giving the reward.

local Grants = {}

function Grants.check(data: { [string]: any }, grants: { [string]: any }): string?
	for currency, amount in grants do
		if typeof(data[currency]) ~= "number" then
			return `unknown currency "{currency}"`
		end
		if typeof(amount) ~= "number" or amount ~= amount or amount <= 0 or amount == math.huge then
			return `amount for "{currency}" must be a positive number`
		end
	end
	return nil
end

function Grants.apply(data: { [string]: any }, grants: { [string]: any }): string?
	local problem = Grants.check(data, grants)
	if problem then
		return problem
	end
	for currency, amount in grants do
		data[currency] += amount
	end
	return nil
end

return Grants
