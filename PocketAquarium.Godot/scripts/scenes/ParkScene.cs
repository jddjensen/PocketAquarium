using Godot;

namespace PocketAquarium.Scenes;

/// <summary>
/// Park scene — the main gameplay view. Renders the iso grid, habitats,
/// decor, and guests. Stub for now; full implementation by Claude after
/// Codex ports the data + systems modules.
/// </summary>
public partial class ParkScene : Node2D
{
    public override void _Ready()
    {
        // TODO: render iso grid using IsoGrid helpers, hydrate placements
        // from GameState, start guest spawn loop.
        GetTree().Root.AddChild(ResourceLoader.Load<PackedScene>("res://scenes/UI.tscn").Instantiate());
    }
}
