--!strict
-- Progression formulas. These are the SAME formulas the design simulator (economy.mjs) uses, so what Design balanced is
-- what the game runs. Pure Luau, tested with Lune.

local Progression = {}

-- XP needed to go from `level` to `level + 1`.
function Progression.xpToNext(level: number, base: number, exponent: number): number
	return base * level ^ exponent
end

-- Adds XP and returns the new level and leftover XP (several level-ups at once are handled).
function Progression.addXp(
	level: number,
	xp: number,
	gained: number,
	base: number,
	exponent: number,
	maxLevel: number
): (number, number)
	xp += gained
	while level < maxLevel and xp >= Progression.xpToNext(level, base, exponent) do
		xp -= Progression.xpToNext(level, base, exponent)
		level += 1
	end
	if level >= maxLevel then
		level = maxLevel
	end
	return level, xp
end

-- Income per minute for a source: perMinute × level growth × upgrade bonus × pass multiplier.
function Progression.incomePerMinute(
	perMinute: number,
	growthPerLevel: number,
	level: number,
	upgradeBonus: number,
	multiplier: number
): number
	return perMinute * (1 + growthPerLevel * (level - 1)) * (1 + upgradeBonus) * multiplier
end

return Progression
