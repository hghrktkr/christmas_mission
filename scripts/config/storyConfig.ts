import { GameLevel } from "./gameConfig";

/**
 * ストーリーの進行状態
 */
export enum StoryState {
  OPENING = "OPENING",

  MISSION1_INTRO = "MISSION1_INTRO",
  MISSION_1 = "MISSION_1",
  MISSION1_CLEARED = "MISSION1_CLEARED",

  MISSION2_INTRO = "MISSION2_INTRO",
  MISSION_2 = "MISSION_2",
  MISSION2_CLEARED = "MISSION2_CLEARED",

  MISSION3_INTRO = "MISSION3_INTRO",
  MISSION_3 = "MISSION_3",
  MISSION3_CLEARED = "MISSION3_CLEARED",

  ENDING = "ENDING",
}

/**
 * ミッション識別子
 */
export type MissionId = "mission1" | "mission2" | "mission3";

/**
 * ミッションのクリア状況
 */
export interface MissionClearData {
  lv1: boolean;
  lv2: boolean;
  lv3: boolean;
}

/**
 * ストーリーの進行状況
 */
export interface StoryProgress {
  state: StoryState;
  missions: Record<MissionId, MissionClearData>;
}

/**
 * Dynamic Property
 */
export const STORY_PROGRESS_PROPERTY = "edu:story_progress";

/**
 * 初期クリア状況
 */
export const DEFAULT_MISSION_CLEAR_DATA: MissionClearData = {
  lv1: false,
  lv2: false,
  lv3: false,
};

/**
 * 初期ストーリー進行状況
 */
export const DEFAULT_STORY_PROGRESS: StoryProgress = {
  state: StoryState.OPENING,
  missions: {
    mission1: { ...DEFAULT_MISSION_CLEAR_DATA },
    mission2: { ...DEFAULT_MISSION_CLEAR_DATA },
    mission3: { ...DEFAULT_MISSION_CLEAR_DATA },
  },
};

/**
 * ミッションのクリア状況を取得
 */
export function isMissionCleared(clearData: MissionClearData): boolean {
  return clearData.lv1 && clearData.lv2;
}
