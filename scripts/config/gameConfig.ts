export type GameLevel = "lv1" | "lv2" | "lv3";

// プレゼントの識別
export type WrappingColor = "blue" | "green" | "red" | "yellow";
export type RibbonColor = "blue" | "green" | "red" | "yellow";

/** プレゼントの色パターン */
export const GiftType = {
  BLUE_GREEN: 0,
  BLUE_RED: 1,
  BLUE_YELLOW: 2,
  GREEN_BLUE: 3,
  GREEN_RED: 4,
  GREEN_YELLOW: 5,
  RED_BLUE: 6,
  RED_GREEN: 7,
  RED_YELLOW: 8,
  YELLOW_BLUE: 9,
  YELLOW_GREEN: 10,
  YELLOW_RED: 11,
} as const;
