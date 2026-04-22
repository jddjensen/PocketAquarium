namespace PocketAquarium;

using System.Text.Json.Serialization;

public readonly record struct TileCoord(
    [property: JsonPropertyName("col")] int Col,
    [property: JsonPropertyName("row")] int Row
);

public readonly record struct WorldPos(
    [property: JsonPropertyName("x")] float X,
    [property: JsonPropertyName("y")] float Y
);

public static class GameConstants
{
    public const int GameWidth = 320;
    public const int GameHeight = 180;

    public const int TileSize = 16;
    public const int GridCols = 11;
    public const int GridRows = 7;

    public const int IsoTileW = 32;
    public const int IsoTileH = 16;
    public const int IsoOriginX = 112;
    public const int IsoOriginY = 30;
    public const int IsoWallHeight = 24;

    public static readonly TileCoord Door = new(GridCols / 2, GridRows - 2);
    public static readonly TileCoord Entrance = new(GridCols / 2, GridRows - 1);

    public const int DefaultTicketPrice = 5;
    public const int MinTicketPrice = 0;
    public const int MaxTicketPrice = 50;
}

public static class Palette
{
    public const uint SkyDeep = 0x1d3d2e;
    public const uint WaterDeep = 0x1d6b6b;
    public const uint WaterMid = 0x2ea7a1;
    public const uint WaterLight = 0x6db7ff;
    public const uint WaterSurface = 0x9fd4ff;
    public const uint Sand = 0xe7c98a;
    public const uint SandShadow = 0xb89960;
    public const uint Stone = 0x6b737c;
    public const uint StoneShadow = 0x4a5056;
    public const uint Plant = 0x27b26a;
    public const uint PlantShadow = 0x1d3d2e;
    public const uint FishRed = 0xff6e5b;
    public const uint FishYellow = 0xffd166;
    public const uint FishPurple = 0xc9527e;
    public const uint FishGreen = 0x4cc98b;
    public const uint FishBlue = 0x6db7ff;
    public const uint Wall = 0x6b737c;
    public const uint Floor = 0x27b26a;
    public const uint Path = 0xe7c98a;
    public const uint UiBg = 0xfff7e1;
    public const uint UiFg = 0x1d3d2e;
    public const uint UiAccent = 0xff6e5b;
    public const uint GuestSkin = 0xffd9a8;
    public const uint Coin = 0xffd166;
    public const uint Grass = 0x27b26a;
    public const uint GrassShade = 0x1d6b43;
    public const uint GrassHighlight = 0x4cc98b;
    public const uint Brick = 0x8b6f47;
    public const uint BrickShade = 0x5a3f2a;
    public const uint BrickHighlight = 0xc2a878;
    public const uint DoorWood = 0x6b3f29;
    public const uint DoorWoodShade = 0x3d2417;
    public const uint DoorWoodHighlight = 0xa06a3f;
    public const uint DoorHandle = 0xffd700;
}
