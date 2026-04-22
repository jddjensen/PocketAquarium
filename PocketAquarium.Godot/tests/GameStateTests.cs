using System.Collections.Generic;
using PocketAquarium;
using PocketAquarium.Systems;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class GameStateTests
{
    [Fact]
    public void DefaultMoneyIs500()
    {
        Assert.Equal(500, new GameState().Money);
    }

    [Fact]
    public void SpendReturnsFalseAndDoesNotDeductWhenInsufficient()
    {
        var state = new GameState();
        var changed = 0;
        state.Changed += _ => changed++;

        Assert.False(state.Spend(999));
        Assert.Equal(500, state.Money);
        Assert.Equal(0, changed);
    }

    [Fact]
    public void SpendDeductsAndFiresChangedOnSuccess()
    {
        var state = new GameState();
        var changed = 0;
        state.Changed += _ => changed++;

        Assert.True(state.Spend(125));
        Assert.Equal(375, state.Money);
        Assert.Equal(1, changed);
    }

    [Fact]
    public void AddReputationClampsToZero()
    {
        var state = new GameState();
        state.AddReputation(-999);
        Assert.Equal(0, state.Reputation);
    }

    [Fact]
    public void RemoveAtUsesTankDecorPathPriority()
    {
        var state = new GameState();
        state.AddPath(new PlacedPath(1, 1));
        state.AddDecor(new PlacedDecor("decor", 1, 1, DecorKind.Plant));
        state.AddTank(new PlacedTank("tank", 1, 1, 2, 2, new List<string>()));

        Assert.Equal("tank", state.RemoveAt(1, 1));
        Assert.Equal("decor", state.RemoveAt(1, 1));
        Assert.Equal("path", state.RemoveAt(1, 1));
        Assert.Null(state.RemoveAt(1, 1));
    }

    [Fact]
    public void SetTicketPriceClampsToMaxTicketPrice()
    {
        var state = new GameState();
        state.SetTicketPrice(100);
        Assert.Equal(GameConstants.MaxTicketPrice, state.TicketPrice);
    }

    [Fact]
    public void RecordCatchSameSpeciesTwiceFiresChangedOnce()
    {
        var state = new GameState();
        var changed = 0;
        state.Changed += _ => changed++;

        state.RecordCatch("goldie");
        state.RecordCatch("goldie");

        Assert.Contains("goldie", state.Caught);
        Assert.Equal(1, changed);
    }

    [Fact]
    public void ChangedEventFiresOnStateChangingMethods()
    {
        var state = new GameState();
        var changed = 0;
        state.Changed += _ => changed++;

        state.Earn(5);
        state.AddReputation(1);
        state.AddTank(new PlacedTank("tank", 0, 0, 1, 1, new List<string>()));
        state.AddDecor(new PlacedDecor("decor", 2, 2, DecorKind.Bench));
        state.AddPath(new PlacedPath(3, 3));
        state.SetTool(new BuildTool.Erase());
        state.AdjustTicketPrice(1);
        state.Reset();

        Assert.Equal(8, changed);
    }

    [Fact]
    public void FindTankAtSearchesFootprint()
    {
        var state = new GameState();
        var tank = new PlacedTank("tank", 2, 3, 2, 2, new List<string>());
        state.AddTank(tank);

        Assert.Equal(tank, state.FindTankAt(3, 4));
        Assert.Null(state.FindTankAt(4, 4));
    }
}
