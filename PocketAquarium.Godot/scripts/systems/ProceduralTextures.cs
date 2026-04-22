using Godot;

namespace PocketAquarium.Systems;

/// <summary>
/// Ports the procedural pixel-grid generators from the web PreloadScene.ts
/// to Godot's <see cref="Image"/> API. Renders at boot into in-memory
/// <see cref="ImageTexture"/>s and registers them in <see cref="SpriteRegistry"/>.
///
/// One public entry per asset family (tanks today; grass/path/wall later if
/// we decide the PixelLab overrides aren't sufficient).
/// </summary>
public static class ProceduralTextures
{
    /// <summary>
    /// Build both ripple frames (a/b) for every tank footprint we support and
    /// register them under keys <c>tank-WxH-a</c> and <c>tank-WxH-b</c>. Call
    /// once from PreloadScene before Park loads.
    /// </summary>
    public static void RegisterTankTextures(SpriteRegistry registry)
    {
        (int W, int H)[] sizes = { (2, 2), (3, 2), (4, 2), (3, 3), (4, 3) };
        foreach (var (w, h) in sizes)
        {
            registry.Register($"tank-{w}x{h}-a", BuildTankTexture(w, h, 0));
            registry.Register($"tank-{w}x{h}-b", BuildTankTexture(w, h, 1));
        }
    }

    /// <summary>
    /// Iso fenced-habitat rhombus. Outside-in: fence (wood rail + dark posts)
    /// → grass rim → water body with surface ripple sparkle. The ripple
    /// offset shifts by the <paramref name="frame"/> parameter so alternating
    /// frames animate the water.
    /// </summary>
    private static ImageTexture BuildTankTexture(int cols, int rows, int frame)
    {
        int w = (cols + rows) * (GameConstants.IsoTileW / 2);
        int h = (cols + rows) * (GameConstants.IsoTileH / 2);
        var image = Image.CreateEmpty(w, h, false, Image.Format.Rgba8);
        image.Fill(new Color(0, 0, 0, 0));

        // Fence / rim colors
        var fencePost = ColorFromHex(Palette.DoorWoodShade);
        var fenceRail = ColorFromHex(Palette.DoorWood);
        var fenceRailHi = ColorFromHex(Palette.DoorWoodHighlight);
        var grassRim = ColorFromHex(Palette.Grass);
        var grassRimShade = ColorFromHex(Palette.GrassShade);
        // Water
        var water = ColorFromHex(Palette.WaterMid);
        var waterDeep = ColorFromHex(Palette.WaterDeep);
        var waterLight = ColorFromHex(Palette.WaterLight);
        var surface = ColorFromHex(Palette.WaterSurface);
        var surfaceHi = new Color(0xbf / 255f, 0xe7 / 255f, 1f, 1f);

        float cx = w / 2f;
        float cy = h / 2f;

        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                float dx = Mathf.Abs(x + 0.5f - cx) / cx;
                float dy = Mathf.Abs(y + 0.5f - cy) / cy;
                float sum = dx + dy;
                if (sum > 1f) continue; // outside rhombus — leave transparent

                Color c;
                if (sum > 0.92f)
                {
                    // Outer fence band — back edges lit, periodic posts
                    bool back = y < cy;
                    bool postTick = ((x + y) % 6) == 0;
                    c = postTick ? fencePost : (back ? fenceRailHi : fenceRail);
                }
                else if (sum > 0.82f)
                {
                    // Grass rim — subtle speckle
                    bool speckle = ((x * 3 + y * 7) % 11) == 0;
                    c = speckle ? grassRimShade : grassRim;
                }
                else
                {
                    // Water interior
                    bool nearTop = y < cy - cy * 0.4f;
                    if (nearTop)
                    {
                        int rippleOffset = frame == 0 ? 0 : 1;
                        bool isHi = ((x + rippleOffset) % 5) == 0;
                        c = isHi ? surfaceHi : surface;
                    }
                    else
                    {
                        float depth = y / (float)h;
                        var tone = depth > 0.75f ? waterDeep : (depth < 0.45f ? waterLight : water);
                        c = ((x * 5 + y * 3) % 29) == 0 ? waterLight : tone;
                    }
                }

                image.SetPixel(x, y, c);
            }
        }

        return ImageTexture.CreateFromImage(image);
    }

    /// <summary>Convert a <c>0xRRGGBB</c> constant from <see cref="Palette"/> to an opaque Godot Color.</summary>
    private static Color ColorFromHex(uint hex)
    {
        float r = ((hex >> 16) & 0xff) / 255f;
        float g = ((hex >> 8) & 0xff) / 255f;
        float b = (hex & 0xff) / 255f;
        return new Color(r, g, b, 1f);
    }
}
