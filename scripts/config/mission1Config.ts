import { Vector3 } from "@minecraft/server";
import { GameLevel } from "./gameConfig";

export interface Mission1Data {
  // スポーンポイント
  spawnPointRoom: Vector3;
  spawnPointStage: Vector3;

  /**
   * ステージの座標設定
   * stageOrigin: 基準座標
   * stageOffset: 基準座標からの最大オフセット
   */
  stageOrigin: Vector3;
  stageOffset: Vector3;

  // ルール
  rule: Mission1GameRule;

  // ステージのストラクチャーデータID
  structureId?: string;
}

export interface Mission1GameRule {
  requiredSurvivals: number;
  maxDeaths: number;
  timeLimitSeconds: number;
  randomRotate: boolean;
}

export const mission1Config: Record<GameLevel, Mission1Data> = {
  lv1: {
    spawnPointRoom: { x: 5, y: 0, z: -3 },
    spawnPointStage: { x: 0, y: 0, z: 0 },

    stageOrigin: { x: 1, y: -1, z: 1 },
    stageOffset: { x: 8, y: 0, z: 8 }, // size = origin + offset

    rule: {
      requiredSurvivals: 5,
      maxDeaths: 3,
      timeLimitSeconds: 7,
      randomRotate: false,
    },
  },

  lv2: {
    spawnPointRoom: { x: 5, y: -64, z: -3 },
    spawnPointStage: { x: 0, y: -64, z: 0 },

    stageOrigin: { x: 0, y: -65, z: 0 },
    stageOffset: { x: 9, y: 0, z: 9 },

    rule: {
      requiredSurvivals: 7,
      maxDeaths: 3,
      timeLimitSeconds: 5,
      randomRotate: true,
    },
  },

  lv3: {
    spawnPointRoom: { x: 5, y: -64, z: -3 },
    spawnPointStage: { x: 0, y: -64, z: 0 },

    stageOrigin: { x: 0, y: -65, z: 0 },
    stageOffset: { x: 9, y: 0, z: 9 },

    rule: {
      requiredSurvivals: 9,
      maxDeaths: 3,
      timeLimitSeconds: 10,
      randomRotate: true,
    },
  },
};
