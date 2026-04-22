using Godot;

namespace PocketAquarium.Systems;

/// <summary>
/// Godot autoload wrapping the pure-C# <see cref="GameState"/> state container.
/// Exists so scenes can reach <c>GameState</c> via <c>GetNode&lt;GameStateAutoload&gt;("/root/GameState")</c>.
/// The inner state is created by Codex in <c>scripts/systems/GameState.cs</c>;
/// this wrapper just bridges it into Godot's scene tree and persists across scene swaps.
/// </summary>
public partial class GameStateAutoload : Node
{
    // Replace with `public GameState State { get; } = new();` once Codex lands
    // scripts/systems/GameState.cs per specs/06-gamestate.md.
    public override void _Ready()
    {
        GD.Print("[GameStateAutoload] ready");
    }
}
