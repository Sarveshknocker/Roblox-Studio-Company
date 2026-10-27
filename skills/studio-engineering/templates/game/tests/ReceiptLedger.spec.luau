local ReceiptLedger = require("../src/shared/Pure/ReceiptLedger")

return function(t)
	t.it("records a purchase once; a retry is detected", function()
		local ledger = {}
		t.eq(ReceiptLedger.record(ledger, "p-1"), true)
		t.eq(ReceiptLedger.record(ledger, "p-1"), false, "retry of the same PurchaseId")
		t.eq(ReceiptLedger.has(ledger, "p-1"), true)
	end)
	t.it("drops the oldest ids beyond capacity", function()
		local ledger = {}
		for i = 1, 5 do
			ReceiptLedger.record(ledger, `p-{i}`, 3)
		end
		t.eq(#ledger, 3)
		t.eq(ReceiptLedger.has(ledger, "p-1"), false)
		t.eq(ReceiptLedger.has(ledger, "p-5"), true)
	end)
end
