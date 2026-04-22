# Spec 10: CI workflow

## Goal

GitHub Actions pipeline that runs on every PR and push to main. Fails the build if tests fail or the asset manifest is broken.

## Output

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  dotnet-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x

      - name: Restore
        working-directory: PocketAquarium.Godot
        run: dotnet restore

      - name: Build (tests project only — game project needs Godot SDK)
        working-directory: PocketAquarium.Godot
        run: dotnet build tests/PocketAquarium.Tests.csproj

      - name: Test
        working-directory: PocketAquarium.Godot
        run: dotnet test tests/PocketAquarium.Tests.csproj --no-build --verbosity normal

  asset-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Validate manifest
        run: python scripts/build_assets.py --check-dims
```

## Behavior

- Two independent jobs run in parallel.
- `dotnet-tests` builds only the test project, not the Godot game project (the Godot SDK isn't trivially available in CI without extra setup; getting tests running is the important part for now).
- `asset-validation` requires spec 09's script to exist.
- No secrets required.

## Tests

Manual: open a PR with a failing test and confirm CI blocks merge. No automated meta-test.
