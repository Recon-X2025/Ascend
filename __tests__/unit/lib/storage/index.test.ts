import { storeFile, getFileUrl, removeFile, isStorageConfigured } from "@/lib/storage";

const localMocks = {
  upload: jest.fn().mockResolvedValue("key"),
  getSignedUrl: jest.fn().mockResolvedValue("/api/storage/local/token"),
  delete: jest.fn(),
  getFileBuffer: jest.fn().mockResolvedValue(Buffer.from("data")),
};

jest.mock("@/lib/storage/providers/local", () => ({
  LocalStorageProvider: jest.fn().mockImplementation(() => localMocks),
}));

jest.mock("@/lib/storage/providers/vultr", () => ({
  VultrStorageProvider: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockResolvedValue("key"),
    getSignedUrl: jest.fn().mockResolvedValue("https://signed.url"),
    delete: jest.fn(),
    getFileBuffer: jest.fn().mockResolvedValue(Buffer.from("data")),
  })),
}));

describe("Storage adapter", () => {
  const origEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  describe("when STORAGE_PROVIDER=local (default)", () => {
    beforeEach(() => {
      process.env.STORAGE_PROVIDER = "local";
      delete process.env.VULTR_STORAGE_ACCESS_KEY;
    });

    test("storeFile uses local provider", async () => {
      const key = await storeFile("test/key", Buffer.from("data"), "text/plain");
      expect(key).toBe("key");
      expect(localMocks.upload).toHaveBeenCalledWith(
        "test/key",
        Buffer.from("data"),
        "text/plain"
      );
    });

    test("getFileUrl returns signed URL from local provider", async () => {
      const url = await getFileUrl("test/key");
      expect(url).toMatch(/\/api\/storage\/local\//);
      expect(localMocks.getSignedUrl).toHaveBeenCalledWith("test/key", 3600);
    });

    test("removeFile uses local provider", async () => {
      await removeFile("test/key");
      expect(localMocks.delete).toHaveBeenCalledWith("test/key");
    });

    test("isStorageConfigured returns false", () => {
      expect(isStorageConfigured()).toBe(false);
    });
  });

  describe("when STORAGE_PROVIDER=vultr", () => {
    beforeEach(() => {
      process.env.STORAGE_PROVIDER = "vultr";
      process.env.VULTR_STORAGE_ACCESS_KEY = "ak";
      process.env.VULTR_STORAGE_SECRET_KEY = "sk";
    });

    test("getFileUrl uses vultr provider", async () => {
      const url = await getFileUrl("test/key");
      expect(url).toBe("https://signed.url");
    });

    test("isStorageConfigured returns true when keys set", () => {
      expect(isStorageConfigured()).toBe(true);
    });

    test("isStorageConfigured returns false when key is placeholder", () => {
      process.env.VULTR_STORAGE_ACCESS_KEY = "placeholder";
      expect(isStorageConfigured()).toBe(false);
    });
  });
});
