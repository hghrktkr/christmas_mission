import { hintConfig, mission3Config } from "../../config/mission3Config";
const MAX_GENERATION_ATTEMPTS = 300;
export class HintGenerator {
    constructor() {
        this.categories = ["coordinate", "wrapping", "ribbon", "position"];
    }
    /**
     * レベルに応じた問題を生成する
     */
    generate(lv, context) {
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
    generateHints(settings, context, useNot) {
        const generatedHints = [];
        for (const category of this.categories) {
            const count = settings[category] ?? 0;
            if (count <= 0)
                continue;
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
    selectOrIndexes(hintCount) {
        const indexes = Array.from({ length: hintCount }, (_, index) => index);
        const selected = this.pickRandom(indexes, 2);
        return [selected[0], selected[1]];
    }
    /**
     * プレゼントがヒントの条件を満たすか判定する
     */
    evaluateGift(gift, hints, orIndexes) {
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
    pickRandom(items, count) {
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
    validateSettings(settings, useOr) {
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
                throw new Error(`[HintGenerator] ヒント候補数が不足しています: category=${category}, required=${count}, available=${hintConfig[category].length}`);
            }
        }
    }
}
//# sourceMappingURL=hintGenerator.js.map