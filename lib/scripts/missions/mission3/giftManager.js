import { system, world } from "@minecraft/server";
import { GiftType } from "../../config/gameConfig";
import { mission3Config } from "../../config/mission3Config";
import { systemMessage } from "../../utils/message";
import { showHintEffect } from "../../utils/effect";
export class GiftManager {
    /** フィールドの範囲内の重複しないランダムな位置にプレゼントを生成する */
    spawnGifts(lv) {
        systemMessage(`[GiftManager spawnGifts] スポーン処理`);
        this.removeGifts();
        const giftCount = mission3Config.rules[lv].spawnGiftCount;
        const gifts = [];
        this.gifts = gifts;
        // 配置可能な最大数を確認
        const maxCount = (mission3Config.offset.x + 1) * (mission3Config.offset.z + 1);
        if (giftCount > maxCount) {
            systemMessage(`[GiftManager spawnGifts] プレゼントの配置可能数を超えています: spawnGiftCount=${giftCount}, maxCount=${maxCount}`);
            throw new Error("[GiftManager spawnGifts] プレゼントの配置可能数を超えています");
        }
        while (gifts.length < giftCount) {
            const x = Math.floor(mission3Config.origin.x + Math.random() * (mission3Config.offset.x + 1));
            const z = Math.floor(mission3Config.origin.z + Math.random() * (mission3Config.offset.z + 1));
            systemMessage(`[GiftManager spawnGifts] 選択した座標: (x: ${x}, z: ${z})`);
            // すでに同じ座標のプレゼントが存在する場合はスキップ
            if (gifts.some((gift) => gift.x === x && gift.z === z)) {
                systemMessage(`[GiftManager spawnGifts] スキップ`);
                continue;
            }
            // 重複がないように色を選択
            const colors = ["blue", "green", "red", "yellow"];
            const wrapping = colors.splice(Math.floor(Math.random() * colors.length), 1)[0];
            const ribbon = colors[Math.floor(Math.random() * colors.length)];
            const giftTypeIndex = this.getGiftColorIndex(wrapping, ribbon);
            systemMessage(`[GiftManager spawnGifts] 選択した色: (wrapping: ${wrapping}, ribbon: ${ribbon})`);
            if (giftTypeIndex === undefined) {
                systemMessage(`[GiftManager spawnGifts] 該当する色の組み合わせが見つかりません: wrapping=${wrapping}, ribbon=${ribbon}`);
                throw new Error(`[GiftManager spawnGifts] 該当する色の組み合わせが見つかりません: wrapping=${wrapping}, ribbon=${ribbon}`);
            }
            try {
                const giftEntity = world
                    .getDimension(mission3Config.dimensionId)
                    .spawnEntity("edu:gift_box", { x: x, y: mission3Config.origin.y, z: z });
                giftEntity.setProperty("edu:gift_type", giftTypeIndex);
                giftEntity.triggerEvent("edu:physics_enabled");
                // クリーンアップ用タグ付与
                giftEntity.addTag("mission3_gift");
                // 識別用タグ付与
                giftEntity.addTag(`mission3_gift_${this.gifts.length}`);
                gifts.push({
                    id: this.gifts.length,
                    x,
                    z,
                    wrapping: wrapping,
                    ribbon: ribbon,
                });
            }
            catch (error) {
                systemMessage(`[GiftManager spawnGifts] error: ${error}`);
                throw new Error(`[GiftManager spawnGifts] error: ${error}`);
            }
        }
        return gifts;
    }
    /** フィールドに存在するプレゼントを削除する   */
    removeGifts() {
        world
            .getDimension(mission3Config.dimensionId)
            .getEntities({ tags: ["mission3_gift"] })
            .forEach((entity) => {
            if (entity.isValid) {
                entity.remove();
            }
        });
        this.gifts = undefined;
    }
    removeGiftEntity(giftId) {
        const entity = this.getGiftEntity(giftId);
        if (entity && entity.isValid) {
            entity.remove();
        }
    }
    /**
     * すべてのGiftを取得する
     */
    getGifts() {
        return this.gifts ?? [];
    }
    /**
     * Giftに対応するエンティティを取得する
     */
    getGiftEntity(giftId) {
        return world.getDimension(mission3Config.dimensionId).getEntities({ tags: [`mission3_gift_${giftId}`] })[0];
    }
    /**
     * IDからGiftを取得する
     */
    getGift(giftId) {
        return this.gifts?.find((gift) => gift.id === giftId);
    }
    /**
     * エンティティに対応するGiftを取得する
     */
    getGiftByEntity(entity) {
        const idTag = entity.getTags().find((tag) => tag.startsWith("mission3_gift_"));
        if (!idTag)
            return undefined;
        const id = Number(idTag.replace("mission3_gift_", ""));
        if (!Number.isInteger(id)) {
            systemMessage(`[GiftManager getGiftByEntity] Gift IDが不正です: ${id}`);
            return undefined;
        }
        return this.getGift(id);
    }
    async playOpenAnimation(player, giftId, durationTicks = 30) {
        const giftEntity = this.getGiftEntity(giftId);
        if (giftEntity === undefined || !giftEntity.isValid) {
            systemMessage(`[GiftManager playOpenanimation] 該当のアニメーションはありません: giftId = ${giftId}`);
            return;
        }
        giftEntity.playAnimation("open_box");
        showHintEffect(player, giftEntity, 10);
        await system.waitTicks(durationTicks);
    }
    getGiftColorIndex(wrapping, ribbon) {
        return GiftType[`${wrapping.toUpperCase()}_${ribbon.toUpperCase()}`];
    }
}
//# sourceMappingURL=giftManager.js.map