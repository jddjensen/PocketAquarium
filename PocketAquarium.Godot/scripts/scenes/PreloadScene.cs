using Godot;

namespace PocketAquarium.Scenes;

/// <summary>
/// Preload scene — loads the manifest and registers sprite textures with the
/// SpriteRegistry autoload so Park/UI can look up textures by key.
/// Stub for now; actual asset loading implemented by Claude.
/// </summary>
public partial class PreloadScene : Node2D
{
    public override void _Ready()
    {
        // TODO: load assets/manifest.json, register every PNG in SpriteRegistry,
        // then transition to Park + UI.
        GetTree().ChangeSceneToFile("res://scenes/Park.tscn");
    }
}
