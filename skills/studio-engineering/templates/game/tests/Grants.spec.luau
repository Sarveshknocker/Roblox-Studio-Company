local Grants = require("../src/shared/Pure/Grants")

return function(t)
	t.it("applies every grant when all currencies exist", function()
		local data = { Coins = 10, Gems = 0 }
		t.eq(Grants.apply(data, { Coins = 5, Gems = 100 }), nil)
		t.eq(data.Coins, 15)
		t.eq(data.Gems, 100)
	end)
	t.it("changes nothing when one currency is unknown", function()
		local data = { Coins = 10, Gems = 0 }
		t.truthy(Grants.apply(data, { Gems = 100, Gemz = 5 }), "a typo must be reported")
		t.eq(data.Gems, 0, "no partial grant")
		t.eq(data.Coins, 10)
	end)
	t.it("rejects zero, negative, NaN and infinite amounts", function()
		local data = { Coins = 10 }
		for _, bad in { 0, -5, 0 / 0, math.huge } do
			t.truthy(Grants.check(data, { Coins = bad }), `amount {bad}`)
		end
		t.truthy(Grants.check(data, { Coins = "5" }), "string amount")
		t.eq(data.Coins, 10)
	end)
	t.it("rejects non-currency fields such as Unlocks", function()
		t.truthy(Grants.check({ Unlocks = {} }, { Unlocks = 1 }))
	end)
end
