using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using PocketAquarium;

namespace PocketAquarium.Systems;

public sealed record SaveData(
    [property: JsonPropertyName("version")] int Version,
    [property: JsonPropertyName("money")] int Money,
    [property: JsonPropertyName("reputation")] int Reputation,
    [property: JsonPropertyName("tanks")] IReadOnlyList<PlacedTank>? Tanks,
    [property: JsonPropertyName("decor")] IReadOnlyList<PlacedDecor>? Decor,
    [property: JsonPropertyName("paths")] IReadOnlyList<PlacedPath>? Paths,
    [property: JsonPropertyName("caught")] IReadOnlyList<string>? Caught,
    [property: JsonPropertyName("ticketPrice")] int? TicketPrice
);

public sealed class SaveService
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();
    private readonly IStore _store;

    public interface IStore
    {
        string? Read();
        void Write(string json);
    }

    public sealed class MemoryStore : IStore
    {
        private string? _buf;
        public string? Read() => _buf;
        public void Write(string json) => _buf = json;
    }

    public sealed class FileStore : IStore
    {
        private readonly string _path;
        public FileStore(string absolutePath) => _path = absolutePath;
        public string? Read() => File.Exists(_path) ? File.ReadAllText(_path) : null;

        public void Write(string json)
        {
            var directory = Path.GetDirectoryName(_path);
            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(_path, json);
        }
    }

    public SaveService(IStore store) => _store = store;

    public void Save(GameState state)
    {
        var data = new SaveData(
            Version: 2,
            Money: state.Money,
            Reputation: state.Reputation,
            Tanks: state.Tanks,
            Decor: state.Decor,
            Paths: state.Paths,
            Caught: new List<string>(state.Caught),
            TicketPrice: state.TicketPrice
        );

        _store.Write(JsonSerializer.Serialize(data, JsonOptions));
    }

    public GameState? Load()
    {
        try
        {
            var raw = _store.Read();
            if (string.IsNullOrWhiteSpace(raw))
                return null;

            var data = JsonSerializer.Deserialize<SaveData>(raw, JsonOptions);
            if (data is null || data.Version != 2)
                return null;

            return new GameState(
                data.Money,
                data.Reputation,
                data.TicketPrice ?? GameConstants.DefaultTicketPrice,
                data.Tanks ?? Array.Empty<PlacedTank>(),
                data.Decor ?? Array.Empty<PlacedDecor>(),
                data.Paths ?? Array.Empty<PlacedPath>(),
                data.Caught ?? Array.Empty<string>()
            );
        }
        catch (Exception ex) when (
            ex is JsonException ||
            ex is NotSupportedException ||
            ex is ArgumentException ||
            ex is IOException
        )
        {
            return null;
        }
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
        };
        options.Converters.Add(new DecorKindJsonConverter());
        return options;
    }

    private sealed class DecorKindJsonConverter : JsonConverter<DecorKind>
    {
        public override DecorKind Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options
        )
        {
            var name = reader.GetString();
            if (name is null)
                throw new JsonException("Decor kind must be a string.");

            return DecorCatalog.FromWireName(name);
        }

        public override void Write(
            Utf8JsonWriter writer,
            DecorKind value,
            JsonSerializerOptions options
        ) => writer.WriteStringValue(DecorCatalog.ToWireName(value));
    }
}
