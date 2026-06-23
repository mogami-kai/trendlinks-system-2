import { describe, it, expect } from "vitest";
import { PLANS, canAddMore, hasFeature, isUnlimited } from "../plans";

describe("プラン上限 (canAddMore)", () => {
  it("Free は現場3件まで", () => {
    expect(canAddMore("free", "sites", 2)).toBe(true);
    expect(canAddMore("free", "sites", 3)).toBe(false);
  });
  it("Starter はスタッフ20名まで", () => {
    expect(canAddMore("starter", "staff", 19)).toBe(true);
    expect(canAddMore("starter", "staff", 20)).toBe(false);
  });
  it("Pro は無制限", () => {
    expect(canAddMore("pro", "sites", 9999)).toBe(true);
    expect(isUnlimited(PLANS.pro.maxSites)).toBe(true);
  });
});

describe("機能ゲート (hasFeature)", () => {
  it("GPS/PDF は Pro のみ", () => {
    expect(hasFeature("free", "gpsArrival")).toBe(false);
    expect(hasFeature("starter", "pdfReport")).toBe(false);
    expect(hasFeature("pro", "gpsArrival")).toBe(true);
    expect(hasFeature("pro", "pdfReport")).toBe(true);
  });
});

describe("価格", () => {
  it("Starter ¥1,980 / Pro ¥4,980", () => {
    expect(PLANS.starter.priceJpy).toBe(1980);
    expect(PLANS.pro.priceJpy).toBe(4980);
  });
});
