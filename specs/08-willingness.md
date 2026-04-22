# Spec 08: WillingnessModel

## Goal

The economic model that converts park state (appeal + crowd) into a willingness-to-pay value. Drives demand / guest spawn rate.

## Reference

`archive/web-v1` branch: `src/scenes/ParkScene.ts` — methods `totalAppeal`, `crowdFactor`, `willingnessToPay`, `demand`, and the constants at the top of the file.

## Output

File: `PocketAquarium.Godot/scripts/systems/WillingnessModel.cs`
Namespace: `PocketAquarium.Systems`

```csharp
public static class WillingnessModel
{
    public const float Base = 3f;
    public const float AppealWeight = 0.5f;
    public const float CrowdSocialBonus = 3f;
    public const float CrowdPenaltySlope = 5f;

    /// <summary>
    /// Crowd factor: guestCount / softCap. 1.0 = pleasant, >1 = over capacity.
    /// softCap = max(6, floor((pathCount + decorCount * 0.5) / 2)).
    /// </summary>
    public static float CrowdFactor(int guestCount, int pathCount, int decorCount);

    /// <summary>
    /// Total park appeal (tank appeal + decor appeal). Takes pre-computed sums
    /// from the caller to keep this module independent of game entities.
    /// </summary>
    public static int TotalAppeal(int tankAppeal, int decorAppeal);

    /// <summary>
    /// Willingness-to-pay: Base + appeal * AppealWeight + crowdTerm where
    /// crowdTerm = crowd <= 1 ? crowd * CrowdSocialBonus
    ///                        : CrowdSocialBonus - (crowd - 1) * CrowdPenaltySlope.
    /// </summary>
    public static float WillingnessToPay(
        int tankAppeal, int decorAppeal,
        int guestCount, int pathCount, int decorCount
    );

    /// <summary>Willingness minus current ticket price. Positive → demand.</summary>
    public static float Demand(
        int tankAppeal, int decorAppeal,
        int guestCount, int pathCount, int decorCount,
        int ticketPrice
    );
}
```

## Behavior

- Constants match TS values exactly.
- CrowdFactor softCap formula: `max(6, floor((pathCount + decorCount * 0.5) / 2))`. Decor counts HALF as much as path tiles toward the cap.
- WillingnessToPay uses the piecewise crowdTerm from TS.
- No Godot imports.

## Tests

File: `PocketAquarium.Godot/tests/WillingnessModelTests.cs`

- Empty park: appeal=0, guests=0 → WillingnessToPay == Base (3).
- Single appealing habitat: appeal=10, others 0 → Base + 5 = 8.
- Social bonus kicks in: crowd < 1 gives positive term.
- Over-capacity penalty: crowd = 2 gives negative crowdTerm.
- softCap never drops below 6.
- Demand = WillingnessToPay - ticketPrice.
