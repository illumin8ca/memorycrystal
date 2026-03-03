const DEFAULT_BASE_URL = "https://rightful-mockingbird-389.convex.site";

export interface ConvexClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class ConvexClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: ConvexClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.CRYSTAL_BASE_URL ?? DEFAULT_BASE_URL;
    this.apiKey = options.apiKey ?? process.env.CRYSTAL_API_KEY ?? "";

    if (!this.apiKey) {
      throw new Error("CRYSTAL_API_KEY environment variable is required");
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const raw = await response.text();
    const data = raw ? safeParseJson(raw) : null;

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && String((data as { error?: string }).error)) ||
        `HTTP ${response.status}`;
      throw new Error(`Memory Crystal API error: ${message}`);
    }

    return data as T;
  }
}

function safeParseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return { raw: input };
  }
}
