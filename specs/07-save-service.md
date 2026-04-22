# Spec 07: SaveService

## Goal

Serialize/deserialize `GameState` to JSON, backward-compatible with the web v2 save schema.

## Reference

`archive/web-v1` branch: `src/systems/GameState.ts` — the `SaveData` interface and `save`/`load` methods.

Current save JSON shape (v2):

```json
{
  "version": 2,
  "money": 500,
  "reputation": 0,
  "tanks": [{"id":"...", "col":3, "row":2, "w":2, "h":2, "fishSpeciesIds":["goldie"]}],
  "decor": [{"id":"...", "col":1, "row":4, "kind":"plant"}],
  "paths": [{"col":5, "row":6}],
  "caught": ["goldie"],
  "ticketPrice": 5
}
```

## Output

File: `PocketAquarium.Godot/scripts/systems/SaveService.cs`
Namespace: `PocketAquarium.Systems`

```csharp
public sealed class SaveService
{
    /// <summary>
    /// Pluggable persistence — production uses `FileStore(path)`, tests use
    /// `MemoryStore()`. Keeps this module Godot-free (no FileAccess / user:// API).
    /// </summary>
    public interface IStore
    {
        string? Read();
        void Write(string json);
    }

    public sealed class MemoryStore : IStore
    {
        private string? _buf;
        public string? Read() => _buf;
        public void Write(string json) => _buf = json;
    }

    public sealed class FileStore : IStore
    {
        public FileStore(string absolutePath);
        public string? Read();
        public void Write(string json);
    }

    public SaveService(IStore store);

    /// <summary>Writes the current state to the store.</summary>
    public void Save(GameState state);

    /// <summary>
    /// Loads state if the store has a valid save. Returns null on missing,
    /// malformed, or unknown-version payloads — caller should construct a
    /// fresh default GameState in those cases.
    /// </summary>
    public GameState? Load();
}
```

## Behavior

- JSON field names lowercase/camelCase matching the v2 TS schema (use `JsonNamingPolicy.CamelCase` on `JsonSerializerOptions`).
- `decor[].kind` is a string — convert via `DecorCatalog.ToWireName` / `FromWireName`.
- `version` field emitted as 2 on save. On load, accept version 2, reject 1 (return null — the web v1 loader is not required in the Godot port).
- Unknown fields tolerated (forward compat).
- Invalid JSON → return null, don't throw.

No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/SaveServiceTests.cs`

- Default state round-trips: save → load → equal money/reputation/tool.
- Populated state round-trips: one tank, one decor of each kind, some paths, caught set.
- `MemoryStore` isolation — two instances don't share data.
- Malformed JSON → `Load()` returns null.
- Empty store → `Load()` returns null.
- Missing-field tolerance: pass a v2 JSON with `ticketPrice` removed; loader returns non-null with default ticket price (5).
