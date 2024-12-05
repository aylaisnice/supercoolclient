import { AppBskyEmbedExternal } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { escapeHTML } from "../../blocks/text_processing";
import { getProperSize, singleImageHeight } from "../../blocks/get_proper_size";

function gifClick(e: MouseEvent) {
  //i saw this on aglais but like this is  basically the only option right
  const gif = e.currentTarget as HTMLVideoElement;

  e.preventDefault();

  if (gif.paused) {
    gif.play();
  } else {
    gif.pause();
  }
}

export function loadEmbedExternal(
  embed: AppBskyEmbedExternal.Main,
  viewEmbed: AppBskyEmbedExternal.View,
  did: string,
) {
  const url = new URL(embed.external.uri);
  if (url.hostname === "media.tenor.com") {
    const urlParams = new URLSearchParams(url.search);
    const aspectRatio = {
      width: Number(urlParams.get("ww")),
      height: Number(urlParams.get("hh")),
    };
    const splitPathname = url.pathname.split("/");
    const newURL = `https://t.gifs.bsky.app/${splitPathname[1].slice(0, -2)}P3/${splitPathname[2]}`;
    const gif = elem("video", {
      src: newURL,
      autoplay: true,
      loop: true,
      muted: true,
    });
    const properSize = getProperSize(aspectRatio, singleImageHeight);
    gif.style.cssText = `aspect-ratio: ${aspectRatio.width}/${aspectRatio.height}; width: ${properSize.width}px`;
    gif.addEventListener("click", gifClick);
    return [elem("div", { className: "media-container" }, [gif])];
  } else {
    return [
      elem("a", { href: embed.external.uri, className: "external" }, [
        embed.external.thumb
          ? elem("div", { className: "image" }, [
              elem("img", {
                src: `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${embed.external.thumb.ref.$link}@${embed.external.thumb.mimeType.split("/")[1]}`,
              }),
            ])
          : "",
        elem("div", { className: "text" }, [
          elem("span", {
            innerHTML: escapeHTML(embed.external.title || embed.external.uri),
            className: "title",
          }),
          elem("span", {
            innerHTML: escapeHTML(embed.external.description),
            className: "description",
          }),
          elem("span", {
            innerHTML: escapeHTML(new URL(embed.external.uri).host),
            className: "small",
          }),
        ]),
      ]),
    ];
  }
}
