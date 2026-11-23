import { system } from "@minecraft/server";
import { GameLevel } from "../../config/gameConfig";
import { Gift, hintConfig, HintCategory, HintContext, HintSettings, mission3Config } from "../../config/mission3Config";
import { systemMessage } from "../../utils/message";

const MAX_GENERATION_ATTEMPTS = 300;

// 作成するヒントのカテゴリと数を指定する設定
export type GeneratedHint = {
  id: string;
  category: HintCategory;
  text: string;
  evaluate: (gift: Gift) => boolean;
};

export type Mission3Question = {
  hints: GeneratedHint[];
  orIndexes?: [number, number]; // hints内のORで結合するヒントのインデックス
  correctGiftIds: number[];
};

export class HintGenerator {
  private readonly categories: HintCategory[] = ["coordinate", "wrapping", "ribbon", "position"];

  /**
   * レベルに応じた問題を生成する
   */
  public generate(lv: GameLevel, context: HintContext): Mission3Question | undefined {
    const settings = mission3Config.rules[lv].hintSettings;
    const useOr = mission3Config.rules[lv].useOr;
    const useNot = mission3Config.rules[lv].useNot;
    const minCorrectGifts = mission3Config.rules[lv].minCorrectGifts;
    const maxCorrectGifts = mission3Config.rules[lv].maxCorrectGifts;

    this.validateSettings(settings, useOr);

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      // ヒントを抽出
      const hints = this.generateHints(settings, context, useNot);

      // OR対象を選択
      const orIndexes = useOr ? this.selectOrIndexes(hints.length) : undefined;

      // 全プレゼントを評価
      const correctGiftIds = context.gifts
        .filter((gift) => this.evaluateGift(gift, hints, orIndexes))
        .map((gift) => gift.id);

      // 正解数が1〜3個なら問題として採用
      if (correctGiftIds.length >= minCorrectGifts && correctGiftIds.length <= maxCorrectGifts) {
        return {
          hints,
          orIndexes,
          correctGiftIds,
        };
      }
    }

    return undefined;
  }

  /**
   * 設定に従ってヒントを抽出し、肯定・否定を決定する
   */
  private generateHints(settings: HintSettings, context: HintContext, useNot: boolean): GeneratedHint[] {
    const generatedHints: GeneratedHint[] = [];

    for (const category of this.categories) {
      const count = settings[category] ?? 0;
      if (count <= 0) continue;

      const candidates = this.pickRandom(hintConfig[category], count);

      for (const hint of candidates) {
        const result = hint.create(context);
        const isNot = useNot && Math.random() < 0.5;

        generatedHints.push({
          id: isNot ? `not_${hint.id}` : hint.id,
          category,
          text: isNot ? result.notText : result.text,
          evaluate: isNot ? (gift) => !result.evaluate(gift) : result.evaluate,
        });
      }
    }

    return generatedHints;
  }

  /**
   * ORで結合する2つのヒントのインデックスを選択する
   */
  private selectOrIndexes(hintCount: number): [number, number] {
    const indexes = Array.from({ length: hintCount }, (_, index) => index);

    const selected = this.pickRandom(indexes, 2);

    return [selected[0], selected[1]];
  }

  /**
   * プレゼントがヒントの条件を満たすか判定する
   */
  private evaluateGift(gift: Gift, hints: GeneratedHint[], orIndexes?: [number, number]): boolean {
    if (!orIndexes) {
      return hints.every((hint) => hint.evaluate(gift));
    }

    const [orIndexA, orIndexB] = orIndexes;

    return hints.every((hint, index) => {
      // OR対象のうち、先のインデックスでまとめて評価
      if (index === orIndexA) {
        return hints[orIndexA].evaluate(gift) || hints[orIndexB].evaluate(gift);
      }

      // OR対象のもう一方はここでは評価しない
      if (index === orIndexB) {
        return true;
      }

      // それ以外はANDで評価
      return hint.evaluate(gift);
    });
  }

  /**
   * 配列から重複なしでランダムに指定数を抽出する
   */
  private pickRandom<T>(items: T[], count: number): T[] {
    if (count > items.length) {
      throw new Error(`[HintGenerator] ヒント候補数が不足しています: required=${count}, available=${items.length}`);
    }

    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   * 設定値が正しいか確認する
   */
  private validateSettings(settings: HintSettings, useOr: boolean): void {
    const totalHintCount = this.categories.reduce((total, category) => total + (settings[category] ?? 0), 0);

    if (totalHintCount === 0) {
      throw new Error("[HintGenerator] ヒントが設定されていません");
    }

    if (useOr && totalHintCount < 2) {
      throw new Error("[HintGenerator] ORを使用するにはヒントが2つ以上必要です");
    }

    for (const category of this.categories) {
      const count = settings[category] ?? 0;

      if (count < 0 || !Number.isInteger(count)) {
        throw new Error(`[HintGenerator] 不正なヒント数です: category=${category}, count=${count}`);
      }

      if (count > hintConfig[category].length) {
        throw new Error(
          `[HintGenerator] ヒント候補数が不足しています: category=${category}, required=${count}, available=${hintConfig[category].length}`
        );
      }
    }
  }
}
