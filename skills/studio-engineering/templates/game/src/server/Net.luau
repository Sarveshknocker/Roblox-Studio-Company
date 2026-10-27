--!strict
-- The only way server code listens to clients. Every remote gets: a per-player rate limit, argument validation (exact
-- count and types), and a pcall so one bad request cannot break the handler for everyone.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Validate = require(Shared.Pure.Validate)
local RateLimiter = require(Shared.Pure.RateLimiter)
local Remotes = require(Shared.Remotes)

type Options = { burst: number?, perSecond: number? }

local Net = {}
local folder: Folder

function Net.init()
	folder = Instance.new("Folder")
	folder.Name = "Remotes"
	for name, className in Remotes.definitions do
		local remote = Instance.new(className)
		remote.Name = name
		remote.Parent = folder
	end
	folder.Parent = ReplicatedStorage
end

local function remoteEvent(name: string): RemoteEvent
	local remote = folder:FindFirstChild(name)
	assert(remote ~= nil and remote:IsA("RemoteEvent"), `unknown RemoteEvent "{name}": declare it in Shared/Remotes`)
	return remote :: RemoteEvent
end

-- Registers a validated handler. `checks` lists one Validate check per argument the client must send.
function Net.on(name: string, checks: { Validate.Check }, handler: (Player, ...any) -> (), options: Options?)
	local remote = remoteEvent(name)
	local opts: Options = options or {}
	local limiter = RateLimiter.new(opts.burst or 5, opts.perSecond or 2)
	Players.PlayerRemoving:Connect(function(player: Player)
		limiter:forget(player)
	end)
	remote.OnServerEvent:Connect(function(player: Player, ...: any)
		if not limiter:allow(player, os.clock()) then
			return
		end
		local ok, err = Validate.args(checks, ...)
		if not ok then
			warn(`[Net] {name} rejected from {player.UserId}: {err}`)
			return
		end
		local success, problem = pcall(handler, player, ...)
		if not success then
			warn(`[Net] {name} handler failed: {problem}`)
		end
	end)
end

function Net.fire(name: string, player: Player, ...: any)
	remoteEvent(name):FireClient(player, ...)
end

return Net
