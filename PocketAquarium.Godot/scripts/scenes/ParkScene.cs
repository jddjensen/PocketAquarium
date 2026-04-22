using System;
using Godot;
using PocketAquarium.Entities;
using PocketAquarium.Systems;

namespace PocketAquarium.Scenes;

/// <summary>
/// Park scene — the gameplay view. Renders the iso grid, the gate-path
/// overlay on the Door tile, and a diamond hover marker that snaps to the
/// tile under the cursor. Placement, entities, and interactions come in
/// follow-up passes; this is the minimum-viable "something visible" pass.
/// </summary>
public partial class ParkScene : Node2D
{
    private Node2D _tileLayer = null!;
    private Node2D _placementLayer = null!;
    private Node2D _entityLayer = null!;
    private Polygon2D _hoverMarker = null!;

    public override void _Ready()
    {
        _tileLayer = GetNode<Node2D>("TileLayer");
        _placementLayer = GetNode<Node2D>("PlacementLayer");
        _entityLayer = GetNode<Node2D>("EntityLayer");
        _hoverMarker = GetNode<Polygon2D>("HoverMarker");
        _hoverMarker.Polygon = IsoDiamondPoints(1, 1);
        _hoverMarker.Visible = false;

        DrawBackdrop();

        // Re-stamp placements from saved state so reloads restore the park.
        RefreshPlacements();

        // Spawn the UI overlay as a child of this scene. CanvasLayer inside a
        // Node2D still renders on its own layer above the game world, and as a
        // child it's freed together with Park on scene change — no orphans.
        var ui = ResourceLoader.Load<PackedScene>("res://scenes/UI.tscn").Instantiate();
        AddChild(ui);
    }

    public override void _Process(double delta)
    {
        var mouse = GetViewport().GetMousePosition();
        var tile = IsoGrid.WorldToTile(mouse.X, mouse.Y);
        if (!IsoGrid.InBounds(tile.Col, tile.Row))
        {
            _hoverMarker.Visible = false;
            return;
        }
        var world = IsoGrid.TileToWorld(tile.Col, tile.Row);
        _hoverMarker.Position = new Vector2(world.X, world.Y - GameConstants.IsoTileH / 2f);
        _hoverMarker.Visible = true;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        // Check the event itself (rather than polling Input state) so we react
        // exactly once per click, even on frames with multiple queued events.
        if (!@event.IsActionPressed("place")) return;
        var mouse = GetViewport().GetMousePosition();
        var tile = IsoGrid.WorldToTile(mouse.X, mouse.Y);
        if (!IsoGrid.InBounds(tile.Col, tile.Row)) return;

        var gs = GameStateAutoload.Instance(this);
        var state = gs.State;
        ApplyTool(state, tile);
    }

    /// <summary>
    /// Dispatch the current tool to the cursor tile. Placement rules mirror
    /// the web version: path can go anywhere in-bounds that isn't already
    /// a path/tank; erase refunds $2; other tools land in follow-up passes.
    /// </summary>
    private void ApplyTool(GameState state, TileCoord tile)
    {
        switch (state.Tool)
        {
            case BuildTool.Path:
                if (PathAt(state, tile) || state.FindTankAt(tile.Col, tile.Row) != null) return;
                if (!state.Spend(5)) return;
                state.AddPath(new PlacedPath(tile.Col, tile.Row));
                StampPathTile(tile);
                break;

            case BuildTool.Decor decor:
                if (PathAt(state, tile) || state.FindTankAt(tile.Col, tile.Row) != null) return;
                foreach (var d in state.Decor)
                    if (d.Col == tile.Col && d.Row == tile.Row) return;
                var spec = DecorCatalog.Get(decor.Kind);
                if (!state.Spend(spec.Cost)) return;
                var placed = new PlacedDecor(Guid.NewGuid().ToString(), tile.Col, tile.Row, decor.Kind);
                state.AddDecor(placed);
                Decor.Spawn(_entityLayer, placed);
                break;

            case BuildTool.Tank tank:
                if (!TankFootprintFree(state, tile, tank.W, tank.H)) return;
                var tankCost = 50 * tank.W * tank.H;
                if (!state.Spend(tankCost)) return;
                var placedTank = new PlacedTank(
                    Guid.NewGuid().ToString(),
                    tile.Col, tile.Row, tank.W, tank.H,
                    System.Array.Empty<string>()
                );
                state.AddTank(placedTank);
                Tank.Spawn(_entityLayer, placedTank);
                break;

            case BuildTool.Erase:
                var kind = state.RemoveAt(tile.Col, tile.Row);
                if (kind != null) state.Earn(2);
                // Re-render everything on erase to avoid orphan sprites.
                // Cheap for now at the small scale; optimize if needed.
                RefreshPlacements();
                break;

            default:
                // Other tools (tank/fish) come in follow-up passes.
                break;
        }
    }

    private static bool PathAt(GameState state, TileCoord tile)
    {
        foreach (var p in state.Paths)
            if (p.Col == tile.Col && p.Row == tile.Row) return true;
        return false;
    }

    /// <summary>
    /// Every tile in the N×M footprint starting at (tile.Col, tile.Row) must be
    /// in-bounds and free of existing placements (path, decor, other tanks, door).
    /// </summary>
    private static bool TankFootprintFree(GameState state, TileCoord tile, int w, int h)
    {
        for (int r = tile.Row; r < tile.Row + h; r++)
        {
            for (int c = tile.Col; c < tile.Col + w; c++)
            {
                if (!IsoGrid.InBounds(c, r)) return false;
                if (c == GameConstants.Door.Col && r == GameConstants.Door.Row) return false;
                if (PathAt(state, new TileCoord(c, r))) return false;
                foreach (var d in state.Decor)
                    if (d.Col == c && d.Row == r) return false;
                if (state.FindTankAt(c, r) != null) return false;
            }
        }
        return true;
    }

    private void StampPathTile(TileCoord tile)
    {
        var registry = SpriteRegistry.Instance(this);
        var path = registry.Get("tile-path");
        if (path == null) return;
        var pos = IsoGrid.TileToWorld(tile.Col, tile.Row);
        var sprite = new Sprite2D
        {
            Texture = path,
            Position = new Vector2(pos.X, pos.Y),
            ZIndex = (int)(IsoGrid.TileDepth(tile.Col, tile.Row) - 500f),
            Centered = true,
        };
        AnchorIsoTile(sprite);
        _placementLayer.AddChild(sprite);
    }

    /// <summary>Wipe and re-stamp every placement (path + decor + tank) from state.</summary>
    private void RefreshPlacements()
    {
        foreach (var child in _placementLayer.GetChildren())
            child.QueueFree();
        foreach (var child in _entityLayer.GetChildren())
            child.QueueFree();

        var gs = GameStateAutoload.Instance(this);
        foreach (var p in gs.State.Paths)
            StampPathTile(new TileCoord(p.Col, p.Row));
        foreach (var d in gs.State.Decor)
            Decor.Spawn(_entityLayer, d);
        foreach (var t in gs.State.Tanks)
            Tank.Spawn(_entityLayer, t);
    }

    /// <summary>
    /// Paint a grass tile under every grid cell, then stamp a path overlay
    /// on the gate. Later phases layer placements / entities on top using
    /// the same IsoGrid.TileDepth ordering.
    /// </summary>
    private void DrawBackdrop()
    {
        var registry = SpriteRegistry.Instance(this);
        var grass = registry.Get("tile-grass");
        if (grass == null)
        {
            GD.PushWarning("[Park] tile-grass texture missing — rendering empty grid");
        }

        for (int r = 0; r < GameConstants.GridRows; r++)
        {
            for (int c = 0; c < GameConstants.GridCols; c++)
            {
                var pos = IsoGrid.TileToWorld(c, r);
                var sprite = new Sprite2D
                {
                    Texture = grass,
                    Position = new Vector2(pos.X, pos.Y),
                    ZIndex = (int)(IsoGrid.TileDepth(c, r) - 1000f),
                    Centered = true,
                };
                AnchorIsoTile(sprite);
                _tileLayer.AddChild(sprite);
            }
        }

        // Gate overlay — sand path tile on the Door cell marks where guests enter.
        var path = registry.Get("tile-path");
        if (path != null)
        {
            var door = GameConstants.Door;
            var pos = IsoGrid.TileToWorld(door.Col, door.Row);
            var sprite = new Sprite2D
            {
                Texture = path,
                Position = new Vector2(pos.X, pos.Y),
                ZIndex = (int)(IsoGrid.TileDepth(door.Col, door.Row) - 900f),
                Centered = true,
            };
            AnchorIsoTile(sprite);
            _tileLayer.AddChild(sprite);
        }
    }

    /// <summary>
    /// Anchor Y for an iso ground tile. Flat 32×16 rhombus textures stay
    /// centered; thick 32×32 iso-block textures (PixelLab output) shift up so
    /// the diamond face sits at iso center and the side face hangs below.
    /// </summary>
    private static void AnchorIsoTile(Sprite2D sprite)
    {
        if (sprite.Texture == null) return;
        var texH = sprite.Texture.GetHeight();
        // Centered sprites pivot at (0.5, 0.5) of the texture. For a thick
        // tile (taller than the diamond), shift the sprite up by (H - ISO_TILE_H)/2
        // so the diamond center aligns with iso center.
        if (texH > GameConstants.IsoTileH)
        {
            var offsetY = (texH - GameConstants.IsoTileH) / 2f;
            sprite.Offset = new Vector2(0, -offsetY);
        }
    }

    /// <summary>
    /// Vertices of the iso diamond covering an N×M tile footprint, anchored
    /// at (0, 0) = rhombus top vertex. Used for the hover marker and
    /// placement previews.
    /// </summary>
    public static Vector2[] IsoDiamondPoints(int cols, int rows)
    {
        float tw = GameConstants.IsoTileW / 2f;
        float th = GameConstants.IsoTileH / 2f;
        return new[]
        {
            new Vector2(cols * tw, 0),
            new Vector2((cols + rows) * tw, rows * th),
            new Vector2(rows * tw, (cols + rows) * th),
            new Vector2(0, cols * th),
        };
    }
}
