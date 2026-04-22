using System;
using PocketAquarium;

namespace PocketAquarium.Systems;

public static class IsoGrid
{
    public static WorldPos TileToWorld(float col, float row) =>
        new(
            GameConstants.IsoOriginX + (col - row) * (GameConstants.IsoTileW / 2f),
            GameConstants.IsoOriginY + (col + row) * (GameConstants.IsoTileH / 2f)
        );

    public static TileCoord WorldToTile(float x, float y) =>
        new(
            (int)Math.Floor(
                ((x - GameConstants.IsoOriginX) / (GameConstants.IsoTileW / 2f)
                    + (y - GameConstants.IsoOriginY) / (GameConstants.IsoTileH / 2f)) / 2f
            ),
            (int)Math.Floor(
                ((y - GameConstants.IsoOriginY) / (GameConstants.IsoTileH / 2f)
                    - (x - GameConstants.IsoOriginX) / (GameConstants.IsoTileW / 2f)) / 2f
            )
        );

    public static float TileDepth(int col, int row) =>
        col + row;

    public static bool InBounds(int col, int row) =>
        col >= 0 && col < GameConstants.GridCols && row >= 0 && row < GameConstants.GridRows;
}
