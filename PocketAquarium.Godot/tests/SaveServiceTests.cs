using System;
using System.Collections.Generic;
using System.Linq;
using PocketAquarium;
using PocketAquarium.Systems;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class SaveServiceTests
{
    [Fact]
    public void DefaultStateRoundTrips()
    {
        var store = new SaveService.MemoryStore();
        var service = new SaveService(store);
        var state = new GameState();

        service.Save(state);
        var loaded = service.Load();

        Assert.NotNull(loaded);
        Assert.Equal(state.Money, loaded.Money);
        Assert.Equal(state.Reputation, loaded.Reputation);
        Assert.Equal(state.TicketPrice, loaded.TicketPrice);
        Assert.Equal(new BuildTool.None(), loaded.Tool);
    }

    [Fact]
    public void PopulatedStateRoundTrips()
    {
        var store = new SaveService.MemoryStore();
        var service = new SaveService(store);
        var state = new GameState();

        state.Spend(50);
        state.AddReputation(42);
        state.SetTicketPrice(12);
        state.AddTank(new PlacedTank("tank-1", 3, 2, 2, 2, new[] { "goldie" }));
        foreach (var kind in Enum.GetValues<DecorKind>())
            state.AddDecor(new PlacedDecor($"decor-{kind}", (int)kind, 4, kind));
        state.AddPath(new PlacedPath(5, 6));
        state.AddPath(new PlacedPath(5, 5));
        state.RecordCatch("goldie");
        state.RecordCatch("coralfin");

        service.Save(state);
        var loaded = service.Load();

        Assert.NotNull(loaded);
        Assert.Equal(450, loaded.Money);
        Assert.Equal(42, loaded.Reputation);
        Assert.Equal(12, loaded.TicketPrice);
        Assert.Single(loaded.Tanks);
        Assert.Equal(state.Tanks[0].Id, loaded.Tanks[0].Id);
        Assert.Equal(state.Tanks[0].Col, loaded.Tanks[0].Col);
        Assert.Equal(state.Tanks[0].Row, loaded.Tanks[0].Row);
        Assert.Equal(state.Tanks[0].W, loaded.Tanks[0].W);
        Assert.Equal(state.Tanks[0].H, loaded.Tanks[0].H);
        Assert.Equal(state.Tanks[0].FishSpeciesIds, loaded.Tanks[0].FishSpeciesIds);
        Assert.Equal(state.Decor, loaded.Decor);
        Assert.Equal(state.Paths, loaded.Paths);
        Assert.Equal(state.Caught.OrderBy(x => x), loaded.Caught.OrderBy(x => x));
        Assert.Contains("\"kind\":\"plant\"", store.Read());
    }

    [Fact]
    public void MemoryStoreInstancesDoNotShareData()
    {
        var a = new SaveService.MemoryStore();
        var b = new SaveService.MemoryStore();

        a.Write("{\"version\":2}");

        Assert.NotNull(a.Read());
        Assert.Null(b.Read());
    }

    [Fact]
    public void MalformedJsonReturnsNull()
    {
        var store = new SaveService.MemoryStore();
        store.Write("{not json");

        Assert.Null(new SaveService(store).Load());
    }

    [Fact]
    public void EmptyStoreReturnsNull()
    {
        Assert.Null(new SaveService(new SaveService.MemoryStore()).Load());
    }

    [Fact]
    public void MissingTicketPriceUsesDefault()
    {
        var store = new SaveService.MemoryStore();
        store.Write(
            """
            {
              "version": 2,
              "money": 123,
              "reputation": 7,
              "tanks": [],
              "decor": [],
              "paths": [],
              "caught": []
            }
            """
        );

        var loaded = new SaveService(store).Load();

        Assert.NotNull(loaded);
        Assert.Equal(GameConstants.DefaultTicketPrice, loaded.TicketPrice);
    }

    [Fact]
    public void VersionOneReturnsNull()
    {
        var store = new SaveService.MemoryStore();
        store.Write("""{"version":1,"money":500,"reputation":0,"tanks":[],"decor":[],"paths":[],"caught":[]}""");

        Assert.Null(new SaveService(store).Load());
    }
}
