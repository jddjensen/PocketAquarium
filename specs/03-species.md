# Spec 03: Species

## Goal

Port the creature catalog. Name, price, appeal, rarity, reputation unlock, and palette for procedural fish sprites.

## Reference

`archive/web-v1` branch: `src/data/species.ts`.

```bash
git show archive/web-v1:src/data/species.ts
```

Copy every species and every field exactly. Do not invent species.

## Output

File: `PocketAquarium.Godot/scripts/data/Species.cs`
Namespace: `PocketAquarium`

```csharp
public enum Rarity { Common, Uncommon, Rare, Epic, Legendary }
public enum FishSize { Small, Medium, Large }

public sealed record SpeciesPalette(
    uint Base,
    uint Shadow,
    uint Highlight,
    uint Fin,
    uint Eye
);

public sealed record Species(
    string Id,
    string Name,
    int Price,
    int Appeal,
    Rarity Rarity,
    FishSize Size,
    int UnlockReputation,
    SpeciesPalette Palette
);

public static class SpeciesCatalog
{
    public static readonly IReadOnlyList<Species> All = /* populate from TS */;

    public static Species ById(string id);
    public static IReadOnlyList<Species> UnlockedAt(int reputation);
}
```

## Behavior

- `All` preserves the order from the TS file (UI listing matches).
- `ById` throws on unknown id.
- `UnlockedAt(reputation)` returns every species whose `UnlockReputation <= reputation`.
- `Rarity` and `FishSize` enums map to the TS string unions case-insensitively via a wire-name helper if needed for save compat. Check the TS species.ts to see what's persisted — if rarity/size aren't in the save file, don't worry about wire names.
- No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/SpeciesTests.cs`

```csharp
public class SpeciesTests
{
    [Fact]
    public void AllIsNonEmpty() => Assert.NotEmpty(SpeciesCatalog.All);

    [Fact]
    public void IdsAreUnique()
    {
        var ids = SpeciesCatalog.All.Select(s => s.Id).ToList();
        Assert.Equal(ids.Count, ids.Distinct().Count());
    }

    [Fact]
    public void ByIdReturnsMatching()
    {
        var first = SpeciesCatalog.All[0];
        Assert.Same(first, SpeciesCatalog.ById(first.Id));
    }

    [Fact]
    public void ByIdThrowsOnUnknown()
    {
        Assert.Throws<KeyNotFoundException>(() => SpeciesCatalog.ById("not-a-real-species"));
    }

    [Fact]
    public void UnlockedAtZeroIncludesOnlyZeroRepSpecies()
    {
        var starters = SpeciesCatalog.UnlockedAt(0);
        Assert.All(starters, s => Assert.Equal(0, s.UnlockReputation));
    }

    [Fact]
    public void UnlockedAtHighRepIncludesAll()
    {
        var all = SpeciesCatalog.UnlockedAt(10_000);
        Assert.Equal(SpeciesCatalog.All.Count, all.Count);
    }
}
```
