import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/database/pocketbase-middleware";
import { getAvailableTokens, checkAndResetDailyTokens } from "@/lib/database/pocketbase-credits";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credits = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(credits);

    const response = {
      totalTokens: credits.totalTokens || 0,
      usedTokens: credits.usedTokens || 0,
      dailyTokens: credits.dailyTokens || 0,
      availableTokens: availableTokens || 0,
      packageId: credits.packageId || null,
      packageExpiry: credits.packageExpiry || null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    // Return a valid JSON response even on error
    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
        totalTokens: 0,
        usedTokens: 0,
        dailyTokens: 0,
        availableTokens: 0,
        packageId: null,
        packageExpiry: null
      },
      { status: 500 }
    );
  }
}
