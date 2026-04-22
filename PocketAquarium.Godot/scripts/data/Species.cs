using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace PocketAquarium;

public enum Rarity { Common, Uncommon, Rare, Epic, Legendary }
public enum FishSize { Small, Medium, Large }

public sealed record SpeciesPalette(
    [property: JsonPropertyName("base")] uint Base,
    [property: JsonPropertyName("shadow")] uint Shadow,
    [property: JsonPropertyName("highlight")] uint Highlight,
    [property: JsonPropertyName("fin")] uint Fin,
    [property: JsonPropertyName("eye")] uint Eye
);

public sealed record Species(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("price")] int Price,
    [property: JsonPropertyName("appeal")] int Appeal,
    [property: JsonPropertyName("rarity")] Rarity Rarity,
    [property: JsonPropertyName("size")] FishSize Size,
    [property: JsonPropertyName("unlockReputation")] int UnlockReputation,
    [property: JsonPropertyName("palette")] SpeciesPalette Palette
);

public static class SpeciesCatalog
{
    public static readonly IReadOnlyList<Species> All = new List<Species>
    {
        new(
            "goldie",
            "Goldie",
            20,
            1,
            Rarity.Common,
            FishSize.Small,
            0,
            new SpeciesPalette(0xffd166, 0xc3952a, 0xffff98, 0xff6e5b, 0x1a1c2c)
        ),
        new(
            "coralfin",
            "Coralfin",
            35,
            2,
            Rarity.Common,
            FishSize.Small,
            0,
            new SpeciesPalette(0xff6e5b, 0xc3321f, 0xffa08d, 0xffd166, 0x1a1c2c)
        ),
        new(
            "bubbletetra",
            "Bubbletetra",
            50,
            2,
            Rarity.Common,
            FishSize.Small,
            12,
            new SpeciesPalette(0x2ea7a1, 0x006b65, 0x60d9d3, 0xffd166, 0x1a1c2c)
        ),
        new(
            "mossback",
            "Mossback",
            85,
            4,
            Rarity.Uncommon,
            FishSize.Medium,
            30,
            new SpeciesPalette(0x27b26a, 0x00762e, 0x59e49c, 0x1d3d2e, 0x1a1c2c)
        ),
        new(
            "sunstripe",
            "Sunstripe",
            120,
            5,
            Rarity.Uncommon,
            FishSize.Small,
            55,
            new SpeciesPalette(0xffd166, 0xc3952a, 0xffff98, 0x4cc98b, 0x1a1c2c)
        ),
        new(
            "kelpkoi",
            "Kelpkoi",
            165,
            7,
            Rarity.Uncommon,
            FishSize.Medium,
            85,
            new SpeciesPalette(0x4cc98b, 0x108d4f, 0x7efbbd, 0xffd166, 0x1a1c2c)
        ),
        new(
            "shadowray",
            "Shadowray",
            240,
            10,
            Rarity.Rare,
            FishSize.Large,
            125,
            new SpeciesPalette(0xc9527e, 0x8d1642, 0xfb84b0, 0x6db7ff, 0x1a1c2c)
        ),
        new(
            "emberfin",
            "Emberfin",
            320,
            13,
            Rarity.Rare,
            FishSize.Medium,
            175,
            new SpeciesPalette(0xff6e5b, 0xc3321f, 0xffa08d, 0xc9527e, 0x1a1c2c)
        ),
        new(
            "blueglass",
            "Blueglass",
            430,
            16,
            Rarity.Rare,
            FishSize.Small,
            235,
            new SpeciesPalette(0x9fd4ff, 0x6398c3, 0xd1ffff, 0x1d6b6b, 0x1a1c2c)
        ),
        new(
            "aurorakoi",
            "Aurorakoi",
            700,
            24,
            Rarity.Legendary,
            FishSize.Large,
            320,
            new SpeciesPalette(0x9fd4ff, 0x6398c3, 0xd1ffff, 0xc9527e, 0x1a1c2c)
        ),
    };

    private static readonly IReadOnlyDictionary<string, Species> ByIdLookup =
        All.ToDictionary(s => s.Id, StringComparer.Ordinal);

    public static Species ById(string id) => ByIdLookup[id];

    public static IReadOnlyList<Species> UnlockedAt(int reputation) =>
        All.Where(s => s.UnlockReputation <= reputation).ToList();
}
