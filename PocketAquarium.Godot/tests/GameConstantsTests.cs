using PocketAquarium;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class GameConstantsTests
{
    [Fact]
    public void GridDimensionsMatchDesign()
    {
        Assert.Equal(11, GameConstants.GridCols);
        Assert.Equal(7, GameConstants.GridRows);
    }

    [Fact]
    public void IsoTileAspectIs2To1()
    {
        Assert.Equal(GameConstants.IsoTileW, GameConstants.IsoTileH * 2);
    }

    [Fact]
    public void DoorIsOnSouthEdgeCenter()
    {
        Assert.Equal(GameConstants.GridCols / 2, GameConstants.Door.Col);
        Assert.Equal(GameConstants.GridRows - 2, GameConstants.Door.Row);
    }

    [Fact]
    public void TileCoordEquality()
    {
        Assert.Equal(new TileCoord(3, 4), new TileCoord(3, 4));
        Assert.NotEqual(new TileCoord(3, 4), new TileCoord(4, 3));
    }

    [Fact]
    public void PaletteMatchesTsValues()
    {
        Assert.Equal(0xffd166u, Palette.FishYellow);
        Assert.Equal(0x1d3d2eu, Palette.UiFg);
        Assert.Equal(0xffd700u, Palette.DoorHandle);
    }
}
