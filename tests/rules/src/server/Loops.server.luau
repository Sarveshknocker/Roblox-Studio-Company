-- ruleid: rbx.while-true-no-yield
while true do
	counter += 1
end
-- ok: rbx.while-true-no-yield
while true do
	task.wait(1)
	counter += 1
end
-- ruleid: rbx.deprecated-wait
wait(2)
-- ok: rbx.deprecated-wait
task.wait(2)
-- ruleid: rbx.deprecated-wait
spawn(function() end)
-- ok: rbx.deprecated-wait
task.spawn(function() end)
-- ok: rbx.deprecated-wait
humanoid.Died:Wait()
-- ruleid: rbx.instance-new-parent-arg
local p = Instance.new("Part", workspace)
-- ok: rbx.instance-new-parent-arg
local q = Instance.new("Part")
-- ok: rbx.while-true-no-yield
while true do task.wait(0.5) end
-- ruleid: rbx.while-true-no-yield
while true do counter += 1 end
-- ok: rbx.while-true-no-yield
while true do task.wait(0.5) end
-- ruleid: rbx.while-true-no-yield
while true do counter += 1 end
