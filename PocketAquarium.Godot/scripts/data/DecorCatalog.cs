using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PocketAquarium;

public enum DecorKind
{
    Plant,
    Rock,
    Tree,
    Bench,
    Flowerbed,
    Fountain
}

public sealed record DecorSpec(
    [property: JsonPropertyName("kind")] DecorKind Kind,
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("cost")] int Cost,
    [property: JsonPropertyName("appeal")] int Appeal,
    [property: JsonPropertyName("scale")] int Scale
);

public static class DecorCatalog
{
    public static readonly IReadOnlyDictionary<DecorKind, DecorSpec> Entries =
        new Dictionary<DecorKind, DecorSpec>
        {
            [DecorKind.Plant] = new(DecorKind.Plant, "plant", 15, 1, 2),
            [DecorKind.Rock] = new(DecorKind.Rock, "rock", 10, 0, 2),
            [DecorKind.Tree] = new(DecorKind.Tree, "tree", 25, 2, 1),
            [DecorKind.Bench] = new(DecorKind.Bench, "bench", 20, 1, 1),
            [DecorKind.Flowerbed] = new(DecorKind.Flowerbed, "flowers", 18, 2, 1),
            [DecorKind.Fountain] = new(DecorKind.Fountain, "fountain", 60, 4, 1),
        };

    public static IEnumerable<DecorSpec> All => Entries.Values;

    public static DecorSpec Get(DecorKind kind) => Entries[kind];

    public static string ToWireName(DecorKind kind) => kind switch
    {
        DecorKind.Plant => "plant",
        DecorKind.Rock => "rock",
        DecorKind.Tree => "tree",
        DecorKind.Bench => "bench",
        DecorKind.Flowerbed => "flowerbed",
        DecorKind.Fountain => "fountain",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown decor kind")
    };

    public static DecorKind FromWireName(string name) => name switch
    {
        "plant" => DecorKind.Plant,
        "rock" => DecorKind.Rock,
        "tree" => DecorKind.Tree,
        "bench" => DecorKind.Bench,
        "flowerbed" => DecorKind.Flowerbed,
        "fountain" => DecorKind.Fountain,
        _ => throw new ArgumentException($"Unknown decor kind: {name}", nameof(name))
    };
}
