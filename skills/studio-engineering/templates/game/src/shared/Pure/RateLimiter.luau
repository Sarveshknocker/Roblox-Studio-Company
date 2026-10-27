--!strict
-- Token-bucket rate limiter keyed by player (or any key). Pure Luau: the caller passes the current time, so it can be
-- tested without Roblox and used with os.clock() on the server.

export type RateLimiter = {
	allow: (self: RateLimiter, key: any, now: number) -> boolean,
	forget: (self: RateLimiter, key: any) -> (),
}

type Bucket = { tokens: number, last: number }

local RateLimiter = {}
RateLimiter.__index = RateLimiter

-- capacity: burst size; refillPerSecond: sustained requests per second.
function RateLimiter.new(capacity: number, refillPerSecond: number): RateLimiter
	assert(capacity >= 1, "capacity must be >= 1")
	assert(refillPerSecond > 0, "refillPerSecond must be > 0")
	local self =
		setmetatable({ capacity = capacity, refill = refillPerSecond, buckets = {} :: { [any]: Bucket } }, RateLimiter)
	return (self :: any) :: RateLimiter
end

function RateLimiter.allow(self: any, key: any, now: number): boolean
	local bucket: Bucket? = self.buckets[key]
	if bucket == nil then
		bucket = { tokens = self.capacity, last = now }
		self.buckets[key] = bucket
	end
	assert(bucket, "rate limiter bucket missing")
	local elapsed = math.max(0, now - bucket.last)
	bucket.tokens = math.min(self.capacity, bucket.tokens + elapsed * self.refill)
	bucket.last = now
	if bucket.tokens >= 1 then
		bucket.tokens -= 1
		return true
	end
	return false
end

-- Call when a player leaves so the table does not grow forever.
function RateLimiter.forget(self: any, key: any)
	self.buckets[key] = nil
end

return RateLimiter
