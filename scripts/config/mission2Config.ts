import type { Entity, Vector3 } from "@minecraft/server";
import { GameLevel, WrappingColor, RibbonColor } from "./gameConfig";

// 袋の識別
export type SortingDestination = "true" | "false";

// 出題条件
export type GiftCondition =
  | { wrappingColor: WrappingColor }
  | { ribbonColor: RibbonColor }
  | {
      operator: "AND" | "OR";
      conditions: [GiftCondition, GiftCondition, ...GiftCondition[]];
    };

export interface GiftDefinition {
  id: string;
  wrappingColor: WrappingColor;
  ribbonColor: RibbonColor;
}

/** ワールド上に存在するプレゼント */
export interface GiftData {
  entity: Entity;
  definition: GiftDefinition;
}

/** クレーンの移動先 */
export interface MoveTarget {
  entity: Entity;
  destination: Vector3;
}

export const Mission2Config = {
  dimensionId: "overworld",

  // エンティティID
  giftEntityId: "edu:gift_box",
  craneEntityId: "edu:crane",

  // ゲーム時間
  timeLimitSeconds: 60,

  // プレゼントを提示する位置
  presentationPosition: {
    x: 10.5,
    y: 4.5,
    z: 28.5,
  } satisfies Vector3,

  // プレゼントの搬送開始位置
  craneStartPosition: {
    x: 10.5,
    y: 6,
    z: 28.5,
  } satisfies Vector3,

  // 仕分け先の位置
  destinations: {
    true: {
      button: { x: 3, y: 0, z: 20 },
      drop: { x: 18, y: 4.5, z: 28.5 },
    },
    false: {
      button: { x: 1, y: 0, z: 20 },
      drop: { x: 2, y: 4.5, z: 28.5 },
    },
  } satisfies Record<SortingDestination, { button: Vector3; drop: Vector3 }>,

  // レベルごとの出題条件
  rules: {
    // Lv.1：単一条件
    lv1: [{ wrappingColor: "red" }, { wrappingColor: "blue" }, { ribbonColor: "yellow" }, { ribbonColor: "green" }],

    // Lv.2：AND条件
    lv2: [
      {
        operator: "AND",
        conditions: [{ wrappingColor: "red" }, { ribbonColor: "yellow" }],
      },
      {
        operator: "AND",
        conditions: [{ wrappingColor: "blue" }, { ribbonColor: "green" }],
      },
    ],

    // Lv.3：AND / OR条件
    lv3: [
      {
        operator: "OR",
        conditions: [{ wrappingColor: "red" }, { ribbonColor: "yellow" }],
      },
      {
        operator: "AND",
        conditions: [{ wrappingColor: "blue" }, { ribbonColor: "green" }],
      },
    ],
  } satisfies Record<GameLevel, GiftCondition[]>,

  // クリア基準
  result: {
    lv1: {
      targetScore: 800,
    },
    lv2: {
      targetScore: 1000,
    },
    lv3: {
      targetScore: 1200,
    },
  } satisfies Record<
    GameLevel,
    {
      targetScore: number;
    }
  >,

  // 動作確認用の仮データ
  gifts: {
    lv1: [
      {
        id: "red-yellow",
        wrappingColor: "red",
        ribbonColor: "yellow",
      },
      {
        id: "blue-yellow",
        wrappingColor: "blue",
        ribbonColor: "yellow",
      },
      {
        id: "yellow-red",
        wrappingColor: "blue",
        ribbonColor: "red",
      },
    ],

    lv2: [
      {
        id: "red-yellow",
        wrappingColor: "red",
        ribbonColor: "yellow",
      },
      {
        id: "blue-yellow",
        wrappingColor: "blue",
        ribbonColor: "yellow",
      },
      {
        id: "yellow-red",
        wrappingColor: "blue",
        ribbonColor: "red",
      },
    ],

    lv3: [
      {
        id: "red-yellow",
        wrappingColor: "red",
        ribbonColor: "yellow",
      },
      {
        id: "blue-yellow",
        wrappingColor: "blue",
        ribbonColor: "yellow",
      },
      {
        id: "yellow-red",
        wrappingColor: "blue",
        ribbonColor: "red",
      },
    ],
  } satisfies Record<GameLevel, GiftDefinition[]>,
};
