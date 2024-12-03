import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { post } from "../ui/card";
import { elem } from "../blocks/elem";
import { error } from "../ui/error";

export function loadThread(
  postThread: AppBskyFeedGetPostThread.Output,
  rootPost: AppBskyFeedDefs.PostView | null,
  outputElement: HTMLElement,
) {
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;
    const authorDid = thread.post.author.did;

    let mainThreadPosts: HTMLElement[] = [];
    let replyPosts: HTMLElement[] = [];
    let mutedPosts: HTMLElement[] = [];

    if (thread.parent) {
      let currentThread = thread;
      while (
        currentThread.parent &&
        currentThread.parent.$type === "app.bsky.feed.defs#threadViewPost"
      ) {
        currentThread = currentThread.parent;
        const parentPost = post(currentThread.post, false, {
          isReply: Boolean(currentThread.parent),
          hasReplies: true,
        });
        mainThreadPosts.push(parentPost);
      }
      if (
        currentThread.parent &&
        currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
      ) {
        mainThreadPosts.push(
          error(
            currentThread.parent.$type === "app.bsky.feed.defs#blockedPost"
              ? "Blocked post"
              : "Post not found",
          ),
        );
        if (rootPost)
          mainThreadPosts.push(
            post(rootPost, false, {
              isReply: false,
              hasReplies: true,
            }),
          );
      }
      mainThreadPosts.reverse();
    }

    const mainPost = post(thread.post, true);
    mainThreadPosts.push(mainPost);

    function loadReplies(
      parentPost: AppBskyFeedDefs.ThreadViewPost,
      isAuthorPost: boolean,
      loadNonThread: boolean,
      level: number,
    ) {
      for (const reply of parentPost.replies) {
        if (reply.$type === "app.bsky.feed.defs#threadViewPost") {
          const isThreadContinuation =
            isAuthorPost && reply.post.author.did === authorDid;
          if (loadNonThread || isThreadContinuation) {
            const replyPost = post(reply.post, false, {
              isReply: true,
              hasReplies: Boolean(reply.replies && reply.replies[0]),
            });
            replyPost.style.paddingLeft = level * 48 + "px";
            replyPost.style.width = `calc(100% - ${replyPost.style.paddingLeft})`;

            if (isThreadContinuation) {
              mainThreadPosts.push(replyPost);
            } else if (reply.post.author.viewer.muted) {
              mutedPosts.push(replyPost);
            } else if (isAuthorPost && parentPost.post !== thread.post) {
              mainThreadPosts.push(replyPost);
            } else {
              replyPosts.push(replyPost);
            }

            if (reply.replies && reply.replies[0]) {
              const hasThreadContinuation =
                isThreadContinuation &&
                reply.replies?.some(
                  (reply) =>
                    "post" in reply && reply.post.author.did === authorDid,
                );
              loadReplies(
                reply,
                isThreadContinuation ||
                  (parentPost.post !== thread.post && isAuthorPost),
                !hasThreadContinuation,
                level +
                  Number(!hasThreadContinuation && reply.replies.length > 1),
              );
            }
          }
        }
      }
    }
    if (thread.replies && thread.replies[0]) loadReplies(thread, true, true, 0);

    outputElement.innerHTML = "";
    outputElement.append(...mainThreadPosts);
    mainPost.scrollIntoView();
    outputElement.append(...replyPosts);
    if (mutedPosts.length > 0)
      outputElement.append(mutedPostsButton(outputElement, mutedPosts));
    outputElement.append(elem("div", { className: "buffer" }));
  } else {
    outputElement.append(
      error(
        postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
          ? "Blocked post"
          : "Post not found",
      ),
    );
  }
}

function mutedPostsButton(outputElement: HTMLElement, posts: HTMLElement[]) {
  const button = elem(
    "div",
    {
      className: "card show-muted",
      onclick: () => {
        outputElement.removeChild(button);
        outputElement.append(...posts);
      },
    },
    [
      elem("div", { className: "pfp-holder" }, [
        elem("div", { className: "pfp" }),
      ]),
      elem("div", {
        className: "outputElement",
        innerHTML: "Show muted replies",
      }),
    ],
  );
  return button;
}
