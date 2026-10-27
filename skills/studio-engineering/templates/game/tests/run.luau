--!strict
-- Unit tests for pure game logic, run outside Roblox with Lune:   lune run tests/run.luau
-- Add a spec: create tests/<Name>.spec.luau returning function(t) and list it below.

local process = require("@lune/process")

type T = {
	it: (name: string, fn: () -> ()) -> (),
	eq: (actual: any, expected: any, message: string?) -> (),
	near: (actual: number, expected: number, epsilon: number?) -> (),
	truthy: (value: any, message: string?) -> (),
}

local passed, failed = 0, 0
local current = ""

local t: T = {
	it = function(name, fn)
		local ok, err = pcall(fn)
		if ok then
			passed += 1
			print(`  ✔ {current}: {name}`)
		else
			failed += 1
			print(`  ✖ {current}: {name}\n      {err}`)
		end
	end,
	eq = function(actual, expected, message)
		if actual ~= expected then
			error(`{message or "values differ"}: expected {tostring(expected)}, got {tostring(actual)}`, 2)
		end
	end,
	near = function(actual, expected, epsilon)
		if math.abs(actual - expected) > (epsilon or 1e-9) then
			error(`expected ~{expected}, got {actual}`, 2)
		end
	end,
	truthy = function(value, message)
		if not value then
			error(message or "expected a truthy value", 2)
		end
	end,
}

local specs = {
	Validate = require("./Validate.spec"),
	RateLimiter = require("./RateLimiter.spec"),
	Progression = require("./Progression.spec"),
	ReceiptLedger = require("./ReceiptLedger.spec"),
}

for name, spec in specs do
	current = name
	spec(t)
end

print(`\n{passed} passed, {failed} failed`)
process.exit(if failed > 0 then 1 else 0)
