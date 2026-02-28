import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface ObsidianMemoryRecord {
  id: string;
  store: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  confidence: number;
  strength: number;
  source: string;
  valence: number;
  arousal: number;
  channel?: string;
  createdAt: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const frontMatter = (record: ObsidianMemoryRecord) => {
  const tagLine = record.tags.length > 0 ? record.tags.join(", ") : "";

  return `---\nid: ${record.id}\nstore: ${record.store}\ncategory: ${record.category}\nconfidence: ${record.confidence}\nstrength: ${record.strength}\nsource: ${record.source}\nvalence: ${record.valence}\narousal: ${record.arousal}\nchannel: ${record.channel ?? "unknown"}\ntags: [${tagLine}]\ncreatedAt: ${new Date(record.createdAt).toISOString()}\n---`;
};

export const writeMemoryToObsidian = async (record: ObsidianMemoryRecord): Promise<string> => {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) {
    return "";
  }

  const safeSlug = slugify(record.title) || "memory";
  const safeCategory = slugify(record.store) || "memory";
  const fileName = `${Date.now()}-${safeSlug}.md`;
  const filePath = join(vaultPath, safeCategory, fileName);

  const content = `${frontMatter(record)}\n\n# ${record.title}\n\n${record.content}\n`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, { encoding: "utf8" });
  return filePath;
};
