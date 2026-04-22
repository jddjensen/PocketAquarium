using System;

namespace PocketAquarium.Systems;

public static class WillingnessModel
{
    public const float Base = 3f;
    public const float AppealWeight = 0.5f;
    public const float CrowdSocialBonus = 3f;
    public const float CrowdPenaltySlope = 5f;

    public static float CrowdFactor(int guestCount, int pathCount, int decorCount) =>
        guestCount / (float)Math.Max(6, Math.Floor((pathCount + decorCount * 0.5f) / 2f));

    public static int TotalAppeal(int tankAppeal, int decorAppeal) =>
        tankAppeal + decorAppeal;

    public static float WillingnessToPay(
        int tankAppeal, int decorAppeal,
        int guestCount, int pathCount, int decorCount
    )
    {
        var crowd = CrowdFactor(guestCount, pathCount, decorCount);
        var crowdTerm = crowd <= 1f
            ? crowd * CrowdSocialBonus
            : CrowdSocialBonus - (crowd - 1f) * CrowdPenaltySlope;
        return Base + TotalAppeal(tankAppeal, decorAppeal) * AppealWeight + crowdTerm;
    }

    public static float Demand(
        int tankAppeal, int decorAppeal,
        int guestCount, int pathCount, int decorCount,
        int ticketPrice
    ) => WillingnessToPay(tankAppeal, decorAppeal, guestCount, pathCount, decorCount)
        - ticketPrice;
}
