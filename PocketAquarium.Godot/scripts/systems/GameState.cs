using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using PocketAquarium;

namespace PocketAquarium.Systems;

public sealed record PlacedTank(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("col")] int Col,
    [property: JsonPropertyName("row")] int Row,
    [property: JsonPropertyName("w")] int W,
    [property: JsonPropertyName("h")] int H,
    [property: JsonPropertyName("fishSpeciesIds")] IReadOnlyList<string> FishSpeciesIds
);

public sealed record PlacedDecor(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("col")] int Col,
    [property: JsonPropertyName("row")] int Row,
    [property: JsonPropertyName("kind")] DecorKind Kind
);

public sealed record PlacedPath(
    [property: JsonPropertyName("col")] int Col,
    [property: JsonPropertyName("row")] int Row
);

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
    private readonly List<PlacedTank> _tanks = new();
    private readonly List<PlacedDecor> _decor = new();
    private readonly List<PlacedPath> _paths = new();
    private readonly HashSet<string> _caught = new(StringComparer.Ordinal);

    public int Money { get; private set; }
    public int Reputation { get; private set; }
    public int TicketPrice { get; private set; }
    public IReadOnlyList<PlacedTank> Tanks => _tanks;
    public IReadOnlyList<PlacedDecor> Decor => _decor;
    public IReadOnlyList<PlacedPath> Paths => _paths;
    public IReadOnlySet<string> Caught => _caught;
    public BuildTool Tool { get; private set; } = new BuildTool.None();

    public event Action<GameState>? Changed;

    public GameState()
    {
        ApplyState(
            money: 500,
            reputation: 0,
            ticketPrice: GameConstants.DefaultTicketPrice,
            tanks: Array.Empty<PlacedTank>(),
            decor: Array.Empty<PlacedDecor>(),
            paths: Array.Empty<PlacedPath>(),
            caught: Array.Empty<string>(),
            emit: false
        );
    }

    internal GameState(
        int money,
        int reputation,
        int ticketPrice,
        IEnumerable<PlacedTank> tanks,
        IEnumerable<PlacedDecor> decor,
        IEnumerable<PlacedPath> paths,
        IEnumerable<string> caught
    )
    {
        ApplyState(money, reputation, ticketPrice, tanks, decor, paths, caught, emit: false);
    }

    public bool Spend(int amount)
    {
        if (Money < amount)
            return false;

        Money -= amount;
        Emit();
        return true;
    }

    public void Earn(int amount)
    {
        Money += amount;
        Emit();
    }

    public void AddReputation(int amt)
    {
        Reputation = Math.Max(0, Reputation + amt);
        Emit();
    }

    public void RecordCatch(string speciesId)
    {
        if (_caught.Add(speciesId))
            Emit();
    }

    public void AddTank(PlacedTank t)
    {
        _tanks.Add(t);
        Emit();
    }

    public void AddDecor(PlacedDecor d)
    {
        _decor.Add(d);
        Emit();
    }

    public void AddPath(PlacedPath p)
    {
        _paths.Add(p);
        Emit();
    }

    public string? RemoveAt(int col, int row)
    {
        var tankIdx = _tanks.FindIndex(t => Contains(t, col, row));
        if (tankIdx >= 0)
        {
            _tanks.RemoveAt(tankIdx);
            Emit();
            return "tank";
        }

        var decorIdx = _decor.FindIndex(d => d.Col == col && d.Row == row);
        if (decorIdx >= 0)
        {
            _decor.RemoveAt(decorIdx);
            Emit();
            return "decor";
        }

        var pathIdx = _paths.FindIndex(p => p.Col == col && p.Row == row);
        if (pathIdx >= 0)
        {
            _paths.RemoveAt(pathIdx);
            Emit();
            return "path";
        }

        return null;
    }

    public PlacedTank? FindTankAt(int col, int row) =>
        _tanks.FirstOrDefault(t => Contains(t, col, row));

    public void SetTool(BuildTool t)
    {
        Tool = t;
        Emit();
    }

    public void AdjustTicketPrice(int delta) => SetTicketPrice(TicketPrice + delta);

    public void SetTicketPrice(int price)
    {
        TicketPrice = Math.Clamp(price, GameConstants.MinTicketPrice, GameConstants.MaxTicketPrice);
        Emit();
    }

    public void Reset()
    {
        ApplyState(
            money: 500,
            reputation: 0,
            ticketPrice: GameConstants.DefaultTicketPrice,
            tanks: Array.Empty<PlacedTank>(),
            decor: Array.Empty<PlacedDecor>(),
            paths: Array.Empty<PlacedPath>(),
            caught: Array.Empty<string>(),
            emit: true
        );
    }

    private static bool Contains(PlacedTank tank, int col, int row) =>
        col >= tank.Col && col < tank.Col + tank.W && row >= tank.Row && row < tank.Row + tank.H;

    private void ApplyState(
        int money,
        int reputation,
        int ticketPrice,
        IEnumerable<PlacedTank> tanks,
        IEnumerable<PlacedDecor> decor,
        IEnumerable<PlacedPath> paths,
        IEnumerable<string> caught,
        bool emit
    )
    {
        Money = money;
        Reputation = Math.Max(0, reputation);
        TicketPrice = Math.Clamp(ticketPrice, GameConstants.MinTicketPrice, GameConstants.MaxTicketPrice);
        Tool = new BuildTool.None();

        _tanks.Clear();
        _tanks.AddRange(tanks);

        _decor.Clear();
        _decor.AddRange(decor);

        _paths.Clear();
        _paths.AddRange(paths);

        _caught.Clear();
        foreach (var speciesId in caught)
            _caught.Add(speciesId);

        if (emit)
            Emit();
    }

    private void Emit() => Changed?.Invoke(this);
}
