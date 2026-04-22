# Spec 04: IsoGrid

## Goal

Iso projection math. Convert between tile coords and screen coords, compute depth keys.

## Reference

`archive/web-v1` branch: `src/world/Grid.ts` (the static methods `tileToWorld`, `worldToTile`, `tileDepth`).

## Output

File: `PocketAquarium.Godot/scripts/systems/IsoGrid.cs`
Namespace: `PocketAquarium.Systems`

```csharp
public static class IsoGrid
{
    /// <summary>
    /// Iso projection. Returns the screen-space center of the tile's diamond.
    /// Fractional col/row allowed for multi-tile sprite centers.
    /// </summary>
    public static WorldPos TileToWorld(float col, float row);

    /// <summary>
    /// Inverse projection. Returns the integer tile under a screen coord.
    /// Uses floor so clicks near the edge round to the expected tile.
    /// </summary>
    public static TileCoord WorldToTile(float x, float y);

    /// <summary>Painter-sort key. Larger draws on top.</summary>
    public static float TileDepth(int col, int row);

    /// <summary>True if the tile is inside the grid bounds.</summary>
    public static bool InBounds(int col, int row);
}
```

## Behavior

Formulas (from `Grid.ts`):

```
x = ISO_ORIGIN_X + (col - row) * ISO_TILE_W / 2
y = ISO_ORIGIN_Y + (col + row) * ISO_TILE_H / 2
```

Inverse:

```
lx = (x - ISO_ORIGIN_X) / (ISO_TILE_W / 2)
ly = (y - ISO_ORIGIN_Y) / (ISO_TILE_H / 2)
col = floor((lx + ly) / 2)
row = floor((ly - lx) / 2)
```

Depth: `col + row` as a float.

`InBounds`: `col in [0, GridCols)` AND `row in [0, GridRows)`.

No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/IsoGridTests.cs`

```csharp
public class IsoGridTests
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
        for (int r = 0; r < GameConstants.GridRows; r++)
        for (int c = 0; c < GameConstants.GridCols; c++)
        {
            var w = IsoGrid.TileToWorld(c, r);
            var t = IsoGrid.WorldToTile(w.X, w.Y);
            Assert.Equal(new TileCoord(c, r), t);
        }
    }

    [Fact]
    public void DepthSortsBackToFront()
    {
        var back  = IsoGrid.TileDepth(0, 0);
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
```
