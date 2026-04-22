using System.Collections.Generic;
using System.Linq;
using PocketAquarium;
using PocketAquarium.Systems;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class PathFinderTests
{
    private static ISet<TileCoord> PathsOf(params (int, int)[] coords) =>
        new HashSet<TileCoord>(coords.Select(c => new TileCoord(c.Item1, c.Item2)));

    [Fact]
    public void StartEqualsEndReturnsSingleton()
    {
        var path = PathFinder.TilesBetween(new(2, 2), new(2, 2), PathsOf());
        Assert.Single(path);
        Assert.Equal(new TileCoord(2, 2), path[0]);
    }

    [Fact]
    public void StraightLine()
    {
        var walkable = PathsOf((1, 0), (2, 0), (3, 0));
        var path = PathFinder.TilesBetween(new(0, 0), new(3, 0), walkable);
        Assert.Equal(4, path.Count);
        Assert.Equal(new TileCoord(0, 0), path[0]);
        Assert.Equal(new TileCoord(3, 0), path[^1]);
    }

    [Fact]
    public void UnreachableReturnsEmpty()
    {
        var walkable = PathsOf((1, 0), (2, 0));
        var path = PathFinder.TilesBetween(new(0, 0), new(5, 5), walkable);
        Assert.Empty(path);
    }

    [Fact]
    public void GoesAroundGap()
    {
        var walkable = PathsOf((1, 0), (2, 0), (2, 1), (2, 2));
        var path = PathFinder.TilesBetween(new(0, 0), new(2, 2), walkable);
        Assert.Equal(new TileCoord(0, 0), path[0]);
        Assert.Equal(new TileCoord(2, 2), path[^1]);
        Assert.True(path.Count >= 4);
    }

    [Fact]
    public void DestinationAlwaysReachableEvenIfNotWalkable()
    {
        var walkable = PathsOf((1, 0));
        var path = PathFinder.TilesBetween(new(0, 0), new(2, 0), walkable);
        Assert.Equal(3, path.Count);
    }
}
