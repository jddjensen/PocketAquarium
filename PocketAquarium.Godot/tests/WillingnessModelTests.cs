using PocketAquarium.Systems;
using Xunit;

namespace PocketAquarium.Tests;

public sealed class WillingnessModelTests
{
    [Fact]
    public void EmptyParkUsesBaseWillingness()
    {
        Assert.Equal(WillingnessModel.Base, WillingnessModel.WillingnessToPay(0, 0, 0, 0, 0));
    }

    [Fact]
    public void SingleAppealingHabitatAddsAppealWeight()
    {
        Assert.Equal(8f, WillingnessModel.WillingnessToPay(10, 0, 0, 0, 0));
    }

    [Fact]
    public void SocialBonusKicksInBelowCapacity()
    {
        var willingness = WillingnessModel.WillingnessToPay(0, 0, 3, 12, 0);
        Assert.True(willingness > WillingnessModel.Base);
    }

    [Fact]
    public void OverCapacityPenaltyCanGoNegative()
    {
        var crowd = WillingnessModel.CrowdFactor(12, 0, 0);
        var willingness = WillingnessModel.WillingnessToPay(0, 0, 12, 0, 0);

        Assert.Equal(2f, crowd);
        Assert.True(willingness < WillingnessModel.Base);
    }

    [Fact]
    public void SoftCapNeverDropsBelowSix()
    {
        Assert.Equal(1f, WillingnessModel.CrowdFactor(6, 0, 0));
        Assert.Equal(1f, WillingnessModel.CrowdFactor(6, 1, 1));
    }

    [Fact]
    public void DemandIsWillingnessMinusTicketPrice()
    {
        var willingness = WillingnessModel.WillingnessToPay(3, 2, 1, 10, 0);
        Assert.Equal(willingness - 4, WillingnessModel.Demand(3, 2, 1, 10, 0, 4));
    }
}
