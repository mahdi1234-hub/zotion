import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";

import { Users } from "./payload/collections/Users";
import { Posts } from "./payload/collections/Posts";
import { Pages } from "./payload/collections/Pages";
import { Media } from "./payload/collections/Media";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " | Zotion CMS",
    },
  },
  collections: [Users, Posts, Pages, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "zotion-payload-secret-key-change-in-production",
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || "file:./payload.db",
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp: undefined,
});
