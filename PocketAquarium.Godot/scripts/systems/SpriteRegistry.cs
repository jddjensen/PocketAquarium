using System.Collections.Generic;
using Godot;

namespace PocketAquarium.Systems;

/// <summary>
/// Autoload mapping manifest-style texture keys (<c>tile-grass</c>,
/// <c>decor-tree</c>, <c>guest-down-0</c>) to loaded <see cref="Texture2D"/>s.
/// Scenes resolve textures via <c>SpriteRegistry.Get(key)</c> instead of
/// hardcoded resource paths, so a manifest swap changes art without code.
/// </summary>
public partial class SpriteRegistry : Node
{
    private readonly Dictionary<string, Texture2D> _textures = new();

    /// <summary>Load and register a PNG from a res:// path.</summary>
    public void RegisterFromPath(string key, string resPath)
    {
        var tex = ResourceLoader.Load<Texture2D>(resPath);
        if (tex == null)
        {
            GD.PushWarning($"[SpriteRegistry] could not load {resPath} for key '{key}'");
            return;
        }
        _textures[key] = tex;
    }

    public void Register(string key, Texture2D texture) => _textures[key] = texture;

    /// <summary>Returns the texture for the key, or null if unregistered.</summary>
    public Texture2D? Get(string key) => _textures.TryGetValue(key, out var t) ? t : null;

    public bool Has(string key) => _textures.ContainsKey(key);

    public int Count => _textures.Count;

    public static SpriteRegistry Instance(Node fromNode) =>
        fromNode.GetNode<SpriteRegistry>("/root/SpriteRegistry");
}
