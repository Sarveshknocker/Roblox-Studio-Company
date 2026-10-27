--!strict
-- Remembers recent developer-product PurchaseIds inside the player's saved data, so a purchase is granted exactly once even
-- if Roblox retries ProcessReceipt (rejoin, server crash). Pure Luau, tested with Lune.

export type Ledger = { string }

local ReceiptLedger = {}

ReceiptLedger.CAPACITY = 100

function ReceiptLedger.has(ledger: Ledger, purchaseId: string): boolean
	return table.find(ledger, purchaseId) ~= nil
end

-- Records the id (oldest ids are dropped beyond CAPACITY). Returns false if it was already recorded.
function ReceiptLedger.record(ledger: Ledger, purchaseId: string, capacity: number?): boolean
	if ReceiptLedger.has(ledger, purchaseId) then
		return false
	end
	table.insert(ledger, purchaseId)
	local cap = capacity or ReceiptLedger.CAPACITY
	while #ledger > cap do
		table.remove(ledger, 1)
	end
	return true
end

return ReceiptLedger
