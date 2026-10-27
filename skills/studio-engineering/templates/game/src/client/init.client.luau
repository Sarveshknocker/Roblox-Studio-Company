--!strict
-- Client bootstrap: a minimal, mobile-safe HUD. The client only displays state and asks the server to act; it never
-- decides balances or prices.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"):WaitForChild("Economy")) :: any
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUnlock = remotes:WaitForChild("BuyUnlock") :: RemoteEvent
local notify = remotes:WaitForChild("Notify") :: RemoteEvent

local gui = Instance.new("ScreenGui")
gui.Name = "HUD"
gui.ResetOnSpawn = false
gui.ScreenInsets = Enum.ScreenInsets.DeviceSafeInsets -- keeps UI clear of notches and system bars

local coinsLabel = Instance.new("TextLabel")
coinsLabel.Name = "Coins"
coinsLabel.AnchorPoint = Vector2.new(0.5, 0)
coinsLabel.Position = UDim2.new(0.5, 0, 0, 8)
coinsLabel.Size = UDim2.fromOffset(220, 44)
coinsLabel.BackgroundTransparency = 0.3
coinsLabel.TextScaled = true
coinsLabel.Text = "Coins: 0"
coinsLabel.Parent = gui

local buyButton = Instance.new("TextButton")
buyButton.Name = "BuyNext"
buyButton.AnchorPoint = Vector2.new(1, 1)
buyButton.Position = UDim2.new(1, -16, 1, -16)
buyButton.Size = UDim2.fromOffset(180, 56) -- larger than the 44 px minimum touch target
buyButton.TextScaled = true
buyButton.Text = "Buy upgrade"
buyButton.Parent = gui

local toast = Instance.new("TextLabel")
toast.Name = "Toast"
toast.AnchorPoint = Vector2.new(0.5, 0)
toast.Position = UDim2.new(0.5, 0, 0, 60)
toast.Size = UDim2.fromOffset(320, 36)
toast.BackgroundTransparency = 1
toast.TextScaled = true
toast.Text = ""
toast.Parent = gui

gui.Parent = player:WaitForChild("PlayerGui")

local owned: { [string]: boolean } = {}

local function nextUnlock(): string?
	for _, unlock in Config.unlocks do
		if not owned[unlock.id] then
			return unlock.id
		end
	end
	return nil
end

buyButton.Activated:Connect(function()
	local id = nextUnlock()
	if id then
		buyUnlock:FireServer(id) -- the server checks level, price and balance
	end
end)

notify.OnClientEvent:Connect(function(kind: string, value: any)
	if kind == "unlocked" then
		owned[value] = true
		toast.Text = `Unlocked {value}!`
	elseif kind == "levelUp" then
		toast.Text = `Level {value}!`
	elseif kind == "purchased" then
		toast.Text = "Thanks for your purchase!"
	end
	task.delay(3, function()
		toast.Text = ""
	end)
end)

local function bindCoins()
	local stats = player:WaitForChild("leaderstats")
	local coins = stats:WaitForChild("Coins") :: IntValue
	local function update()
		coinsLabel.Text = `Coins: {coins.Value}`
	end
	coins.Changed:Connect(update)
	update()
end
task.spawn(bindCoins)
