export interface EmbedAdapter {
  embed(text: string): Promise<number[] | null>;
}

export interface OllamaEmbedAdapterConfig {
  model?: string;
  baseUrl?: string;
}

export class OllamaEmbedAdapter implements EmbedAdapter {
  private readonly endpoint: string;
  private readonly model: string;

  constructor(config: OllamaEmbedAdapterConfig = {}) {
    this.endpoint = (config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.model = config.model ?? process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.endpoint}/api/embeddings`, {
      method: "POST",
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as { embedding?: number[] };
    if (!payload.embedding || payload.embedding.length === 0) {
      throw new Error("Ollama embedding response missing vector");
    }

    return payload.embedding;
  }
}

export class OpenAIEmbedAdapter implements EmbedAdapter {
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const resolvedApiKey = apiKey ?? process.env.OPENAI_API_KEY;
    if (!resolvedApiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAIEmbedAdapter");
    }
    this.apiKey = resolvedApiKey;
  }

  async embed(text: string): Promise<number[] | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI embeddings failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as { data?: { embedding?: number[] }[] };
      const values = payload.data?.[0]?.embedding;
      if (!values || values.length === 0) {
        throw new Error("Embedding API returned no results");
      }

      return values;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const getEmbedAdapter = (): EmbedAdapter => {
  const provider = (process.env.EMBEDDING_PROVIDER ?? "openai").toLowerCase();

  switch (provider) {
    case "openai":
      return new OpenAIEmbedAdapter();
    case "ollama":
      return new OllamaEmbedAdapter();
    default:
      throw new Error(`Unsupported EMBEDDING_PROVIDER \"${provider}\"`);
  }
};
