# PocketAquarium

Cozy isometric park sanctuary game. Originally a Phaser 3 / TypeScript web app; **as of v2.0 ported to Godot 4 + C# (.NET 8)**.

The web version lives on branch `archive/web-v1` for reference only — don't edit it.

## Stack

- **Engine:** Godot 4.3 (Mono / .NET 8)
- **Language:** C# 12
- **Test framework:** xUnit on pure .NET 8 (game logic modules are Godot-free so they run in `dotnet test` without the engine)
- **Target platforms:** macOS (.app) and Windows (.exe). Cross-platform exports configured in Godot.
- **Art assets:** [PocketAquarium.Godot/assets/sprites/](PocketAquarium.Godot/assets/sprites/) — PixelLab-generated PNGs carried over from the web version.

## Directory layout

```
PocketAquarium.Godot/
  project.godot                      Godot project config
  PocketAquarium.csproj              Game project (.NET 8, Godot SDK)
  PocketAquarium.sln                 Solution with game + tests
  scenes/                            .tscn scene files
    Boot.tscn, Preload.tscn, Park.tscn, UI.tscn
  scripts/
    scenes/                          C# backing each .tscn
    entities/                        Tank, Fish, Decor, Guest
    systems/                         GameState, IsoGrid, PathFinder, SaveService, WillingnessModel
    data/                            Species, DecorCatalog, GameConstants
  assets/
    sprites/                         PNG art
    manifest.json                    Texture-key → file mapping
  tests/
    PocketAquarium.Tests.csproj      xUnit test project (pulls systems/ via Compile Include)
specs/                               Interface contracts for Codex tasks — one .md per task
```

## Build commands

```bash
# Run tests (no Godot needed — pure-C# logic modules only)
cd PocketAquarium.Godot && dotnet test

# Compile the game project (requires Godot + .NET SDK)
cd PocketAquarium.Godot && dotnet build

# Launch from the Godot editor
open -a Godot PocketAquarium.Godot/project.godot   # macOS
```

## Conventions

### Godot-free logic modules

`scripts/systems/` and `scripts/data/` must not `using Godot;`. They contain pure C# that the test project pulls in via `<Compile Include>` without the Godot runtime. This is what makes CI fast and keeps the logic testable.

Rendering/scene code under `scripts/scenes/` and `scripts/entities/` can use Godot types freely.

Coordinate types for pure-logic code:

```csharp
public readonly record struct TileCoord(int Col, int Row);
public readonly record struct WorldPos(float X, float Y);
```

Convert to/from `Godot.Vector2` at the boundary inside entity/scene code.

### Iso projection

Grid cells project to screen via `IsoGrid.TileToWorld(col, row)`:

```
screenX = ORIGIN_X + (col - row) * ISO_TILE_W / 2
screenY = ORIGIN_Y + (col + row) * ISO_TILE_H / 2
```

Depth sort key is `col + row`. Ground tiles use depth `(col+row) - 1000`, placements use `(col+row)`, decor/guests use their current-tile depth with interpolation during walk.

### Save format

JSON via `System.Text.Json`, written to `user://save.json`. Save schema v2 fields (money, reputation, tanks, decor, paths, caught, ticketPrice) kept compatible with the old web version's `localStorage` schema so a migration path exists if someone wants it.

### Claude vs Codex split

Claude owns scene graph, rendering, entities, UI layout, exports.

Codex owns pure-data ports and testable systems modules, each against a written spec in `specs/`. See `specs/README.md` for the task list and contract format.

## Known gotchas

- **Godot needs `dotnet restore` before first build.** If the C# project doesn't compile, run `cd PocketAquarium.Godot && dotnet restore` and try again.
- **Scene changes don't trigger a C# rebuild.** After editing a `.cs`, run `dotnet build` or use the Godot editor's build button before pressing Play.
- **Textures use nearest-neighbor filtering.** Set at the project level via `rendering/textures/canvas_textures/default_texture_filter=0`. Don't override per-sprite.
- **Viewport is 320×180** with `stretch/mode=viewport`. The window renders at 1280×720 (4× scale) — all game coords are in the 320×180 space.
