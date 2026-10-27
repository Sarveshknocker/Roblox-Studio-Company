# Credits

Roblox Studio Company builds on these open-source projects. They are used as tools, pinned dependencies, or as
references for practice. No code is copied from them into the kit.

| Project | Licence | How it is used |
|---|---|---|
| [Rojo](https://github.com/rojo-rbx/rojo) | MPL-2.0 | file-system project ↔ Studio sync, build in CI |
| [Rokit](https://github.com/rojo-rbx/rokit) | MPL-2.0 | toolchain pinning (`rokit.toml`) |
| [Selene](https://github.com/Kampfkarren/selene) | MPL-2.0 | Luau linter (`std = "roblox"`) |
| [StyLua](https://github.com/JohnnyMorganz/StyLua) | MPL-2.0 | Luau formatter |
| [Lune](https://github.com/lune-org/lune) | MPL-2.0 | runs the template's Luau unit tests outside Studio |
| [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) | MIT | editor type checking (recommended) |
| [ProfileStore](https://github.com/MadStudioRoblox/ProfileStore) | Apache-2.0 | session-locked player data, installed by `deps` at a pinned commit with its licence |
| [setup-rokit](https://github.com/CompeyDev/setup-rokit) | MIT | GitHub Action that installs the pinned toolchain |
| [Wally](https://github.com/UpliftGames/wally) | MPL-2.0 | package registry searched by `research` |
| [Blender](https://www.blender.org/) | GPL | art pipeline (`studio-art`) |
| Roblox Creator Hub documentation | — | API behaviour: ProcessReceipt, AnalyticsService, PolicyService, TextService, streaming |

The studio structure (nine sectors, six phases, feature pipeline) follows the owner's own open-source game-studio
blueprint, adapted to Roblox.
