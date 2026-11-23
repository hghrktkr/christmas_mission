// 座標に関するユーティリティ

import { BlockVolume, Dimension, DimensionLocation, system, Vector3, world } from "@minecraft/server";
import { isTestMode } from "../config/testMode";
import { systemMessage } from "./message";

/** 権限回避用Volume情報 */
export interface VolumeData {
  from: Vector3;
  to: Vector3;
}

/** DimensionLocationに変換する */
export function convertToDLoc(dimension: Dimension, location: Vector3): DimensionLocation {
  return {
    dimension: dimension,
    x: location.x,
    y: location.y,
    z: location.z,
  };
}

/** チャンクロードを待つ */
export async function waitChunkLoaded(dim: Dimension, loc: Vector3): Promise<void> {
  while (!dim.isChunkLoaded(loc)) {
    await system.waitTicks(10);
    systemMessage("[waitChunkLoaded] waiting...");
  }
  systemMessage("[waitChunkLoaded] §6§lchunk loaded");
}

/** ブロック座標をエンティティ座標に */
export function toEntityPos(loc: Vector3): Vector3 {
  return {
    x: loc.x + 0.5,
    y: loc.y,
    z: loc.z + 0.5,
  };
}

/**
 * エンティティ座標をブロック座標に変換する
 */
export function toBlockLocation(loc: Vector3): Vector3 {
  return {
    x: Math.floor(loc.x),
    y: Math.floor(loc.y),
    z: Math.floor(loc.z),
  };
}

/** 開始位置とオフセットからblockVolumeを作る */
export function makeBlockVolume(origin: Vector3, offset: Vector3): BlockVolume {
  const end = {
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    z: origin.z + offset.z,
  };

  return new BlockVolume(origin, end);
}

/** 座標をオフセットさせる */
export function offset(origin: Vector3, offset: Vector3): Vector3 {
  return {
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    z: origin.z + offset.z,
  };
}

/** 2座標間の距離を返す */
export function distance(fromLoc: Vector3, toLoc: Vector3): number {
  return Math.sqrt((toLoc.x - fromLoc.x) ** 2 + (toLoc.y - fromLoc.y) ** 2 + (toLoc.z - fromLoc.z) ** 2);
}

/** 2座標が同じか比較する */
export function isSameLocation(loc1: Vector3, loc2: Vector3): boolean {
  if (isTestMode) {
    world.sendMessage(`§6[test] loc1: (${loc1.x}, ${loc1.y}, ${loc1.z})`);
    world.sendMessage(`§6[test] loc2: (${loc2.x}, ${loc2.y}, ${loc2.z})`);
  }
  return loc1.x === loc2.x && loc1.y === loc2.y && loc1.z === loc2.z;
}
