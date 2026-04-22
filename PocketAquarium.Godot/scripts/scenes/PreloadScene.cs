using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Godot;
using PocketAquarium.Systems;

namespace PocketAquarium.Scenes;

/// <summary>
/// Preload scene: reads <c>assets/manifest.json</c> and registers every PNG
/// in <see cref="SpriteRegistry"/> before transitioning to Park. Matches the
/// web version's manifest-override pattern.
///
/// Textures discovered in the manifest replace any procedurally-generated
/// fallback with the same key. Missing files log a warning and continue so
/// the game stays playable during asset churn.
/// </summary>
public partial class PreloadScene : Node2D
{
    private sealed record Manifest(
        [property: JsonPropertyName("textures")] Dictionary<string, string>? Textures,
        [property: JsonPropertyName("sheets")] Dictionary<string, object>? Sheets
    );

    public override void _Ready()
    {
        // Generate in-memory textures first so any manifest overrides pointing
        // at the same keys can still win (manifest wins because it runs after).
        ProceduralTextures.RegisterTankTextures(SpriteRegistry.Instance(this));
        LoadManifest();
        GetTree().ChangeSceneToFile("res://scenes/Park.tscn");
    }

    private void LoadManifest()
    {
        var registry = SpriteRegistry.Instance(this);
        const string manifestPath = "res://assets/manifest.json";

        using var file = FileAccess.Open(manifestPath, FileAccess.ModeFlags.Read);
        if (file == null)
        {
            GD.PushWarning($"[Preload] no manifest at {manifestPath}");
            return;
        }

        var json = file.GetAsText();
        Manifest? manifest;
        try
        {
            manifest = JsonSerializer.Deserialize<Manifest>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
        }
        catch (JsonException ex)
        {
            GD.PushError($"[Preload] manifest JSON parse failed: {ex.Message}");
            return;
        }

        if (manifest?.Textures is null)
        {
            GD.Print("[Preload] manifest has no textures block");
            return;
        }

        foreach (var (key, relPath) in manifest.Textures)
        {
            registry.RegisterFromPath(key, $"res://assets/{relPath}");
        }
        GD.Print($"[Preload] registered {registry.Count} textures");
    }
}
