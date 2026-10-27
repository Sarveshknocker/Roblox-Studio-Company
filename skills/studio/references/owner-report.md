# Owner report format

Run `node <kit>/bin/studio.mjs status .` first. The chat report must agree with `studio/00-owner/STATUS.md`.

```
## Studio report — <date> · Phase: <phase> · Next gate: <gate>

Done since last report
- <department>: <what> — evidence: <file / test result / playtest note>

Next (this sprint)
- <department>: <what> (owner of the task)

Decisions needed from you
1. <question> — options: A) … B) … — I recommend <A> because <reason>. (Blocking: <what waits on this>)

Risks
- <risk> — severity <high/medium/low> — mitigation: <what we are doing>

Blocked
- <what> — waiting on <who/what>
```

Rules
- Plain language. Explain any term the owner may not know in a few words, or point to the glossary.
- Every "done" has evidence. "In progress" is not "done".
- Bad news first if something slipped, with the new plan.
- Keep it to one screen; details live in the department folders.
