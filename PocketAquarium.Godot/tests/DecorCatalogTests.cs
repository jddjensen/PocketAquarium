using System;
using System.Linq;
using PocketAquarium;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class DecorCatalogTests
{
    [Fact]
    public void EveryKindHasAnEntry()
    {
        foreach (var kind in Enum.GetValues<DecorKind>())
            Assert.True(DecorCatalog.Entries.ContainsKey(kind));
    }

    [Theory]
    [InlineData(DecorKind.Plant, 15, 1)]
    [InlineData(DecorKind.Rock, 10, 0)]
    [InlineData(DecorKind.Tree, 25, 2)]
    [InlineData(DecorKind.Bench, 20, 1)]
    [InlineData(DecorKind.Flowerbed, 18, 2)]
    [InlineData(DecorKind.Fountain, 60, 4)]
    public void CostAndAppealMatchTsVersion(DecorKind kind, int cost, int appeal)
    {
        var spec = DecorCatalog.Get(kind);
        Assert.Equal(cost, spec.Cost);
        Assert.Equal(appeal, spec.Appeal);
    }

    [Fact]
    public void WireNameRoundTrip()
    {
        foreach (var kind in Enum.GetValues<DecorKind>())
        {
            var name = DecorCatalog.ToWireName(kind);
            Assert.Equal(kind, DecorCatalog.FromWireName(name));
        }
    }

    [Fact]
    public void FlowerbedUsesFlowersLabel()
    {
        Assert.Equal("flowers", DecorCatalog.Get(DecorKind.Flowerbed).Label);
    }

    [Fact]
    public void AllPreservesCatalogCount()
    {
        Assert.Equal(Enum.GetValues<DecorKind>().Length, DecorCatalog.All.Count());
    }
}
