import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";

import { components } from "./_generated/api";
import { action, mutation } from "./_generated/server";
import { assertServiceKey } from "./lib";

export const r2 = new R2(components.r2);

/**
 * Media upload flow (admin app):
 *   1. Admin server route calls getUploadUrl → { url, key }
 *   2. Browser PUTs the file to the signed url
 *   3. Admin server route calls syncMetadata with the key
 *   4. The key is stored on the target document (e.g. mainImageKey)
 */
export const getUploadUrl = mutation({
  args: { serviceKey: v.string() },
  handler: (_ctx, args) => {
    assertServiceKey(args.serviceKey);
    return r2.generateUploadUrl();
  },
});

export const syncMetadata = action({
  args: { key: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await r2.syncMetadata(ctx, args.key);
  },
});

export const deleteObject = mutation({
  args: { key: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await r2.deleteObject(ctx, args.key);
  },
});
