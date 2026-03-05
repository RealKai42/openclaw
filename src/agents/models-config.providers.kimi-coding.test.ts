import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captureEnv } from "../test-utils/env.js";
import { buildKimiCodingProvider, resolveImplicitProviders } from "./models-config.providers.js";

describe("kimi-coding implicit provider (#22409)", () => {
  it("should include kimi-coding when KIMI_API_KEY is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    process.env.KIMI_API_KEY = "test-key";

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding"]).toBeDefined();
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://api.kimi.com/coding/");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should build kimi-coding provider with anthropic-messages API", () => {
    const provider = buildKimiCodingProvider();
    expect(provider.api).toBe("anthropic-messages");
    expect(provider.baseUrl).toBe("https://api.kimi.com/coding/");
    expect(provider.models).toBeDefined();
    expect(provider.models.length).toBeGreaterThan(0);
    expect(provider.models[0].id).toBe("k2p5");
  });

  it("should honor user-configured baseUrl over built-in default (#36353)", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    process.env.KIMI_API_KEY = "test-key";

    try {
      const providers = await resolveImplicitProviders({
        agentDir,
        explicitProviders: {
          "kimi-coding": { baseUrl: "https://custom.kimi.example.com/v1/" },
        },
      });
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://custom.kimi.example.com/v1/");
      // other defaults should remain intact
      expect(providers?.["kimi-coding"]?.api).toBe("anthropic-messages");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should honor user-configured api over built-in default (#36353)", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    process.env.KIMI_API_KEY = "test-key";

    try {
      const providers = await resolveImplicitProviders({
        agentDir,
        explicitProviders: {
          "kimi-coding": { api: "openai-completions" },
        },
      });
      expect(providers?.["kimi-coding"]?.api).toBe("openai-completions");
      // baseUrl should remain the default when not overridden
      expect(providers?.["kimi-coding"]?.baseUrl).toBe("https://api.kimi.com/coding/");
    } finally {
      envSnapshot.restore();
    }
  });

  it("should not include kimi-coding when no API key is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const envSnapshot = captureEnv(["KIMI_API_KEY"]);
    delete process.env.KIMI_API_KEY;

    try {
      const providers = await resolveImplicitProviders({ agentDir });
      expect(providers?.["kimi-coding"]).toBeUndefined();
    } finally {
      envSnapshot.restore();
    }
  });
});
