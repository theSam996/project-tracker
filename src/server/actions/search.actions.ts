"use server";

import { getCurrentUser } from "@/lib/session";
import { globalSearch, GlobalSearchResults } from "@/server/queries/search.queries";

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
