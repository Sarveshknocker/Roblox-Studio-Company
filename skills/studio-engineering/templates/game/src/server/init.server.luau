--!strict
-- Server bootstrap. Order matters: remotes first, then data, then systems that use data.

local Net = require(script.Net)
local Services = script.Services

Net.init()

local PlayerData = require(Services.PlayerData)
local Economy = require(Services.Economy)
local Purchases = require(Services.Purchases)

PlayerData.start()
Economy.start()
Purchases.start()
