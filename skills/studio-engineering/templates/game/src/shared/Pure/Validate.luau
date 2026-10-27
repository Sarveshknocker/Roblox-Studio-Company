--!strict
-- Argument validation for everything that arrives from a client. Pure Luau (no Roblox APIs), tested with Lune.
-- Usage:
--   local ok, err = Validate.args({ Validate.oneOf({ "Sword", "Bow" }), Validate.integer(1, 10) }, itemId, amount)

export type Check = (value: any) -> (boolean, string?)

local Validate = {}

function Validate.integer(min: number, max: number): Check
	return function(value: any)
		if type(value) ~= "number" or value ~= value or value % 1 ~= 0 then
			return false, "expected an integer"
		end
		if value < min or value > max then
			return false, `expected {min}..{max}`
		end
		return true, nil
	end
end

function Validate.number(min: number, max: number): Check
	return function(value: any)
		-- value ~= value rejects NaN; math.huge is rejected by the range check.
		if type(value) ~= "number" or value ~= value then
			return false, "expected a number"
		end
		if value < min or value > max then
			return false, `expected {min}..{max}`
		end
		return true, nil
	end
end

function Validate.string(maxLength: number): Check
	return function(value: any)
		if type(value) ~= "string" then
			return false, "expected a string"
		end
		if #value == 0 or #value > maxLength then
			return false, `expected 1..{maxLength} characters`
		end
		return true, nil
	end
end

function Validate.oneOf(allowed: { string }): Check
	local set: { [string]: boolean } = {}
	for _, v in allowed do
		set[v] = true
	end
	return function(value: any)
		if type(value) ~= "string" or not set[value] then
			return false, "value not allowed"
		end
		return true, nil
	end
end

function Validate.boolean(): Check
	return function(value: any)
		if type(value) ~= "boolean" then
			return false, "expected a boolean"
		end
		return true, nil
	end
end

-- Checks every argument; extra arguments are rejected so clients cannot smuggle payloads.
function Validate.args(checks: { Check }, ...: any): (boolean, string?)
	local count = select("#", ...)
	if count ~= #checks then
		return false, `expected {#checks} argument(s), got {count}`
	end
	for i, check in checks do
		local ok, err = check((select(i, ...)))
		if not ok then
			return false, `argument {i}: {err}`
		end
	end
	return true, nil
end

return Validate
