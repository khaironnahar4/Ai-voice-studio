// Run this once after creating products in the Stripe dashboard.
// npx tsx scripts/seed-plans.ts

import prisma  from "@/lib/auth/prisma";

await prisma.plan.createMany({
  skipDuplicates: true,
  data: [
    {
      name:                 "Free",
      slug:                 "free",
      description:          "Get started — no credit card required.",
      priceMonthly:         0,
      priceYearly:          0,
      charLimitMonthly:     BigInt(10000),
      requestLimitMonthly:  20,
      storageLimitMb:       100,
      maxFileDurationSec:   60,
      concurrentJobs:       1,
      hasPremiumVoices:     false,
      hasApiAccess:         false,
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId:  null,
      isActive:             true,
    },
    {
      name:                 "Pro",
      slug:                 "pro",
      description:          "For creators and professionals.",
      priceMonthly:         1200,   // $12.00
      priceYearly:          9600,   // $96.00 (2 months free)
      charLimitMonthly:     BigInt(100000),
      requestLimitMonthly:  500,
      storageLimitMb:       2048,
      maxFileDurationSec:   300,
      concurrentJobs:       3,
      hasPremiumVoices:     true,
      hasApiAccess:         false,
      stripeMonthlyPriceId: "price_xxx_pro_monthly",   // replace
      stripeYearlyPriceId:  "price_xxx_pro_yearly",    // replace
      isActive:             true,
    },
    {
      name:                 "Business",
      slug:                 "business",
      description:          "For teams and power users.",
      priceMonthly:         3900,
      priceYearly:          31200,
      charLimitMonthly:     BigInt(500000),
      requestLimitMonthly:  null,   // unlimited
      storageLimitMb:       null,
      maxFileDurationSec:   null,
      concurrentJobs:       10,
      hasPremiumVoices:     true,
      hasApiAccess:         true,
      stripeMonthlyPriceId: "price_xxx_biz_monthly",
      stripeYearlyPriceId:  "price_xxx_biz_yearly",
      isActive:             true,
    },
  ],
});

console.log("Plans seeded.");