using Godot;

namespace PocketAquarium.Systems;

/// <summary>
/// Godot autoload that owns the single live <see cref="GameState"/> instance
/// and wires save/load to <c>user://save.json</c>. Scenes reach it via
/// <c>GetNode&lt;GameStateAutoload&gt;("/root/GameState")</c>.
///
/// Saves flush on a fixed 5-second timer and on tree exit.
/// </summary>
public partial class GameStateAutoload : Node
{
    private const float SaveIntervalSeconds = 5f;
    private const string SaveFileName = "save.json";

    private SaveService _saveService = null!;
    private GameState _state = null!;
    private float _saveTimer;

    /// <summary>The live state. Mutate through its methods so events fire.</summary>
    public GameState State => _state;

    public override void _Ready()
    {
        var absPath = ProjectSettings.GlobalizePath($"user://{SaveFileName}");
        _saveService = new SaveService(new SaveService.FileStore(absPath));
        _state = _saveService.Load() ?? new GameState();
        GD.Print($"[GameState] loaded; money={_state.Money} rep={_state.Reputation} tanks={_state.Tanks.Count}");
    }

    public override void _Process(double delta)
    {
        _saveTimer += (float)delta;
        if (_saveTimer >= SaveIntervalSeconds)
        {
            _saveTimer = 0f;
            _saveService.Save(_state);
        }
    }

    public override void _Notification(int what)
    {
        if (what == NotificationWMCloseRequest || what == NotificationPredelete)
        {
            _saveService?.Save(_state);
        }
    }

    /// <summary>Convenience accessor — shorter than casting at every call site.</summary>
    public static GameStateAutoload Instance(Node fromNode) =>
        fromNode.GetNode<GameStateAutoload>("/root/GameState");
}
