import {
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/client/lexicons";
import { postCard } from "../ui/post_card";
import { elem } from "../utils/elem";
import { Brand } from "@atcute/client/lexicons";
import { setPreloaded } from "../../routes/post";
import { getPathFromUri } from "../utils/link_processing";

export function loadThread(
  postThread: AppBskyFeedGetPostThread.Output,
  rootPost: AppBskyFeedDefs.PostView | null,
  outputElement: HTMLElement,
) {
  if (postThread.thread.$type === "app.bsky.feed.defs#threadViewPost") {
    const thread = postThread.thread;

    const mainThreadPosts = document.createDocumentFragment();
    const replyPosts = document.createDocumentFragment();
    //let mutedPosts = document.createDocumentFragment();

    if (thread.parent) {
      let currentThread = thread;
      while (
        currentThread.parent &&
        currentThread.parent.$type === "app.bsky.feed.defs#threadViewPost"
      ) {
        currentThread = currentThread.parent;
        mainThreadPosts.prepend(postCard(currentThread.post, false, true));
      }
      if (
        currentThread.parent &&
        currentThread.parent.$type !== "app.bsky.feed.defs#threadViewPost"
      ) {
        const post = currentThread.parent;
        mainThreadPosts.prepend(
          elem("a", {
            className: "simple-card",
            href: getPathFromUri(post.uri),
            textContent:
              post.$type === "app.bsky.feed.defs#blockedPost"
                ? "Blocked post"
                : "Post not found",
          }),
        );
        if (rootPost) mainThreadPosts.prepend(postCard(rootPost, false, true));
      }
    }

    const mainPost = postCard(thread.post, true);
    mainThreadPosts.append(mainPost);

    function loadReplies(
      replies: Brand.Union<
        | AppBskyFeedDefs.ThreadViewPost
        | AppBskyFeedDefs.BlockedPost
        | AppBskyFeedDefs.NotFoundPost
      >[],
      stringMargin: number,
      previousStrings: boolean[],
      lockToAuthor: boolean,
      wasMainThread = false,
      outputElement = replyPosts,
    ) {
      const lastChild = replies[replies.length - 1];
      for (const post of replies) {
        if (
          lockToAuthor &&
          (post.$type !== "app.bsky.feed.defs#threadViewPost" ||
            post.post.author.did !== thread.post.author.did)
        )
          continue;
        const isLastChild = post === lastChild;

        const replyContainer = elem("div", {
          className: "reply-container" + (stringMargin ? " added-margin" : ""),
        });
        replyContainer.append(...previousStrings.map(getString));
        let strings: boolean[] = previousStrings;
        if (stringMargin && replies?.length > 1) {
          const stringContainer = elem("div", {
            className: "string-container",
          });
          strings = previousStrings.slice();
          strings.push(isLastChild);
          stringContainer.append(
            elem("div", { className: "connect-string" }),
            elem("div", {
              className: "reply-string" + (isLastChild ? " transparent" : ""),
            }),
          );
          replyContainer.append(stringContainer);
        }

        if (post.$type === "app.bsky.feed.defs#threadViewPost") {
          const isMainThread =
            wasMainThread && post.post.author.did === thread.post.author.did;

          let newLockToAuthor = isMainThread ? true : lockToAuthor;
          let shownPostReplies: Brand.Union<
            | AppBskyFeedDefs.ThreadViewPost
            | AppBskyFeedDefs.BlockedPost
            | AppBskyFeedDefs.NotFoundPost
          >[];
          if (newLockToAuthor && post.replies) {
            outputElement = mainThreadPosts;
            shownPostReplies = post.replies.filter(
              (reply) =>
                reply.$type === "app.bsky.feed.defs#threadViewPost" &&
                reply.post.author.did === thread.post.author.did,
            );
            if (!shownPostReplies.length) {
              newLockToAuthor = false;
              shownPostReplies = post.replies;
            }
          } else shownPostReplies = post.replies;

          const replyElem = postCard(
            post,
            false,
            Boolean(
              post.replies !== undefined
                ? shownPostReplies?.length
                : post.post.replyCount,
            ),
          );

          replyContainer.append(replyElem);
          outputElement.append(replyContainer);

          if (Boolean(shownPostReplies?.length)) {
            loadReplies(
              shownPostReplies,
              stringMargin + Number(shownPostReplies.length > 1),
              strings,
              newLockToAuthor,
              isMainThread,
              outputElement,
            );
          } else if (post.post.replyCount && !post.replies) {
            const continueThreadContainer = elem("div", {
              className:
                "reply-container" + (stringMargin ? " added-margin" : ""),
            });
            continueThreadContainer.append(
              ...strings.map(getString),
              elem("a", {
                className: "simple-card",
                textContent: "Continue thread...",
                href: getPathFromUri(post.post.uri),
                onclick: () => setPreloaded(post.post),
              }),
            );
            outputElement.append(continueThreadContainer);
          }
        } else if (post.$type === "app.bsky.feed.defs#blockedPost") {
          replyContainer.append(
            elem("a", {
              className: "simple-card",
              href: getPathFromUri(post.uri),
              textContent: "Blocked post",
            }),
          );
          outputElement.append(replyContainer);
        }
      }
    }
    if (Boolean(thread.replies?.length))
      loadReplies(thread.replies, 0, [], false, true);

    outputElement.replaceChildren(
      mainThreadPosts,
      replyPosts,
      elem("div", { className: "buffer" }),
    );
    mainPost.scrollIntoView();
    //if (mutedPosts.hasChildNodes())
    //  outputElement.append(mutedPostsButton(outputElement, mutedPosts));
  } else {
    outputElement.replaceChildren(
      elem("div", {
        className: "simple-card",
        textContent:
          postThread.thread.$type === "app.bsky.feed.defs#blockedPost"
            ? "Blocked post"
            : "Post not found",
      }),
    );
  }
}

function mutedPostsButton(outputElement: HTMLElement, posts: DocumentFragment) {
  const button = elem(
    "div",
    {
      className: "card-holder show-muted",
      onclick: () => {
        outputElement.removeChild(button);
        outputElement.append(posts);
      },
    },
    null,
    [
      elem(
        "div",
        { className: "pfp-holder" },
        elem("div", { className: "pfp" }),
      ),
      elem("div", {
        className: "outputElement",
        textContent: "Show muted replies",
      }),
    ],
  );
  return button;
}

function getString(isLastChild: boolean) {
  return elem(
    "div",
    { className: "string-container" },
    elem("div", {
      className: "reply-string" + (isLastChild ? " transparent" : ""),
    }),
  );
}
