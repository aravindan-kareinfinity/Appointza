using appointza.Models;
using Xunit;

namespace appointza.Tests
{
    public class OrganisationOnboardingKeysTests
    {
        [Fact]
        public void OfferingKeys_IncludeAllSixBusinessCards()
        {
            Assert.Contains(OnboardingOfferingKeys.Stay, OnboardingOfferingKeys.All);
            Assert.Contains(OnboardingOfferingKeys.Services, OnboardingOfferingKeys.All);
            Assert.Contains(OnboardingOfferingKeys.Events, OnboardingOfferingKeys.All);
            Assert.Contains(OnboardingOfferingKeys.Facilities, OnboardingOfferingKeys.All);
            Assert.Contains(OnboardingOfferingKeys.Classes, OnboardingOfferingKeys.All);
            Assert.Contains(OnboardingOfferingKeys.Other, OnboardingOfferingKeys.All);
            Assert.Equal(6, OnboardingOfferingKeys.All.Count);
        }

        [Fact]
        public void StepKeys_CoverGuidedFlow()
        {
            Assert.Equal("offerings", OnboardingStepKeys.Offerings);
            Assert.Equal("create_items", OnboardingStepKeys.CreateItems);
            Assert.Equal("website", OnboardingStepKeys.Website);
            Assert.Equal("timing", OnboardingStepKeys.Timing);
            Assert.Equal("complete", OnboardingStepKeys.Complete);
        }
    }
}
