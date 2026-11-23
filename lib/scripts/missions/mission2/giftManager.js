import { system, world } from "@minecraft/server";
import { Mission2Config } from "../../config/mission2Config";
import { GiftType } from "../../config/gameConfig";
import { systemMessage } from "../../utils/message";
// プレゼントの箱の管理
export class GiftManager {
    /** レベルに応じてランダムな見た目のプレゼントをスポーンさせる */
    spawn(lv) {
        const gifts = Mission2Config.gifts[lv];
        if (gifts.length === 0) {
            systemMessage(`[GiftManager spawn] レベル${lv}のプレゼント定義がありません`);
            throw new Error("Gift definition is empty.");
        }
        const randomIndex = Math.floor(Math.random() * gifts.length);
        const definition = gifts[randomIndex];
        const typeId = Mission2Config.giftEntityId;
        const dimension = world.getDimension(Mission2Config.dimensionId);
        const location = Mission2Config.presentationPosition;
        const colorIndex = this.getGiftColorIndex(definition);
        if (colorIndex === undefined) {
            systemMessage("[GiftManager spawn] 該当する色の組み合わせがありません");
            throw new Error("[GiftManager spawn] 該当する色の組み合わせがありません");
        }
        // 既にプレゼントが存在する場合は消す
        this.remove();
        const entity = dimension.spawnEntity(typeId, location);
        // テクスチャの変更
        entity.setProperty("edu:gift_type", colorIndex);
        // 一括削除用タグ
        entity.addTag("mission2_gift");
        this.currentGift = {
            entity,
            definition,
        };
        return this.currentGift;
    }
    /** プレゼントの情報を消す */
    remove() {
        if (this.currentGift === undefined) {
            return;
        }
        if (this.currentGift.entity.isValid) {
            this.currentGift.entity.remove();
        }
        this.stopCheck();
        this.currentGift = undefined;
    }
    /** 残存エンティティの消去 */
    cleanUp(dim) {
        const gifts = dim.getEntities({
            tags: ["mission2_gift"],
        });
        for (const gift of gifts) {
            gift.remove();
        }
    }
    getCurrentGift() {
        return this.currentGift;
    }
    /** 重力をONにするイベントを発火する */
    enablePhysics() {
        if (!this.currentGift) {
            systemMessage("[GiftManager setPhysics] プレゼントのデータがありません");
            return;
        }
        this.currentGift.entity.triggerEvent("edu:physics_enabled");
    }
    /** プレゼント消去の監視開始 */
    startCheck() {
        if (this.checkId !== undefined) {
            systemMessage("[GiftManager startCheck] 既に監視中です");
            return;
        }
        this.checkId = system.runInterval(() => {
            this.checkCollected();
        }, 5);
    }
    /** プレゼント消去監視の終了 */
    stopCheck() {
        if (this.checkId === undefined) {
            systemMessage("[GiftManager stopCheck] 監視はすでに終了しています");
            return;
        }
        system.clearRun(this.checkId);
        this.checkId = undefined;
    }
    /** 地面に落ちたプレゼントを消す */
    checkCollected() {
        if (!this.currentGift) {
            systemMessage("[GiftManager checkCollected] プレゼントのデータがありません");
            this.stopCheck();
            return;
        }
        if (!this.currentGift.entity.isValid) {
            this.currentGift = undefined;
            return;
        }
        const belowBlock = this.currentGift.entity.getBlockStandingOn();
        if (belowBlock) {
            this.remove();
        }
    }
    /** スポーンしたプレゼントの行先を評価する */
    evaluateCondition(gift, condition) {
        // 単一条件
        if ("wrappingColor" in condition) {
            return gift.wrappingColor === condition.wrappingColor;
        }
        if ("ribbonColor" in condition) {
            return gift.ribbonColor === condition.ribbonColor;
        }
        // AND条件
        if (condition.operator === "AND") {
            return condition.conditions.every((c) => this.evaluateCondition(gift, c));
        }
        // OR条件
        return condition.conditions.some((c) => this.evaluateCondition(gift, c));
    }
    /** 色の組み合わせからpropertyに送る数値を返す */
    getGiftColorIndex(definition) {
        switch (definition.wrappingColor) {
            case "blue":
                switch (definition.ribbonColor) {
                    case "green":
                        return GiftType.BLUE_GREEN;
                    case "red":
                        return GiftType.BLUE_RED;
                    case "yellow":
                        return GiftType.BLUE_YELLOW;
                    default:
                        return undefined;
                }
            case "green":
                switch (definition.ribbonColor) {
                    case "blue":
                        return GiftType.GREEN_BLUE;
                    case "red":
                        return GiftType.GREEN_RED;
                    case "yellow":
                        return GiftType.GREEN_YELLOW;
                    default:
                        return undefined;
                }
            case "red":
                switch (definition.ribbonColor) {
                    case "blue":
                        return GiftType.RED_BLUE;
                    case "green":
                        return GiftType.RED_GREEN;
                    case "yellow":
                        return GiftType.RED_YELLOW;
                    default:
                        return undefined;
                }
            case "yellow":
                switch (definition.ribbonColor) {
                    case "blue":
                        return GiftType.YELLOW_BLUE;
                    case "green":
                        return GiftType.YELLOW_GREEN;
                    case "red":
                        return GiftType.YELLOW_RED;
                    default:
                        return undefined;
                }
            default:
                return undefined;
        }
    }
}
//# sourceMappingURL=giftManager.js.map