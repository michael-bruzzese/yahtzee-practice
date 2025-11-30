import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { avatarOptions } from "@/app/avatars";

const publicDir = (...parts: string[]) => path.join(process.cwd(), "public", ...parts);

describe("asset coverage for avatars and dice", () => {
  test("avatar frames exist for all poses", () => {
    const poses = ["idle", "windup", "throw"] as const;
    avatarOptions.forEach((avatar) => {
      poses.forEach((pose) => {
        const relPath = avatar.frames[pose];
        expect(relPath).toMatch(/^\/assets\/avatars\//);
        const filePath = publicDir(relPath.replace(/^\//, ""));
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  test("dice assets exist for faces and blur state", () => {
    const diceFiles = ["die-1.svg", "die-2.svg", "die-3.svg", "die-4.svg", "die-5.svg", "die-6.svg", "die-blur.svg"];
    diceFiles.forEach((file) => {
      const filePath = publicDir("assets", "dice", file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
