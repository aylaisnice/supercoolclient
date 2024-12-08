import { get } from "../elements/utils/cache";
import { loadedPath, profileRedirect } from "../router";
import { feedNSID, hydrateFeed } from "../elements/ui/feed";
import { profilePage } from "../elements/page/profile";
import { profileCard } from "../elements/ui/profile_card";
import {
  getAtIdFromPath,
  getFirstAndSecondSubdirs,
} from "../elements/utils/link_processing";

const urlEquivalents: { [key: string]: [feedNSID, string?] } = {
  "": ["app.bsky.feed.getAuthorFeed", "posts_no_replies"],
  media: ["app.bsky.feed.getAuthorFeed", "posts_with_media"],
  replies: ["app.bsky.feed.getAuthorFeed", "posts_with_replies"],
  likes: ["app.bsky.feed.getActorLikes"],
};

export async function profileRoute(currentPath: string, loadedPath: string) {
  const atId = getAtIdFromPath(currentPath);

  const { data: profile } = await get("app.bsky.actor.getProfile", {
    params: { actor: atId },
  });
  const { data: lastMedia } = await get("app.bsky.feed.getAuthorFeed", {
    params: {
      actor: profile.did,
      filter: "posts_with_media",
      limit: 4,
    },
  });
  if (window.location.pathname === currentPath) {
    if (atId != profile.did) profileRedirect(profile.did);
    profilePage(profile, lastMedia);

    profileUrlChange(currentPath, loadedPath);
  }
}

export async function profileUrlChange(
  currentPath: string,
  previousPath: string,
) {
  const [currentProfile, currentFeed] = getFirstAndSecondSubdirs(currentPath);
  const [previousProfile, previousFeed] =
    getFirstAndSecondSubdirs(previousPath);
  const atSameProfile = currentProfile === previousProfile;
  const atSameFeed = currentFeed === previousFeed;

  const did = getAtIdFromPath(currentPath);

  const content = document.getElementById("content");
  const sideBar = document.getElementById("side-bar");
  sideBar.querySelector(".active")?.classList.remove("active");
  sideBar.querySelector(`[href="${currentPath}"]`)?.classList.add("active");

  if (atSameProfile && !atSameFeed) content.replaceChildren();
  let posts: HTMLElement[];
  console.log(currentPath, previousPath);
  const feed = feedConfig[currentFeed] ?? feedConfig.default;
  posts = await hydrateFeed(
    feed.endpoint ?? urlEquivalents[currentFeed][0],
    feed.params(did, currentFeed),
    atSameProfile && atSameFeed,
    feed.type,
  );
  if (currentPath === loadedPath) content.replaceChildren(...posts);
}

export function profileTrim(currentPath: string, loadedPath: string) {
  const newPath = currentPath.slice(0, -1);
  history.pushState(null, "", newPath);
  profileRoute(newPath, loadedPath);
}

const feedConfig = {
  following: {
    endpoint: "app.bsky.graph.getFollows",
    params: (did: string) => ({ actor: did }),
    type: profileCard,
  },
  followers: {
    endpoint: "app.bsky.graph.getFollowers",
    params: (did: string) => ({ actor: did }),
    type: profileCard,
  },
  search: {
    endpoint: "app.bsky.feed.searchPosts",
    params: (did: string) => ({
      author: did,
      q: decodeURIComponent(window.location.search).slice(1),
    }),
  },
  default: {
    endpoint: null,
    params: (did: string, place: string) => ({
      actor: did,
      filter: urlEquivalents[place][1],
    }),
  },
};
