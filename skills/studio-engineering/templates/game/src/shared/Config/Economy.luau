--!strict
-- GENERATED from studio/02-design/economy.json by `studio.mjs config`. Edit the JSON (and re-run the simulator), not this file.
return {
	sessionMinutes = 25,
	currencies = { "Coins", "Gems" },
	sources = {
		{ id = "collect", currency = "Coins", perMinute = 120, growthPerLevel = 0.08 },
		{ id = "daily", currency = "Gems", perSession = 5 },
	},
	levels = { xpPerMinute = 60, base = 100, exponent = 1.45, max = 60 },
	unlocks = {
		{ id = "backpack2", currency = "Coins", price = 1500, level = 2, effect = { income = 0.25 } },
		{ id = "zone2", currency = "Coins", price = 12000, level = 6, effect = { income = 0.6 } },
	},
	robux = {
		-- productId / gamePassId: fill in the real ids from the Creator Dashboard (0 = not created yet).
		{ id = "gems_small", kind = "product", productId = 0, robux = 49, grants = { Gems = 100 } },
		{ id = "coins2x", kind = "pass", gamePassId = 0, robux = 199, effect = { multiplier = { Coins = 2 } } },
	},
}
