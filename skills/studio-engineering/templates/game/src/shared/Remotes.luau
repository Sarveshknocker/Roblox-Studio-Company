--!strict
-- Every client↔server message is declared here. The server creates them at startup; the client waits for them.
-- Adding a remote: declare it here, then register its validated handler with Net.on (server) — never OnServerEvent directly.

local Remotes = {}

Remotes.definitions = {
	BuyUnlock = "RemoteEvent", -- client asks to buy an unlock by id; the server checks level, price and balance
	Notify = "RemoteEvent", -- server tells one client something happened (purchase, level up)
}

return Remotes
