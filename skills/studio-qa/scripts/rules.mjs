// Roblox/Luau rules for lint.mjs. Each rule: id, severity, title, why, fix, re (global RegExp), and optional
// scope ('server' | 'client' | 'any'), requires / requiresNot (file-level RegExps), fileLevel, sameLineNot, and
// blockNot (skip the match when the block it opens — its line plus the deeper-indented lines after it — matches).

export const RULES = [
  // ---------- Backdoors and unsafe code (free-model malware patterns) ----------
  { id: 'rbx.backdoor-require', severity: 'critical', title: 'require() of a numeric asset id', scope: 'any',
    re: /\brequire\s*\(\s*\(?\s*\d{6,}\s*\)?\s*\)/g,
    why: 'Loads code from the Roblox library at run time: the classic free-model backdoor that gives attackers admin.',
    fix: 'Delete it. Vendor the module into the project with its licence after reading it.' },
  { id: 'rbx.loadstring', severity: 'high', title: 'loadstring()', scope: 'any', re: /\bloadstring\s*\(/g,
    why: 'Runs arbitrary strings as code; needs LoadStringEnabled and is a common backdoor vector.', fix: 'Replace with real code or a data table.' },
  { id: 'rbx.getfenv', severity: 'high', title: 'getfenv/setfenv', scope: 'any', re: /\b(getfenv|setfenv)\s*\(/g,
    why: 'Used by obfuscated backdoors; also disables Luau optimisations for the whole script.', fix: 'Remove; pass values explicitly.' },
  { id: 'rbx.obfuscated-string', severity: 'high', title: 'Obfuscated byte string', scope: 'any', re: /(\\\d{2,3}){16,}/g,
    why: 'Long escaped byte strings hide code from reviewers (free-model malware).', fix: 'Decode it and review what it does; delete the script if you did not write it.' },
  { id: 'rbx.loadstring-enabled', severity: 'high', title: 'LoadStringEnabled turned on', scope: 'any', files: /\.project\.json$/,
    re: /"LoadStringEnabled"\s*:\s*true/g, why: 'Lets any script compile strings into code.', fix: 'Leave LoadStringEnabled off.' },
  { id: 'rbx.webhook-secret', severity: 'critical', title: 'Webhook or API secret in the game', scope: 'any',
    re: /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]{20,}|\b(x-api-key|apiKey|api_key)\b\s*[=:]\s*["'][^"']{16,}["']/g,
    why: 'Anything in the place can be extracted; a leaked webhook or Open Cloud key can be abused.', fix: 'Remove it, rotate the key, and keep secrets in HttpService secrets (server only) or outside Roblox.' },

  // ---------- Remotes ----------
  { id: 'rbx.remote-trusts-client-value', severity: 'high', title: 'Remote handler takes a price/reward/damage from the client', scope: 'server',
    re: /OnServerEvent:Connect\(\s*function\s*\(\s*\w+\s*,[^)]*\b(price|cost|amount|reward|damage|coins|cash|money|gems|xp|exp|health|speed)\b/gi,
    why: 'Exploiters can send any value; the server must decide prices, rewards and damage.', fix: 'Send an id or intent; look the value up on the server.' },
  { id: 'rbx.remote-unvalidated', severity: 'medium', title: 'OnServerEvent handler without argument validation', scope: 'server',
    re: /OnServerEvent:Connect\(\s*function\s*\([^)]*\)/g, blockNot: /typeof\s*\(|type\s*\(|Validate|validate|assert\s*\(|t\.\w+\(|guard|check/,
    why: 'Wrong types or NaN from a modified client can break game state.', fix: 'Register the remote with Net.on and a Validate check per argument.' },
  { id: 'rbx.invoke-client', severity: 'high', title: 'RemoteFunction:InvokeClient', scope: 'server', re: /:InvokeClient\s*\(/g,
    why: 'A client can never answer and hang the server thread, or return anything.', fix: 'Use a RemoteEvent and handle the client reply as untrusted input.' },
  { id: 'rbx.remote-no-rate-limit', severity: 'low', title: 'Remote handler without a rate limit', scope: 'server', fileLevel: true,
    requires: /OnServerEvent:Connect/, requiresNot: /RateLimiter|rateLimit|limiter|cooldown|Net\.on|lastFire|debounce/i, re: /OnServerEvent:Connect/g,
    why: 'Spamming a remote can flood DataStores, analytics or other players.', fix: 'Route through Net.on (rate limited) or add a per-player cooldown.' },

  // ---------- Data ----------
  { id: 'rbx.datastore-no-pcall', severity: 'medium', title: 'DataStore call outside pcall', scope: 'server',
    re: /^(?![^\n]*pcall)[^\n]*:(GetAsync|SetAsync|UpdateAsync|IncrementAsync|RemoveAsync|GetSortedAsync)\s*\(/gm,
    why: 'DataStore requests fail regularly (throttling, outages); an unhandled error loses the operation.', fix: 'Wrap in pcall with retries, or use ProfileStore for player data.' },
  { id: 'rbx.setasync-player-data', severity: 'medium', title: 'SetAsync on player data', scope: 'server',
    re: /:SetAsync\s*\([^)\n]*(UserId|player|plr|key)/gi,
    why: 'SetAsync overwrites without session locking: duplication and rollbacks across servers.', fix: 'Use ProfileStore sessions (or UpdateAsync with a session lock).' },

  // ---------- Correctness and performance ----------
  { id: 'rbx.deprecated-wait', severity: 'low', title: 'Deprecated wait/spawn/delay', scope: 'any', re: /(^|[^.\w:])(wait|spawn|delay)\s*\(/gm,
    why: 'The legacy scheduler is throttled and imprecise.', fix: 'Use task.wait, task.spawn, task.delay.' },
  { id: 'rbx.while-true-no-yield', severity: 'medium', title: 'while true loop without a yield', scope: 'any',
    re: /while\s+true\s+do/g, blockNot: /task\.wait|\bwait\s*\(|:Wait\s*\(|coroutine\.yield|RunService/,
    why: 'A loop that never yields freezes the server or client.', fix: 'Add task.wait() (or drive it from RunService.Heartbeat).' },
  { id: 'rbx.localplayer-on-server', severity: 'high', title: 'Players.LocalPlayer used in server code', scope: 'server', re: /\bLocalPlayer\b/g,
    why: 'LocalPlayer is nil on the server.', fix: 'Use the player passed to the event or Players:GetPlayers().' },
  { id: 'rbx.renderstepped-server', severity: 'high', title: 'RenderStepped in server code', scope: 'server', re: /RenderStepped|BindToRenderStep/g,
    why: 'Render callbacks only exist on clients; this errors on the server.', fix: 'Use RunService.Heartbeat on the server.' },
  { id: 'rbx.client-http', severity: 'high', title: 'HttpService request from a client script', scope: 'client', re: /:(GetAsync|PostAsync|RequestAsync)\s*\(/g, requires: /HttpService/,
    why: 'HttpService only works on the server; client code would also expose URLs and keys.', fix: 'Do the request on the server and send the safe result to clients.' },
  { id: 'rbx.connection-leak', severity: 'low', title: 'Per-frame connection without cleanup', scope: 'any', fileLevel: true,
    requires: /\.(Heartbeat|RenderStepped|Stepped|PreRender|PostSimulation):Connect/, requiresNot: /:Disconnect\(\)|Janitor|Trove|Maid|:Destroy\(\)/,
    re: /\.(Heartbeat|RenderStepped|Stepped|PreRender|PostSimulation):Connect/g,
    why: 'Per-frame connections that are never disconnected keep running and leak memory.', fix: 'Store the connection and Disconnect it, or use Janitor/Trove.' },
  { id: 'rbx.instance-new-parent-arg', severity: 'low', title: 'Instance.new with a parent argument', scope: 'any', re: /Instance\.new\(\s*["']\w+["']\s*,/g,
    why: 'Parenting before setting properties triggers extra replication and change events.', fix: 'Create, set properties, then set Parent last.' },

  // ---------- Monetization compliance ----------
  { id: 'rbx.paid-random-policy', severity: 'medium', title: 'Paid random items without a policy check', scope: 'server', fileLevel: true,
    requires: /(ProcessReceipt|PromptProductPurchase|PromptGamePassPurchase)[\s\S]*(math\.random|Random\.new)|(math\.random|Random\.new)[\s\S]*(ProcessReceipt|PromptProductPurchase)/,
    requiresNot: /ArePaidRandomItemsRestricted/, re: /(math\.random|Random\.new)/g,
    why: 'Paid random items must show their odds, and are restricted in some regions (PolicyService).', fix: 'Check PolicyService:GetPolicyInfoForPlayerAsync().ArePaidRandomItemsRestricted and show odds before purchase.' },
];

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

/** Which side of the network a file runs on (Rojo naming and the template layout). */
export function scopeOf(file) {
  const f = file.replace(/\\/g, '/');
  if (/\.server\.(lua|luau)$/.test(f) || /(^|\/)(server|ServerScriptService|ServerStorage)\//i.test(f)) return 'server';
  if (/\.client\.(lua|luau)$/.test(f) || /(^|\/)(client|StarterPlayer|StarterGui|StarterPlayerScripts|StarterCharacterScripts)\//i.test(f)) return 'client';
  return 'shared';
}
