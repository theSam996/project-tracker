"use server";

import { getCurrentUser } from "@/lib/session";
import { globalSearch, GlobalSearchResults } from "@/server/queries/search.queries";
import { checkRateLimit } from "@/lib/rate-limit";

export async function searchGlobalAction(query: string): Promise<{
  success: boolean;
  data?: GlobalSearchResults;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Authentication required to search.",
    };
  }

  // Rate limiting: 45 search requests per minute per authenticated user
  const rateLimit = checkRateLimit(`search:${user.id}`, 45, 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: `Search rate limit reached. Please wait ${rateLimit.resetInSeconds} seconds.`,
    };
  }

  try {
    const data = await globalSearch(user.id, query);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Global search error:", error);
    return {
      success: false,
      error: "Failed to perform search.",
    };
  }
}
