// 座標に関するユーティリティ
import { BlockVolume, system, world } from "@minecraft/server";
import { isTestMode } from "../config/testMode";
import { systemMessage } from "./message";
/** DimensionLocationに変換する */
export function convertToDLoc(dimension, location) {
    return {
        dimension: dimension,
        x: location.x,
        y: location.y,
        z: location.z,
    };
}
/** チャンクロードを待つ */
export async function waitChunkLoaded(dim, loc) {
    while (!dim.isChunkLoaded(loc)) {
        await system.waitTicks(10);
        systemMessage("[waitChunkLoaded] waiting...");
    }
    systemMessage("[waitChunkLoaded] §6§lchunk loaded");
}
/** ブロック座標をエンティティ座標に */
export function toEntityPos(loc) {
    return {
        x: loc.x + 0.5,
        y: loc.y,
        z: loc.z + 0.5,
    };
}
/**
 * エンティティ座標をブロック座標に変換する
 */
export function toBlockLocation(loc) {
    return {
        x: Math.floor(loc.x),
        y: Math.floor(loc.y),
        z: Math.floor(loc.z),
    };
}
/** 開始位置とオフセットからblockVolumeを作る */
export function makeBlockVolume(origin, offset) {
    const end = {
        x: origin.x + offset.x,
        y: origin.y + offset.y,
        z: origin.z + offset.z,
    };
    return new BlockVolume(origin, end);
}
/** 座標をオフセットさせる */
export function offset(origin, offset) {
    return {
        x: origin.x + offset.x,
        y: origin.y + offset.y,
        z: origin.z + offset.z,
    };
}
/** 2座標間の距離を返す */
export function distance(fromLoc, toLoc) {
    return Math.sqrt((toLoc.x - fromLoc.x) ** 2 + (toLoc.y - fromLoc.y) ** 2 + (toLoc.z - fromLoc.z) ** 2);
}
/** 2座標が同じか比較する */
export function isSameLocation(loc1, loc2) {
    if (isTestMode) {
        world.sendMessage(`§6[test] loc1: (${loc1.x}, ${loc1.y}, ${loc1.z})`);
        world.sendMessage(`§6[test] loc2: (${loc2.x}, ${loc2.y}, ${loc2.z})`);
    }
    return loc1.x === loc2.x && loc1.y === loc2.y && loc1.z === loc2.z;
}
//# sourceMappingURL=location.js.map