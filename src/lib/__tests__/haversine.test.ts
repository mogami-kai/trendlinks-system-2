import { describe, it, expect } from "vitest";
import { haversineMeters, isArrived, ARRIVAL_THRESHOLD_M } from "../haversine";

describe("haversineMeters", () => {
  it("同一地点は 0m", () => {
    expect(haversineMeters(35.681, 139.767, 35.681, 139.767)).toBeCloseTo(0, 5);
  });

  it("東京駅〜約100m先 はおよそ100m", () => {
    // 緯度0.0009度 ≒ 約100m
    const d = haversineMeters(35.681236, 139.767125, 35.682036, 139.767125);
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(100);
  });

  it("東京駅〜大阪駅 は約400km超", () => {
    const d = haversineMeters(35.681236, 139.767125, 34.702485, 135.495951);
    expect(d).toBeGreaterThan(390_000);
    expect(d).toBeLessThan(420_000);
  });
});

describe("isArrived", () => {
  it("しきい値以内は到着", () => {
    expect(isArrived(ARRIVAL_THRESHOLD_M - 1)).toBe(true);
    expect(isArrived(0)).toBe(true);
  });
  it("しきい値超は未到着", () => {
    expect(isArrived(ARRIVAL_THRESHOLD_M + 1)).toBe(false);
  });
});
