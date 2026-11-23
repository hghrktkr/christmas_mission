import { system } from "@minecraft/server";
import { Mission2Config } from "../../config/mission2Config";
import { broadcastChat, broadcastTitle, setActionBar, systemMessage } from "../../utils/message";
import { CraneManager } from "./craneManager";
import { GiftManager } from "./giftManager";
import { SortingManager } from "./sortingManager";
import { ActionFormData } from "@minecraft/server-ui";
// ミッション2の統括管理
export class Mission2Manager {
    constructor(lv) {
        this.startTime = 0;
        this.isRunning = false;
        this.sortingManager = new SortingManager();
        this.giftManager = new GiftManager();
        this.craneManager = new CraneManager();
        this.lv = lv;
        this.sortingManager.setOnSortingDecided((player, destination, gift, isCorrect) => {
            this.onSortingDecided(player, destination, gift, isCorrect).catch((error) => {
                systemMessage(`[Mission2Manager] エラーが発生しました: ${error}`);
            });
        });
    }
    async runGame(player) {
        this.initialize(player);
        this.currentRule = this.selectRandomRule();
        await this.ruleExplanation(player);
        broadcastTitle("§6ゲームスタート！！", `${Mission2Config.timeLimitSeconds}びょういないにプレゼントをたくさんしわけよう！`);
        player.playSound("edu.gong_start");
        this.isRunning = true;
        this.startTime = Date.now();
        player.playMusic("edu.mission2_bgm", { loop: true });
        await system.waitTicks(40);
        // 初回分
        this.set(player);
        while (this.isRunning) {
            const elapsed = this.getElapsedTime();
            if (elapsed >= Mission2Config.timeLimitSeconds) {
                this.isRunning = false;
                break;
            }
            await system.waitTicks(20);
        }
        await this.endGame(player);
    }
    /** 終了処理 */
    async endGame(player) {
        broadcastTitle(`§aしゅうりょう！！`);
        setActionBar(player, "");
        player.playSound("edu.gong");
        player.stopMusic();
        this.sortingManager.stopInput();
        // 残っているエンティティを削除
        this.giftManager.remove();
        this.craneManager.remove();
        const result = this.sortingManager.getScore();
        await system.waitTicks(60);
        // 結果表示
        await this.playResultEffect(player, result);
    }
    /** スコアに応じて結果表示 */
    async playResultEffect(player, result) {
        const targetScore = Mission2Config.result[this.lv].targetScore;
        const isClear = result.score >= targetScore;
        if (isClear) {
            broadcastTitle("§aゲームクリア！！");
            player.playSound("edu.clear");
            player.spawnParticle("edu:cane", player.location);
        }
        else {
            broadcastTitle("§c§lゲームオーバー・・・");
            player.playSound("edu.game_over");
        }
        await system.waitTicks(60);
        await this.showResult(player, result);
    }
    async showResult(player, result) {
        const targetScore = Mission2Config.result[this.lv].targetScore;
        const isClear = result.score >= targetScore;
        const status = isClear ? "§a§lミッションクリア！！" : "§c§lミッションしっぱい・・・";
        const message = [
            status,
            "",
            "§e【スコア】",
            `§f${result.score} てん / ${targetScore} てん`,
            "",
            "§e【しょうさい】",
            `§fせいかい：     ${result.correct}`,
            `§fふせいかい：   ${result.incorrect}`,
            `§fしわけたかず： ${result.total}`,
            "",
            "§e【せいとうりつ】",
            `§f${Math.round(result.accuracy)}パーセント`,
        ].join("\n");
        const form = new ActionFormData().title("§6ミッション2 リザルト").body(message).button("とじる");
        await form.show(player);
    }
    /** 経過時間の取得 */
    getElapsedTime() {
        return (Date.now() - this.startTime) / 1000;
    }
    /** チャットでレベルに応じた条件分岐を説明 */
    async ruleExplanation(player) {
        if (!this.currentRule) {
            throw new Error("[Mission2Manager ruleExplanation] 出題条件が設定されていません");
        }
        const description = this.getRuleDescription(this.currentRule);
        broadcastChat("========== 仕分けルール ==========");
        broadcastChat(`${description}のプレゼントは§l○のふくろ§rへ入れよう！`);
        broadcastChat("それいがいのプレゼントは§l×のふくろ§rへ入れよう！");
        broadcastChat("================================");
        await system.waitTicks(40);
        setActionBar(player, `${description}のプレゼントを○のふくろへ`);
    }
    /** 条件式を子ども向けの説明文に変換 */
    getRuleDescription(condition) {
        if ("wrappingColor" in condition) {
            return `ラッピングが${this.getColorName(condition.wrappingColor)}`;
        }
        if ("ribbonColor" in condition) {
            return `リボンが${this.getColorName(condition.ribbonColor)}`;
        }
        const descriptions = condition.conditions.map((c) => this.getRuleDescription(c));
        const operator = condition.operator === "AND" ? " かつ " : " または ";
        return `（${descriptions.join(operator)}）`;
    }
    /** 色の英語名を日本語に変換 */
    getColorName(color) {
        const colorNames = {
            blue: "§bあお§r",
            green: "§aみどり§r",
            red: "§cあか§r",
            yellow: "§6きいろ§r",
        };
        return colorNames[color];
    }
    initialize(player) {
        this.currentRule = undefined;
        this.startTime = 0;
        this.isRunning = false;
        this.craneManager.reset();
        this.sortingManager.reset();
        this.giftManager.remove();
        const dim = player.dimension;
        this.craneManager.cleanUp(dim);
        this.giftManager.cleanUp(dim);
    }
    /** クレーン、プレゼントのスポーン */
    set(player) {
        if (!this.isRunning)
            return;
        this.craneManager.spawn();
        const currentGift = this.giftManager.spawn(this.lv);
        this.sortingManager.setCurrentGiftData(currentGift.definition);
        // 正解の判定
        if (!this.currentRule) {
            systemMessage("[Mission2Manager set] 出題条件が設定されていません");
            throw new Error("[Mission2Manager set] 出題条件が設定されていません");
        }
        // 正解となる袋がどちらか判定
        const isTrue = this.giftManager.evaluateCondition(currentGift.definition, this.currentRule);
        broadcastTitle("§aただしいボタンをえらぼう！");
        // ボタン押下監視スタート
        this.sortingManager.startListening(player, isTrue);
    }
    /** ゲームの正解判定ルールをランダムに選択する */
    selectRandomRule() {
        const rules = Mission2Config.rules[this.lv];
        if (rules.length === 0) {
            systemMessage(`[Mission2Manager selectRandomRule] Lv.${this.lv} の出題条件が設定されていません。`);
            throw new Error(`[Mission2Manager selectRandomRule] Lv.${this.lv} の出題条件が設定されていません。`);
        }
        const index = Math.floor(Math.random() * rules.length);
        return rules[index];
    }
    // CraneManagerへわたす処理
    async onSortingDecided(player, destination, gift, isCorrect) {
        systemMessage("[Mission2Manager onSortingDecided] callback開始");
        if (!this.isRunning)
            return;
        const giftData = this.giftManager.getCurrentGift();
        if (giftData === undefined) {
            systemMessage("[Mission2Manager onSortingDecided] giftDataが見つかりません");
            return;
        }
        if (!giftData.entity.isValid) {
            systemMessage("[Mission2Manager onSortingDecided] プレゼントのエンティティが無効です");
            return;
        }
        // クレーンとプレゼントを移動させる
        await this.craneManager.transportGift(giftData.entity, destination);
        // 重力ON
        this.giftManager.enablePhysics();
        this.giftManager.startCheck();
        await system.waitTicks(10);
        // 元の位置に戻す
        await this.craneManager.resetCranePos();
        this.set(player);
    }
}
//# sourceMappingURL=mission2Manager.js.map