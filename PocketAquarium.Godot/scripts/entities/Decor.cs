using Godot;
using PocketAquarium.Systems;

namespace PocketAquarium.Entities;

/// <summary>
/// Visual layer for a <see cref="PlacedDecor"/>. Resolves the matching texture
/// from <see cref="SpriteRegistry"/>, scales per-catalog, and anchors the
/// sprite at the bottom-center of its iso tile so it reads as "standing on"
/// the tile.
/// </summary>
public partial class Decor : Node2D
{
    public PlacedDecor Placement { get; private set; } = null!;

    public static Decor Spawn(Node parent, PlacedDecor placement)
    {
        var node = new Decor { Placement = placement };
        parent.AddChild(node);
        node.Build();
        return node;
    }

    private void Build()
    {
        var spec = DecorCatalog.Get(Placement.Kind);
        var registry = SpriteRegistry.Instance(this);
        var tex = registry.Get($"decor-{DecorCatalog.ToWireName(Placement.Kind)}");
        if (tex == null)
        {
            GD.PushWarning($"[Decor] no texture for {Placement.Kind}");
            return;
        }

        var isoPos = IsoGrid.TileToWorld(Placement.Col, Placement.Row);
        // Anchor Y at the bottom of the tile's diamond — decor "stands on" the tile.
        Position = new Vector2(isoPos.X, isoPos.Y + GameConstants.IsoTileH / 2f);
        ZIndex = (int)IsoGrid.TileDepth(Placement.Col, Placement.Row);

        var sprite = new Sprite2D
        {
            Texture = tex,
            Centered = true,
            Scale = new Vector2(spec.Scale, spec.Scale),
        };
        // Shift sprite up by half its (scaled) height so its bottom sits at
        // this node's position — bottom-center anchor.
        var h = tex.GetHeight() * spec.Scale;
        sprite.Offset = new Vector2(0, -h / 2f);
        AddChild(sprite);
    }
}
