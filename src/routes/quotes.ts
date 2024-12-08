import { statsPage } from "../elements/page/stats";
import { postCard } from "../elements/ui/post_card";

export async function quotesRoute(
  currentPath: string,
  currentSplitPath: string[],
  previousSplitPath: string[],
) {
  statsPage(currentSplitPath, "Quotes", "app.bsky.feed.getQuotes", postCard);
}
