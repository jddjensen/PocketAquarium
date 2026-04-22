using System.Collections.Generic;
using Godot;

namespace PocketAquarium.Systems;

/// <summary>
/// Autoload mapping manifest-style texture keys (<c>tile-grass</c>,
/// <c>decor-tree</c>, <c>guest-down-0</c>) to loaded <see cref="Texture2D"/>s.
/// Scenes resolve textures via <c>SpriteRegistry.Get("tile-grass")</c> instead
/// of hardcoded resource paths, so a manifest swap changes art without code.
/// </summary>
public partial class SpriteRegistry : Node
{
    private readonly Dictionary<string, Texture2D> _textures = new();

    public void Register(string key, Texture2D texture) => _textures[key] = texture;

    public Texture2D? Get(string key) => _textures.TryGetValue(key, out var t) ? t : null;

    public bool Has(string key) => _textures.ContainsKey(key);
}
