# Codex task specs

Each `NN-name.md` is a self-contained task for Codex. Read the spec, implement the file(s) under `PocketAquarium.Godot/scripts/...`, make `dotnet test` pass from `PocketAquarium.Godot/`, submit.

## Contract

Every spec has five sections:

1. **Goal** — one line, what the module does
2. **Reference** — existing TypeScript source file to port from (under `archive/web-v1` branch)
3. **Output** — C# file path(s) and their required types/methods/signatures
4. **Behavior** — edge cases and exact numeric values that must be preserved
5. **Tests** — concrete xUnit cases that must pass

### Rules

- Pure-logic modules (under `scripts/systems/` and `scripts/data/`) must not `using Godot;`. They run in the test project without the engine.
- Use `TileCoord(int Col, int Row)` and `WorldPos(float X, float Y)` records defined in `scripts/data/GameConstants.cs` for grid coordinates. Not `Godot.Vector2`.
- Match save-field JSON names exactly against the TS version (use `[JsonPropertyName]` if the C# name differs) so old saves can hypothetically load.
- Don't touch files outside what the spec lists in "Output".
- Ship with xUnit tests that fail without the implementation, and pass with it.
- Run `cd PocketAquarium.Godot && dotnet test` before submitting. All tests must pass.

## Task order (dependency-sorted)

1. [01-game-constants.md](01-game-constants.md) — shared types, palette, grid dims. No deps.
2. [02-decor-catalog.md](02-decor-catalog.md) — decor catalog data. Depends on 01.
3. [03-species.md](03-species.md) — species catalog data. Depends on 01.
4. [04-iso-grid.md](04-iso-grid.md) — iso projection helpers. Depends on 01.
5. [05-pathfinder.md](05-pathfinder.md) — BFS over path tiles. Depends on 01.
6. [06-gamestate.md](06-gamestate.md) — state container with events. Depends on 02, 03.
7. [07-save-service.md](07-save-service.md) — JSON load/save. Depends on 06.
8. [08-willingness.md](08-willingness.md) — willingness-to-pay model. Depends on 01.
9. [09-asset-pipeline.md](09-asset-pipeline.md) — Python manifest validator. Independent.
10. [10-ci-workflow.md](10-ci-workflow.md) — GitHub Actions. Depends on any test module existing.

Tasks 1-4 have no inter-dependencies beyond #1 and can run in parallel. 5 is independent. 6 needs 2+3. 7 needs 6. 8 is independent. 9 and 10 are independent.
