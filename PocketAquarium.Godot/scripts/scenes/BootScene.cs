using Godot;

namespace PocketAquarium.Scenes;

/// <summary>
/// Boot scene — the first scene Godot loads. Responsibilities:
///   1. Render the app icon / splash briefly (optional, skip for now)
///   2. Jump to Preload where asset loading happens
/// Kept deliberately thin — any state or config bootstrap goes in the
/// GameState autoload (runs before any scene).
/// </summary>
public partial class BootScene : Node2D
{
    public override void _Ready()
    {
        GetTree().ChangeSceneToFile("res://scenes/Preload.tscn");
    }
}
