local Validate = require("../src/shared/Pure/Validate")

return function(t)
	local check = { Validate.oneOf({ "backpack2", "zone2" }), Validate.integer(1, 10) }

	t.it("accepts exactly the expected arguments", function()
		t.eq((Validate.args(check, "zone2", 3)), true)
	end)
	t.it("rejects unknown ids, wrong types, NaN and out-of-range numbers", function()
		t.eq((Validate.args(check, "hacked", 3)), false)
		t.eq((Validate.args(check, "zone2", "3")), false)
		t.eq((Validate.args(check, "zone2", 0 / 0)), false)
		t.eq((Validate.args(check, "zone2", 11)), false)
		t.eq((Validate.args(check, "zone2", 2.5)), false)
	end)
	t.it("rejects missing and extra arguments", function()
		t.eq((Validate.args(check, "zone2")), false)
		t.eq((Validate.args(check, "zone2", 3, { payload = true })), false)
	end)
	t.it("bounds string length and rejects infinity", function()
		t.eq((Validate.args({ Validate.string(3) }, "abcd")), false)
		t.eq((Validate.args({ Validate.number(0, 100) }, math.huge)), false)
	end)
end
