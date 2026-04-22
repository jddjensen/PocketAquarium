using Godot;
using PocketAquarium.Systems;

namespace PocketAquarium.Scenes;

/// <summary>
/// Canvas-layer UI on top of the Park viewport. First pass renders only the
/// top resource bar + a minimal bottom build bar that lets the player switch
/// tools. Build-menu grid, creature panel, and habitat card come in follow-up
/// passes once the underlying entity types exist.
/// </summary>
public partial class UIScene : CanvasLayer
{
    private Label _moneyLabel = null!;
    private Label _repLabel = null!;
    private Label _priceLabel = null!;
    private Label _demandLabel = null!;
    private Label _toolCaption = null!;

    // --- Colors sourced from the theme so the UI reads as the cream-coral set. ---
    private static readonly Color TextPrimary = new(0.114f, 0.239f, 0.18f);   // deep forest
    private static readonly Color TextGold    = new(0.722f, 0.525f, 0.043f);  // dark gold for money
    private static readonly Color TextOk      = new(0.114f, 0.42f, 0.263f);   // forest green for paying
    private static readonly Color TextCoral   = new(1f, 0.4314f, 0.3569f);    // coral for alert

    public override void _Ready()
    {
        BuildTopBar();
        BuildBottomBar();

        var gs = GameStateAutoload.Instance(this);
        gs.State.Changed += OnStateChanged;
        OnStateChanged(gs.State);
    }

    public override void _ExitTree()
    {
        // Detach from the long-lived autoload's event so the freed UIScene
        // doesn't get called back on subsequent state changes.
        var autoload = GetTree()?.Root.GetNodeOrNull<GameStateAutoload>("GameState");
        if (autoload != null) autoload.State.Changed -= OnStateChanged;
    }

    public override void _Process(double delta)
    {
        var gs = GameStateAutoload.Instance(this);
        var state = gs.State;
        var willingness = WillingnessModel.WillingnessToPay(
            tankAppeal: 0, decorAppeal: DecorAppeal(state),
            guestCount: 0,
            pathCount: state.Paths.Count,
            decorCount: state.Decor.Count
        );
        var pays = willingness >= state.TicketPrice;
        _demandLabel.Text = $"DEMAND ${willingness:F1}";
        _demandLabel.AddThemeColorOverride("font_color", pays ? TextOk : TextCoral);
    }

    private static int DecorAppeal(GameState state)
    {
        var total = 0;
        foreach (var d in state.Decor)
            total += DecorCatalog.Get(d.Kind).Appeal;
        return total;
    }

    private void OnStateChanged(GameState s)
    {
        _moneyLabel.Text = $"${s.Money}";
        _repLabel.Text = $"REP {s.Reputation}";
        _priceLabel.Text = $"${s.TicketPrice}";
        _toolCaption.Text = LabelForTool(s.Tool);
        _toolCaption.Visible = s.Tool is not BuildTool.None;
    }

    private static string LabelForTool(BuildTool t) => t switch
    {
        BuildTool.None => "",
        BuildTool.Path => "path  $5",
        BuildTool.Tank k => $"habitat {k.W}x{k.H}  ${50 * k.W * k.H}",
        BuildTool.Decor d => $"{DecorCatalog.Get(d.Kind).Label}  ${DecorCatalog.Get(d.Kind).Cost}",
        BuildTool.Fish f => $"stock {f.SpeciesId}",
        BuildTool.Erase => "erase (+$2)",
        _ => "",
    };

    // ---------- Top bar ----------

    private void BuildTopBar()
    {
        var top = GetNode<Control>("TopBar");

        var bg = new ColorRect
        {
            Color = new Color(1f, 0.9686f, 0.8824f),
            AnchorRight = 1f,
            AnchorBottom = 1f,
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        top.AddChild(bg);

        _moneyLabel = AddBarLabel(top, x: 4, text: "$0", color: TextGold);
        _repLabel   = AddBarLabel(top, x: 44, text: "REP 0", color: TextOk);

        var minus = AddBarButton(top, x: 84, text: "-", color: TextCoral);
        minus.Pressed += () => GameStateAutoload.Instance(this).State.AdjustTicketPrice(-1);

        _priceLabel = AddBarLabel(top, x: 92, text: "$5", color: TextPrimary);

        var plus = AddBarButton(top, x: 112, text: "+", color: TextOk);
        plus.Pressed += () => GameStateAutoload.Instance(this).State.AdjustTicketPrice(+1);

        _demandLabel = AddBarLabel(top, x: 124, text: "DEMAND $0", color: TextOk);
    }

    // ---------- Bottom bar ----------

    private void BuildBottomBar()
    {
        var bar = GetNode<Control>("BottomBar");
        var bg = new ColorRect
        {
            Color = new Color(1f, 0.9686f, 0.8824f),
            AnchorRight = 1f,
            AnchorBottom = 1f,
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        bar.AddChild(bg);

        _toolCaption = new Label
        {
            Position = new Vector2(4, -10),
            Text = "",
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        _toolCaption.AddThemeColorOverride("font_color", TextPrimary);
        bar.AddChild(_toolCaption);

        var pills = new[]
        {
            (label: "none",  build: (BuildTool)new BuildTool.None()),
            (label: "path",  build: (BuildTool)new BuildTool.Path()),
            (label: "2x2",   build: (BuildTool)new BuildTool.Tank(2, 2)),
            (label: "3x2",   build: (BuildTool)new BuildTool.Tank(3, 2)),
            (label: "4x2",   build: (BuildTool)new BuildTool.Tank(4, 2)),
            (label: "3x3",   build: (BuildTool)new BuildTool.Tank(3, 3)),
            (label: "tree",  build: (BuildTool)new BuildTool.Decor(DecorKind.Tree)),
            (label: "bench", build: (BuildTool)new BuildTool.Decor(DecorKind.Bench)),
            (label: "flwr",  build: (BuildTool)new BuildTool.Decor(DecorKind.Flowerbed)),
            (label: "fntn",  build: (BuildTool)new BuildTool.Decor(DecorKind.Fountain)),
            (label: "erase", build: (BuildTool)new BuildTool.Erase()),
        };
        var x = 3;
        foreach (var (label, tool) in pills)
        {
            var btn = new Button
            {
                Text = label,
                Position = new Vector2(x, 3),
                Size = new Vector2(label.Length * 5 + 10, 10),
            };
            btn.Pressed += () => GameStateAutoload.Instance(this).State.SetTool(tool);
            bar.AddChild(btn);
            x += (int)btn.Size.X + 2;
        }
    }

    // ---------- helpers ----------

    private static Label AddBarLabel(Control parent, int x, string text, Color color)
    {
        var label = new Label
        {
            Position = new Vector2(x, 2),
            Text = text,
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        label.AddThemeColorOverride("font_color", color);
        parent.AddChild(label);
        return label;
    }

    private static Button AddBarButton(Control parent, int x, string text, Color color)
    {
        var btn = new Button
        {
            Position = new Vector2(x, 2),
            Text = text,
            Size = new Vector2(8, 8),
            Flat = true,
        };
        btn.AddThemeColorOverride("font_color", color);
        parent.AddChild(btn);
        return btn;
    }
}
