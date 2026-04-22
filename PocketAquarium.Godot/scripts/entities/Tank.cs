using Godot;
using PocketAquarium.Systems;

namespace PocketAquarium.Entities;

/// <summary>
/// A placed habitat. Renders the fenced-pool rhombus texture centered on its
/// footprint's iso geometric center, alternates ripple frames twice a second,
/// and exposes a <see cref="FishBounds"/> rectangle that any fish inside
/// should clamp to.
///
/// Footprint occupies N×M tiles. Depth uses the front-most cell so the tank
/// renders after (on top of) every ground tile it covers.
/// </summary>
public partial class Tank : Node2D
{
    private const float RippleIntervalSeconds = 0.6f;

    public PlacedTank Placement { get; private set; } = null!;

    private Sprite2D _frame = null!;
    private float _rippleTimer;
    private char _rippleFrame = 'a';

    /// <summary>
    /// Axis-aligned rect inscribed in the water region of the pool (the outer
    /// ~18% of the rhombus radius is fence + grass rim). Fish clamp to this.
    /// </summary>
    public Rect2 FishBounds { get; private set; }

    public static Tank Spawn(Node parent, PlacedTank placement)
    {
        var node = new Tank { Placement = placement };
        parent.AddChild(node);
        node.Build();
        return node;
    }

    private void Build()
    {
        // Center of the tank's footprint — half-tile coords allowed for iso projection.
        var center = IsoGrid.TileToWorld(
            Placement.Col + Placement.W / 2f - 0.5f,
            Placement.Row + Placement.H / 2f - 0.5f
        );
        Position = new Vector2(center.X, center.Y);

        // Front-most tile drives depth — tank paints on top of ground tiles it covers.
        var frontCol = Placement.Col + Placement.W - 1;
        var frontRow = Placement.Row + Placement.H - 1;
        ZIndex = (int)IsoGrid.TileDepth(frontCol, frontRow);

        var registry = SpriteRegistry.Instance(this);
        var key = $"tank-{Placement.W}x{Placement.H}-a";
        var tex = registry.Get(key);
        if (tex == null)
        {
            GD.PushWarning($"[Tank] texture '{key}' missing");
            return;
        }

        _frame = new Sprite2D { Texture = tex, Centered = true };
        AddChild(_frame);

        // Inscribed rect inside the water region (outer ~18% is fence + grass).
        float rhombusW = (Placement.W + Placement.H) * (GameConstants.IsoTileW / 2f);
        float rhombusH = (Placement.W + Placement.H) * (GameConstants.IsoTileH / 2f);
        float innerW = rhombusW * 0.41f;
        float innerH = rhombusH * 0.41f;
        FishBounds = new Rect2(
            center.X - innerW / 2f + 2f,
            center.Y - innerH / 2f + 2f,
            innerW - 4f,
            innerH - 4f
        );
    }

    public override void _Process(double delta)
    {
        _rippleTimer += (float)delta;
        if (_rippleTimer < RippleIntervalSeconds) return;
        _rippleTimer = 0f;
        _rippleFrame = _rippleFrame == 'a' ? 'b' : 'a';
        var registry = SpriteRegistry.Instance(this);
        var tex = registry.Get($"tank-{Placement.W}x{Placement.H}-{_rippleFrame}");
        if (tex != null) _frame.Texture = tex;
    }

    /// <summary>True if the tile at (col, row) is inside this tank's footprint.</summary>
    public bool Contains(int col, int row) =>
        col >= Placement.Col && col < Placement.Col + Placement.W &&
        row >= Placement.Row && row < Placement.Row + Placement.H;
}
