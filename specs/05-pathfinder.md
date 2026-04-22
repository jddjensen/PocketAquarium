# Spec 05: PathFinder

## Goal

BFS pathfinding for guests over placed path tiles. Same behavior as `Guest.tilesBetween` in the TS version.

## Reference

`archive/web-v1` branch: `src/entities/Guest.ts` — the static method `tilesBetween(from, to, pathTiles)`.

## Output

File: `PocketAquarium.Godot/scripts/systems/PathFinder.cs`
Namespace: `PocketAquarium.Systems`

```csharp
public static class PathFinder
{
    /// <summary>
    /// Breadth-first search from <paramref name="from"/> to <paramref name="to"/>
    /// through tiles in <paramref name="walkable"/>. The destination doesn't
    /// need to be in <paramref name="walkable"/> — it's always allowed as the
    /// final step. Returns the list of tiles on the shortest path inclusive of
    /// both endpoints, or an empty list if unreachable.
    /// </summary>
    public static IReadOnlyList<TileCoord> TilesBetween(
        TileCoord from,
        TileCoord to,
        ISet<TileCoord> walkable
    );
}
```

## Behavior

- Explores 4-connected neighbors (up/down/left/right), not diagonals.
- Neighbor `n` is reachable iff `walkable.Contains(n) || n == to`.
- If `from == to`, return `[from]`.
- If unreachable, return empty.
- BFS ordering: push neighbors in `(east, west, south, north)` = `[(1,0),(-1,0),(0,1),(0,-1)]` to match the TS iteration order (affects tie-breaking on shortest paths).

No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/PathFinderTests.cs`

```csharp
public class PathFinderTests
{
    private static ISet<TileCoord> PathsOf(params (int,int)[] coords)
        => new HashSet<TileCoord>(coords.Select(c => new TileCoord(c.Item1, c.Item2)));

    [Fact]
    public void StartEqualsEndReturnsSingleton()
    {
        var path = PathFinder.TilesBetween(new(2,2), new(2,2), PathsOf());
        Assert.Single(path);
        Assert.Equal(new TileCoord(2,2), path[0]);
    }

    [Fact]
    public void StraightLine()
    {
        var walkable = PathsOf((1,0), (2,0), (3,0));
        var path = PathFinder.TilesBetween(new(0,0), new(3,0), walkable);
        Assert.Equal(4, path.Count);
        Assert.Equal(new TileCoord(0,0), path[0]);
        Assert.Equal(new TileCoord(3,0), path[^1]);
    }

    [Fact]
    public void UnreachableReturnsEmpty()
    {
        var walkable = PathsOf((1,0), (2,0));
        var path = PathFinder.TilesBetween(new(0,0), new(5,5), walkable);
        Assert.Empty(path);
    }

    [Fact]
    public void GoesAroundGap()
    {
        // walkable forms an L-shape: (1,0) → (2,0) → (2,1) → (2,2)
        var walkable = PathsOf((1,0),(2,0),(2,1),(2,2));
        var path = PathFinder.TilesBetween(new(0,0), new(2,2), walkable);
        Assert.Equal(new TileCoord(0,0), path[0]);
        Assert.Equal(new TileCoord(2,2), path[^1]);
        Assert.True(path.Count >= 4);
    }

    [Fact]
    public void DestinationAlwaysReachableEvenIfNotWalkable()
    {
        // destination not in walkable set — but must still be reachable as
        // final step. TS behavior: the grass tile outside the gate is the
        // spawn, not in the path network.
        var walkable = PathsOf((1,0));
        var path = PathFinder.TilesBetween(new(0,0), new(2,0), walkable);
        Assert.Equal(3, path.Count);
    }
}
```
