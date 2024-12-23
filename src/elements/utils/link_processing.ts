export const idChoose = (profile: { did: string; handle: string }) => {
  return profile.handle !== "handle.invalid" ? profile.handle : profile.did;
};

export const getPathFromUri = (uri: string) => {
  return `/${uri.slice(5, uri.indexOf("/", 6))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;
};

export const getDidFromUri = (uri: string) => {
  return uri.slice(5, uri.indexOf("/", 6));
};

// unfortunately this requires the image to be a four letter format like jpeg or heic. good thing is that those are the only ones the cdn uses
export const changeImageFormat = (uri: string, format = "webp") => {
  return uri.slice(0, -4) + format;
};

export const getUriFromSplitPath = (splitPath: string[]) => {
  return `at://${splitPath[0]}/app.bsky.feed.post/${splitPath[2]}`;
};

export const cutOutThePath = (uri: string) => {
  const slashIndex = uri.indexOf("/", 8);
  return slashIndex !== -1 ? uri.slice(8, slashIndex) : uri;
};
