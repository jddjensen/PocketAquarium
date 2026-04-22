using System.Collections.Generic;
using System.Linq;
using PocketAquarium;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class SpeciesTests
{
    [Fact]
    public void AllIsNonEmpty() => Assert.NotEmpty(SpeciesCatalog.All);

    [Fact]
    public void AllPreservesTsOrder()
    {
        Assert.Equal(
            new[]
            {
                "goldie",
                "coralfin",
                "bubbletetra",
                "mossback",
                "sunstripe",
                "kelpkoi",
                "shadowray",
                "emberfin",
                "blueglass",
                "aurorakoi",
            },
            SpeciesCatalog.All.Select(s => s.Id)
        );
    }

    [Fact]
    public void IdsAreUnique()
    {
        var ids = SpeciesCatalog.All.Select(s => s.Id).ToList();
        Assert.Equal(ids.Count, ids.Distinct().Count());
    }

    [Fact]
    public void ByIdReturnsMatching()
    {
        var first = SpeciesCatalog.All[0];
        Assert.Same(first, SpeciesCatalog.ById(first.Id));
    }

    [Fact]
    public void ByIdThrowsOnUnknown()
    {
        Assert.Throws<KeyNotFoundException>(() => SpeciesCatalog.ById("not-a-real-species"));
    }

    [Fact]
    public void UnlockedAtZeroIncludesOnlyZeroRepSpecies()
    {
        var starters = SpeciesCatalog.UnlockedAt(0);
        Assert.All(starters, s => Assert.Equal(0, s.UnlockReputation));
    }

    [Fact]
    public void UnlockedAtHighRepIncludesAll()
    {
        var all = SpeciesCatalog.UnlockedAt(10_000);
        Assert.Equal(SpeciesCatalog.All.Count, all.Count);
    }

    [Fact]
    public void PaletteMatchesShiftedTsValues()
    {
        var goldie = SpeciesCatalog.ById("goldie");
        Assert.Equal(new SpeciesPalette(0xffd166, 0xc3952a, 0xffff98, 0xff6e5b, 0x1a1c2c), goldie.Palette);
    }
}
