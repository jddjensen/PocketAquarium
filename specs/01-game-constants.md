# Spec 01: GameConstants

## Goal

Port the shared constants and coordinate types from the TS version so every other module can reference them without duplication.

## Reference

Read from `archive/web-v1` branch: `src/constants.ts`. Retrieve with:

```bash
git show archive/web-v1:src/constants.ts
```

## Output

File: `PocketAquarium.Godot/scripts/data/GameConstants.cs`
Namespace: `PocketAquarium`

Required public types:

```csharp
public readonly record struct TileCoord(int Col, int Row);
public readonly record struct WorldPos(float X, float Y);

public static class GameConstants
{
    public const int GameWidth  = 320;
    public const int GameHeight = 180;

    public const int TileSize = 16;
    public const int GridCols = 11;
    public const int GridRows = 7;

    public const int IsoTileW = 32;
    public const int IsoTileH = 16;
    public const int IsoOriginX = 112;
    public const int IsoOriginY = 30;
    public const int IsoWallHeight = 24;

    public static readonly TileCoord Door     = new(GridCols / 2, GridRows - 2);
    public static readonly TileCoord Entrance = new(GridCols / 2, GridRows - 1);

    public const int DefaultTicketPrice = 5;
    public const int MinTicketPrice = 0;
    public const int MaxTicketPrice = 50;
}

public static class Palette
{
    // Colors stored as uint (0xRRGGBB). Game code converts to Godot.Color
    // at the boundary. Pure-logic modules stay Godot-free.
    public const uint SkyDeep       = 0x1d3d2e;
    public const uint WaterDeep     = 0x1d6b6b;
    public const uint WaterMid      = 0x2ea7a1;
    public const uint WaterLight    = 0x6db7ff;
    public const uint WaterSurface  = 0x9fd4ff;
    public const uint Sand          = 0xe7c98a;
    public const uint SandShadow    = 0xb89960;
    public const uint Stone         = 0x6b737c;
    public const uint StoneShadow   = 0x4a5056;
    public const uint Plant         = 0x27b26a;
    public const uint PlantShadow   = 0x1d3d2e;
    public const uint FishRed       = 0xff6e5b;
    public const uint FishYellow    = 0xffd166;
    public const uint FishPurple    = 0xc9527e;
    public const uint FishGreen     = 0x4cc98b;
    public const uint FishBlue      = 0x6db7ff;
    public const uint Wall          = 0x6b737c;
    public const uint Floor         = 0x27b26a;
    public const uint Path          = 0xe7c98a;
    public const uint UiBg          = 0xfff7e1;
    public const uint UiFg          = 0x1d3d2e;
    public const uint UiAccent      = 0xff6e5b;
    public const uint GuestSkin     = 0xffd9a8;
    public const uint Coin          = 0xffd166;
    public const uint Grass         = 0x27b26a;
    public const uint GrassShade    = 0x1d6b43;
    public const uint GrassHighlight= 0x4cc98b;
    public const uint Brick         = 0x8b6f47;
    public const uint BrickShade    = 0x5a3f2a;
    public const uint BrickHighlight= 0xc2a878;
    public const uint DoorWood      = 0x6b3f29;
    public const uint DoorWoodShade = 0x3d2417;
    public const uint DoorWoodHighlight = 0xa06a3f;
    public const uint DoorHandle    = 0xffd700;
}
```

## Behavior

- Numeric values must match the TS constants exactly. Copy, don't approximate.
- `TileCoord` and `WorldPos` are `readonly record struct` — value semantics, immutable, free equality.
- Do NOT `using Godot;` in this file.

## Tests

File: `PocketAquarium.Godot/tests/GameConstantsTests.cs`

```csharp
public class GameConstantsTests
{
    [Fact]
    public void GridDimensionsMatchDesign()
    {
        Assert.Equal(11, GameConstants.GridCols);
        Assert.Equal(7,  GameConstants.GridRows);
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
}
```
