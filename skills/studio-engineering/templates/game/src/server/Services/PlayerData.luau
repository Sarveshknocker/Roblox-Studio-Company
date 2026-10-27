--!strict
-- Player data with session locking (ProfileStore): one server writes a player's data at a time, saves are automatic,
-- and data is released on leave and on shutdown. Get ProfileStore with `studio.mjs deps` (pinned, checksum-verified).

local Players = game:GetService("Players")

local vendor = script.Parent.Parent:FindFirstChild("Vendor")
local module = vendor and vendor:FindFirstChild("ProfileStore")
assert(module, "ProfileStore missing: run `node <kit>/bin/studio.mjs deps game` and sync with Rojo")
local ProfileStore = require(module :: ModuleScript) :: any

-- Bump the store name (PlayerData_v2…) only with a migration plan; renaming loses everyone's progress.
local TEMPLATE = {
	Coins = 0,
	Gems = 0,
	Level = 1,
	Xp = 0,
	Unlocks = {} :: { [string]: boolean },
	ReceiptLedger = {} :: { string },
	TutorialDone = false,
}

export type Data = typeof(TEMPLATE)

local store = ProfileStore.New("PlayerData_v1", TEMPLATE)
local profiles: { [Player]: any } = {}
local loadedCallbacks: { (Player, any) -> () } = {}

local PlayerData = {}
PlayerData.TEMPLATE = table.freeze(table.clone(TEMPLATE)) -- read-only copy, for config checks

function PlayerData.get(player: Player): any?
	return profiles[player]
end

-- Waits for the profile to load (or the player to leave / timeout).
function PlayerData.waitFor(player: Player, timeout: number): any?
	local deadline = os.clock() + timeout
	while profiles[player] == nil and player.Parent == Players and os.clock() < deadline do
		task.wait(0.1)
	end
	return profiles[player]
end

function PlayerData.onLoaded(callback: (Player, any) -> ())
	table.insert(loadedCallbacks, callback)
end

local function makeLeaderstats(player: Player, data: Data)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = data.Coins
	coins.Parent = stats
	stats.Parent = player
end

local function onPlayerAdded(player: Player)
	local profile = store:StartSessionAsync(`{player.UserId}`, {
		Cancel = function()
			return player.Parent ~= Players
		end,
	})
	if profile == nil then
		player:Kick("Your data could not be loaded. Please rejoin.")
		return
	end
	profile:AddUserId(player.UserId) -- lets the data be found and erased for GDPR / right-to-erasure requests
	profile:Reconcile() -- adds fields that were added to TEMPLATE after this player's last save
	profile.OnSessionEnd:Connect(function()
		profiles[player] = nil
		player:Kick("Your data was opened on another server. Please rejoin.")
	end)
	if player.Parent ~= Players then
		profile:EndSession()
		return
	end
	profiles[player] = profile
	makeLeaderstats(player, profile.Data)
	for _, callback in loadedCallbacks do
		task.spawn(callback, player, profile)
	end
end

function PlayerData.start()
	for _, player in Players:GetPlayers() do
		task.spawn(onPlayerAdded, player)
	end
	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(function(player: Player)
		local profile = profiles[player]
		if profile ~= nil then
			profile:EndSession()
		end
	end)
end

-- Keeps the on-screen Coins in sync after the server changes the balance.
function PlayerData.refreshLeaderstats(player: Player)
	local profile = profiles[player]
	local stats = player:FindFirstChild("leaderstats")
	local coins = stats and stats:FindFirstChild("Coins")
	if profile and coins and coins:IsA("IntValue") then
		coins.Value = math.floor(profile.Data.Coins)
	end
end

return PlayerData
