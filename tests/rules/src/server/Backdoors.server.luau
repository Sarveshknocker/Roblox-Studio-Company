-- Rule corpus: free-model malware patterns. Lines below "ruleid:" must be reported; "ok:" lines must not.
-- ruleid: rbx.backdoor-require
local admin = require(4103529591)
-- ok: rbx.backdoor-require
local Shared = require(game:GetService("ReplicatedStorage").Shared.Config)
-- ruleid: rbx.loadstring
loadstring(payload)()
-- ruleid: rbx.getfenv
local env = getfenv(2)
-- ruleid: rbx.obfuscated-string
local s = "\108\111\97\100\115\116\114\105\110\103\40\103\97\109\101\58\72\116\116\112\71\101\116\40"
-- ok: rbx.obfuscated-string
local newline = "line one\nline two"
-- ruleid: rbx.webhook-secret
local HOOK = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCD"
-- A comment mentioning loadstring( or require(123456789) is not code.
-- ok: rbx.loadstring
local text = "documentation"
