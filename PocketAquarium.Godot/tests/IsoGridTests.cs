using PocketAquarium;
using PocketAquarium.Systems;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class IsoGridTests
{
    [Fact]
    public void TileToWorldAtOrigin()
    {
        var p = IsoGrid.TileToWorld(0, 0);
        Assert.Equal(GameConstants.IsoOriginX, p.X);
        Assert.Equal(GameConstants.IsoOriginY, p.Y);
    }

    [Fact]
    public void RoundTripForEveryTile()
    {
        for (var r = 0; r < GameConstants.GridRows; r++)
        for (var c = 0; c < GameConstants.GridCols; c++)
        {
            var w = IsoGrid.TileToWorld(c, r);
            var t = IsoGrid.WorldToTile(w.X, w.Y);
            Assert.Equal(new TileCoord(c, r), t);
        }
    }

    [Fact]
    public void DepthSortsBackToFront()
    {
        var back = IsoGrid.TileDepth(0, 0);
        var front = IsoGrid.TileDepth(GameConstants.GridCols - 1, GameConstants.GridRows - 1);
        Assert.True(front > back);
    }

    [Theory]
    [InlineData(0, 0, true)]
    [InlineData(10, 6, true)]
    [InlineData(-1, 0, false)]
    [InlineData(0, -1, false)]
    [InlineData(11, 0, false)]
    [InlineData(0, 7, false)]
    public void InBoundsMatchesGridDims(int col, int row, bool expected)
    {
        Assert.Equal(expected, IsoGrid.InBounds(col, row));
    }
}
