# Spec 02: DecorCatalog

## Goal

Port the decor catalog so Tank/Decor/UI can look up cost, appeal, and scale per decor kind.

## Reference

`archive/web-v1` branch: `src/data/decor.ts`.

```bash
git show archive/web-v1:src/data/decor.ts
```

## Output

File: `PocketAquarium.Godot/scripts/data/DecorCatalog.cs`
Namespace: `PocketAquarium`

```csharp
public enum DecorKind
{
    Plant,
    Rock,
    Tree,
    Bench,
    Flowerbed,
    Fountain
}

public sealed record DecorSpec(
    DecorKind Kind,
    string Label,
    int Cost,
    int Appeal,
    int Scale // always 1 or 2
);

public static class DecorCatalog
{
    public static readonly IReadOnlyDictionary<DecorKind, DecorSpec> Entries =
        new Dictionary<DecorKind, DecorSpec>
        {
            [DecorKind.Plant]     = new(DecorKind.Plant,     "plant",    15, 1, 2),
            [DecorKind.Rock]      = new(DecorKind.Rock,      "rock",     10, 0, 2),
            [DecorKind.Tree]      = new(DecorKind.Tree,      "tree",     25, 2, 1),
            [DecorKind.Bench]     = new(DecorKind.Bench,     "bench",    20, 1, 1),
            [DecorKind.Flowerbed] = new(DecorKind.Flowerbed, "flowers",  18, 2, 1),
            [DecorKind.Fountain]  = new(DecorKind.Fountain,  "fountain", 60, 4, 1),
        };

    public static IEnumerable<DecorSpec> All => Entries.Values;

    public static DecorSpec Get(DecorKind kind) => Entries[kind];

    /// <summary>Convert a kind to the wire-format string used in save files.</summary>
    public static string ToWireName(DecorKind kind) => kind.ToString().ToLowerInvariant();

    /// <summary>Inverse of <see cref="ToWireName"/>. Throws on unknown strings.</summary>
    public static DecorKind FromWireName(string name) => name switch
    {
        "plant"     => DecorKind.Plant,
        "rock"      => DecorKind.Rock,
        "tree"      => DecorKind.Tree,
        "bench"     => DecorKind.Bench,
        "flowerbed" => DecorKind.Flowerbed,
        "fountain"  => DecorKind.Fountain,
        _ => throw new ArgumentException($"Unknown decor kind: {name}")
    };
}
```

## Behavior

- Numeric values exact match to TS.
- `ToWireName` must return lowercase strings matching the TS union (`'plant' | 'rock' | 'tree' | 'bench' | 'flowerbed' | 'fountain'`).
- No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/DecorCatalogTests.cs`

```csharp
public class DecorCatalogTests
{
    [Fact]
    public void EveryKindHasAnEntry()
    {
        foreach (DecorKind kind in Enum.GetValues<DecorKind>())
            Assert.True(DecorCatalog.Entries.ContainsKey(kind));
    }

    [Theory]
    [InlineData(DecorKind.Plant, 15, 1)]
    [InlineData(DecorKind.Rock, 10, 0)]
    [InlineData(DecorKind.Tree, 25, 2)]
    [InlineData(DecorKind.Bench, 20, 1)]
    [InlineData(DecorKind.Flowerbed, 18, 2)]
    [InlineData(DecorKind.Fountain, 60, 4)]
    public void CostAndAppealMatchTsVersion(DecorKind kind, int cost, int appeal)
    {
        var spec = DecorCatalog.Get(kind);
        Assert.Equal(cost, spec.Cost);
        Assert.Equal(appeal, spec.Appeal);
    }

    [Fact]
    public void WireNameRoundTrip()
    {
        foreach (DecorKind kind in Enum.GetValues<DecorKind>())
        {
            var name = DecorCatalog.ToWireName(kind);
            Assert.Equal(kind, DecorCatalog.FromWireName(name));
        }
    }

    [Fact]
    public void FlowerbedUsesFlowersLabel()
    {
        Assert.Equal("flowers", DecorCatalog.Get(DecorKind.Flowerbed).Label);
    }
}
```
