# Pocket Aquarium

A pixel-art isometric park sanctuary sim — build habitats, attract guests, care for creatures. Inspired by safari park tycoon games in style, with the creature-collecting depth of Pokémon.

> **v2.0 rewrite in progress.** The original web version (Phaser 3 / TypeScript)
> lives on branch [`archive/web-v1`](../../tree/archive/web-v1). The main branch
> is a ground-up port to **Godot 4 + C#**, targeting native Mac and Windows
> builds.

## Stack

- **Engine:** Godot 4.3 with .NET 8 / C# 12
- **Tests:** xUnit against pure-C# logic modules (no Godot runtime in CI)
- **Asset pipeline:** Python + PixelLab-generated sprites
- **Targets:** macOS `.app`, Windows `.exe`

## Getting started

See [CLAUDE.md](CLAUDE.md) for the full project layout, build commands, and
conventions. Quick start:

```bash
# Install Godot 4.3 with .NET support from https://godotengine.org/download
# Install .NET 8 SDK from https://dotnet.microsoft.com/download

cd PocketAquarium.Godot
dotnet restore
dotnet test tests/PocketAquarium.Tests.csproj   # run logic tests

# Open the editor
open -a Godot PocketAquarium.Godot/project.godot    # macOS
```

## Project structure

```
PocketAquarium.Godot/       Godot 4 / .NET 8 project
  scenes/                   .tscn scene files
  scripts/                  C# source (entities, systems, data, scenes)
  assets/                   PNG sprites + manifest
  tests/                    xUnit test project

specs/                      Written specs driving Codex contributions.
                            See specs/README.md.

CLAUDE.md                   Conventions, build commands, architecture notes.
CREDITS.md                  Art attribution (PixelLab generations).
```

## Development model

This repository is co-maintained by two AI agents with a clear split:

- **Claude** owns architecture decisions, scene graph, rendering, entity
  behavior, and UI layout.
- **Codex** owns pure-data ports, testable systems modules, the asset pipeline,
  and CI wiring — each task written up in [specs/](specs/) with exact
  signatures and xUnit tests it must satisfy.

If you're contributing: pick a spec, implement against its contract, make
`dotnet test` pass, open a PR.
