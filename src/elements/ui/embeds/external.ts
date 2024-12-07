import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { escapeHTML } from "../../utils/text_processing";
import { loadEmbedGif } from "./gif";

export function loadEmbedExternal(
  embed: AppBskyEmbedExternal.View,
  did: string,
) {
  const url = new URL(embed.external.uri);
  if (url.hostname === "media.tenor.com") {
    return loadEmbedGif(url);
  } else {
    const card = elem("a", { href: embed.external.uri, className: "external" });
    if (embed.external.thumb) {
      const image = elem("div", { className: "image" }, [
        elem("img", { src: embed.external.thumb, loading: "lazy" }),
      ]);
      card.append(image);
    }
    card.append(
      elem("div", { className: "text" }, [
        elem("span", {
          innerHTML: escapeHTML(embed.external.title || embed.external.uri),
          className: "title",
        }),
        embed.external.description
          ? elem("span", {
              innerHTML: escapeHTML(embed.external.description),
              className: "description",
            })
          : "",
        elem("span", {
          innerHTML: escapeHTML(url.host),
          className: "small",
        }),
      ]),
    );
    return [card];
  }
}
