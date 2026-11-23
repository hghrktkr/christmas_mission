import { Vector3 } from "@minecraft/server";
import { WrappingColor, RibbonColor, GameLevel } from "./gameConfig";

export type GiftState = "closed" | "opening" | "opened";

export type Gift = {
  id: number;
  x: number;
  z: number;
  wrapping: WrappingColor;
  ribbon: RibbonColor;
};

export type HintCategory = "coordinate" | "wrapping" | "ribbon" | "position";
export type HintSettings = Partial<Record<HintCategory, number>>;

export type HintContext = {
  origin: Vector3;
  offset: Vector3;
  gifts: Gift[];
  landmarks: Record<LandmarkType, Landmark>;
};

export type Hint = {
  id: string;
  category: HintCategory;

  create: (context: HintContext) => {
    text: string;
    notText: string; // NOTにした場合に表示するテキスト
    evaluate: (gift: Gift) => boolean;
  };
};

export type LandmarkType = "edu:christmas_tree_red" | "edu:snowman" | "edu:stuffed_bear";

export type Landmark = {
  typeId: LandmarkType;
  location: Vector3;
};

export type ScoreConfig = {
  baseScore: number;
  mistakePenalty: number;
  perfectBonus: number;
};

export const mission3Config = {
  dimensionId: "overworld",

  // ステージの座標
  origin: {
    x: 1,
    y: 0,
    z: 30,
  } satisfies Vector3,

  offset: {
    x: 19,
    y: 0,
    z: 19,
  } satisfies Vector3,

  rules: {
    lv1: {
      timeLimitSeconds: 900,
      spawnGiftCount: 10,

      hintSettings: {
        coordinate: 2,
        wrapping: 1,
        ribbon: 1,
      },

      useOr: false,
      useNot: false,
      minCorrectGifts: 1,
      maxCorrectGifts: 3,

      scoreConfig: {
        baseScore: 3000,
        mistakePenalty: 200,
        perfectBonus: 200,
      },
    },
    lv2: {
      timeLimitSeconds: 900,
      spawnGiftCount: 20,

      hintSettings: {
        coordinate: 2,
        wrapping: 1,
        ribbon: 1,
      },

      useOr: false,
      useNot: true,
      minCorrectGifts: 1,
      maxCorrectGifts: 3,

      scoreConfig: {
        baseScore: 4000,
        mistakePenalty: 300,
        perfectBonus: 300,
      },
    },
    lv3: {
      timeLimitSeconds: 1200,
      spawnGiftCount: 30,

      hintSettings: {
        wrapping: 1,
        ribbon: 1,
        position: 2,
      },

      useOr: true,
      useNot: true,
      minCorrectGifts: 1,
      maxCorrectGifts: 5,

      scoreConfig: {
        baseScore: 5000,
        mistakePenalty: 500,
        perfectBonus: 500,
      },
    },
  } satisfies Record<
    GameLevel,
    {
      timeLimitSeconds: number;
      spawnGiftCount: number;
      hintSettings: HintSettings;
      useOr: boolean;
      useNot: boolean;
      minCorrectGifts: number;
      maxCorrectGifts: number;
      scoreConfig: ScoreConfig;
    }
  >,
};

export const hintConfig: Record<HintCategory, Hint[]> = {
  coordinate: [
    {
      id: "coordinate_x",
      category: "coordinate",
      create: (context: HintContext) => {
        // ランダムにx座標を選択してヒントを作成
        const xValues = context.gifts.map((gift) => gift.x);
        const xValue = xValues[Math.floor(Math.random() * xValues.length)];
        return {
          text: `xざひょうは${xValue}です`,
          notText: `xざひょうは${xValue}ではありません`,
          evaluate: (gift: Gift) => gift.x === xValue,
        };
      },
    },
    {
      id: "coordinate_z",
      category: "coordinate",
      create: (context: HintContext) => {
        // ランダムにz座標を選択してヒントを作成
        const zValues = context.gifts.map((gift) => gift.z);
        const zValue = zValues[Math.floor(Math.random() * zValues.length)];
        return {
          text: `zざひょうは${zValue}です`,
          notText: `zざひょうは${zValue}ではありません`,
          evaluate: (gift: Gift) => gift.z === zValue,
        };
      },
    },
    {
      id: "greater_x",
      category: "coordinate",
      create: (context: HintContext) => {
        const { origin, offset } = context;
        const x = origin.x + offset.x / 2;
        return {
          text: `xざひょうは${x}よりおおきいです`,
          notText: `xざひょうは${x}よりおおきくありません`,
          evaluate: (gift: Gift) => gift.x > x,
        };
      },
    },
    {
      id: "greater_z",
      category: "coordinate",
      create: (context: HintContext) => {
        const { origin, offset } = context;
        const z = origin.z + offset.z / 2;
        return {
          text: `zざひょうは${z}よりおおきいです`,
          notText: `zざひょうは${z}よりおおきくありません`,
          evaluate: (gift: Gift) => gift.z > z,
        };
      },
    },
  ],
  wrapping: [
    {
      id: "wrapping_blue",
      category: "wrapping",
      create: (context: HintContext) => {
        return {
          text: "ラッピングのいろはあおです",
          notText: "ラッピングのいろはあおではありません",
          evaluate: (gift: Gift) => gift.wrapping === "blue",
        };
      },
    },
    {
      id: "wrapping_green",
      category: "wrapping",
      create: (context: HintContext) => {
        return {
          text: "ラッピングのいろはみどりです",
          notText: "ラッピングのいろはみどりではありません",
          evaluate: (gift: Gift) => gift.wrapping === "green",
        };
      },
    },
    {
      id: "wrapping_red",
      category: "wrapping",
      create: (context: HintContext) => {
        return {
          text: "ラッピングのいろはあかです",
          notText: "ラッピングのいろはあかではありません",
          evaluate: (gift: Gift) => gift.wrapping === "red",
        };
      },
    },
    {
      id: "wrapping_yellow",
      category: "wrapping",
      create: (context: HintContext) => {
        return {
          text: "ラッピングのいろはきいろです",
          notText: "ラッピングのいろはきいろではありません",
          evaluate: (gift: Gift) => gift.wrapping === "yellow",
        };
      },
    },
  ],
  ribbon: [
    {
      id: "ribbon_blue",
      category: "ribbon",
      create: (context: HintContext) => {
        return {
          text: "リボンのいろはあおです",
          notText: "リボンのいろはあおではありません",
          evaluate: (gift: Gift) => gift.ribbon === "blue",
        };
      },
    },
    {
      id: "ribbon_green",
      category: "ribbon",
      create: (context: HintContext) => {
        return {
          text: "リボンのいろはみどりです",
          notText: "リボンのいろはみどりではありません",
          evaluate: (gift: Gift) => gift.ribbon === "green",
        };
      },
    },
    {
      id: "ribbon_red",
      category: "ribbon",
      create: (context: HintContext) => {
        return {
          text: "リボンのいろはあかです",
          notText: "リボンのいろはあかではありません",
          evaluate: (gift: Gift) => gift.ribbon === "red",
        };
      },
    },
    {
      id: "ribbon_yellow",
      category: "ribbon",
      create: (context: HintContext) => {
        return {
          text: "リボンのいろはきいろです",
          notText: "リボンのいろはきいろではありません",
          evaluate: (gift: Gift) => gift.ribbon === "yellow",
        };
      },
    },
  ],
  position: [
    {
      id: "greater_tree_x",
      category: "position",
      create: (context: HintContext) => {
        const tree = context.landmarks["edu:christmas_tree_red"];
        return {
          text: "クリスマスツリーよりもxざひょうが大きいです",
          notText: "クリスマスツリーよりもxざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.x > tree.location.x,
        };
      },
    },
    {
      id: "greater_tree_z",
      category: "position",
      create: (context: HintContext) => {
        const tree = context.landmarks["edu:christmas_tree_red"];
        return {
          text: "クリスマスツリーよりもzざひょうが大きいです",
          notText: "クリスマスツリーよりもzざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.z > tree.location.z,
        };
      },
    },
    {
      id: "greater_snowman_x",
      category: "position",
      create: (context: HintContext) => {
        const snowman = context.landmarks["edu:snowman"];
        return {
          text: "ゆきだるまよりもxざひょうが大きいです",
          notText: "ゆきだるまよりもxざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.x > snowman.location.x,
        };
      },
    },
    {
      id: "greater_snowman_z",
      category: "position",
      create: (context: HintContext) => {
        const snowman = context.landmarks["edu:snowman"];
        return {
          text: "ゆきだるまよりもzざひょうが大きいです",
          notText: "ゆきだるまよりもzざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.z > snowman.location.z,
        };
      },
    },
    {
      id: "greater_bear_x",
      category: "position",
      create: (context: HintContext) => {
        const bear = context.landmarks["edu:stuffed_bear"];
        return {
          text: "くまのぬいぐるみよりもxざひょうが大きいです",
          notText: "くまのぬいぐるみよりもxざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.x > bear.location.x,
        };
      },
    },
    {
      id: "greater_bear_z",
      category: "position",
      create: (context: HintContext) => {
        const bear = context.landmarks["edu:stuffed_bear"];
        return {
          text: "くまのぬいぐるみよりもzざひょうが大きいです",
          notText: "くまのぬいぐるみよりもzざひょうが大きくありません",
          evaluate: (gift: Gift) => gift.z > bear.location.z,
        };
      },
    },
  ],
};
