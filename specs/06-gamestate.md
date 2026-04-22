# Spec 06: GameState

## Goal

Pure-C# state container. Holds money, reputation, placements, current tool, and notifies listeners on change.

## Reference

`archive/web-v1` branch: `src/systems/GameState.ts`. Port the class verbatim behavior-wise, C# idioms.

## Output

File: `PocketAquarium.Godot/scripts/systems/GameState.cs`
Namespace: `PocketAquarium.Systems`

```csharp
public sealed record PlacedTank(
    string Id,
    int Col,
    int Row,
    int W,
    int H,
    IReadOnlyList<string> FishSpeciesIds
);

public sealed record PlacedDecor(
    string Id,
    int Col,
    int Row,
    DecorKind Kind
);

public sealed record PlacedPath(int Col, int Row);

public abstract record BuildTool
{
    public sealed record None() : BuildTool;
    public sealed record Path() : BuildTool;
    public sealed record Tank(int W, int H) : BuildTool;
    public sealed record Decor(DecorKind Kind) : BuildTool;
    public sealed record Fish(string SpeciesId) : BuildTool;
    public sealed record Erase() : BuildTool;
}

public sealed class GameState
{
    public int Money { get; private set; }
    public int Reputation { get; private set; }
    public int TicketPrice { get; private set; }
    public IReadOnlyList<PlacedTank> Tanks { get; }
    public IReadOnlyList<PlacedDecor> Decor { get; }
    public IReadOnlyList<PlacedPath> Paths { get; }
    public IReadOnlySet<string> Caught { get; }
    public BuildTool Tool { get; private set; }

    public event Action<GameState>? Changed;

    public GameState(); // defaults: $500, 0 rep, DefaultTicketPrice

    public bool Spend(int amount);     // returns false if broke
    public void Earn(int amount);
    public void AddReputation(int amt); // never negative
    public void RecordCatch(string speciesId);
    public void AddTank(PlacedTank t);
    public void AddDecor(PlacedDecor d);
    public void AddPath(PlacedPath p);
    public string? RemoveAt(int col, int row); // returns "tank" | "decor" | "path" | null
    public PlacedTank? FindTankAt(int col, int row);
    public void SetTool(BuildTool t);
    public void AdjustTicketPrice(int delta);
    public void SetTicketPrice(int price);
    public void Reset();
}
```

## Behavior

Match the TS `GameState` class methods exactly:

- `Spend`: if `Money < amount` return false without mutation; else deduct and fire Changed.
- `RemoveAt`: priority tank → decor → path. Return the kind string of what was removed, or null.
- `SetTicketPrice`: clamps into `[MinTicketPrice, MaxTicketPrice]` and rounds.
- `AdjustTicketPrice`: calls `SetTicketPrice(current + delta)`.
- Every mutation that changes state fires `Changed`.
- `RecordCatch` only fires Changed if the species id is new.
- `Reset`: restores defaults. Does NOT fire Changed from constructor but does from Reset.

No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/GameStateTests.cs`

Cover:
- Default money is 500.
- `Spend` returns false and does not deduct when insufficient.
- `Spend` deducts and fires Changed on success.
- `AddReputation(-999)` clamps to 0.
- `RemoveAt` priority order (tank > decor > path) with overlapping placements.
- `SetTicketPrice(100)` clamps to MaxTicketPrice.
- `RecordCatch` same species twice fires Changed once.
- Changed event fires on each state-changing method.
