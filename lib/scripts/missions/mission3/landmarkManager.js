import { world } from "@minecraft/server";
import { mission3Config } from "../../config/mission3Config";
import { systemMessage } from "../../utils/message";
export class LandmarkManager {
    constructor() {
        this.landmarkTypes = ["edu:christmas_tree_red", "edu:snowman", "edu:stuffed_bear"];
    }
    /** ランダムな位置にランドマークを生成 */
    spawnLandmarks(gifts) {
        this.removeLandmarks();
        const landmarks = {};
        this.landmarks = landmarks;
        // 座標のうち、Gift[]が使用していないものを抽出する
        const { origin, offset } = mission3Config;
        let locations = [];
        for (let x = origin.x; x <= origin.x + offset.x; x++) {
            for (let z = origin.z; z <= origin.z + offset.z; z++) {
                const isOccupied = gifts.some((gift) => x === gift.x && z === gift.z);
                if (isOccupied)
                    continue;
                locations.push({ x: x, y: origin.y, z: z });
            }
        }
        // 配置可能な最大数を確認
        const landmarkCount = this.landmarkTypes.length;
        if (landmarkCount > locations.length) {
            systemMessage(`[LandmarkManager spawnLandmarks] 設置可能数が足りません`);
            throw new Error(`[LandmarkManager spawnLandmarks] 設置可能数が足りません`);
        }
        // ランダムに取り出してスポーン
        for (const type of this.landmarkTypes) {
            try {
                const location = locations.splice(Math.floor(Math.random() * locations.length), 1)[0];
                const entity = world.getDimension(mission3Config.dimensionId).spawnEntity(type, location);
                // クリーンアップ用タグ付与
                entity.addTag("mission3_landmark");
                // 識別用タグ
                entity.addTag(`mission3_landmark_${type.replace(":", "_")}`);
                landmarks[type] = {
                    typeId: type,
                    location,
                };
            }
            catch (error) {
                systemMessage(`[LandmarkManager spawnLandmarks] error: ${error}`);
            }
        }
        return landmarks;
    }
    /** エンティティを削除する */
    removeLandmarks() {
        const entities = world.getDimension(mission3Config.dimensionId).getEntities({ tags: ["mission3_landmark"] });
        for (const entity of entities) {
            if (entity.isValid) {
                entity.remove();
            }
        }
        this.landmarks = undefined;
    }
    /** 保存済みのランドマーク情報を返す */
    getLandmarks() {
        if (!this.landmarks) {
            return {};
        }
        return {
            ...this.landmarks,
        };
    }
    /** 指定したtypeIdのランドマーク情報を返す */
    getLandmark(typeId) {
        return this.landmarks?.[typeId];
    }
    /** 指定したtypeIdのランドマークのEntityを返す */
    getLandmarkEntity(typeId) {
        if (!this.landmarks?.[typeId])
            return undefined;
        const tag = `mission3_landmark_${typeId.replace(":", "_")}`;
        const entity = world.getDimension(mission3Config.dimensionId).getEntities({ tags: [tag] })[0];
        if (!entity) {
            systemMessage(`[LandmarkManager getLandmarkEntity] ランドマークのエンティティが見つかりません: typeId=${typeId}`);
        }
        return entity;
    }
}
//# sourceMappingURL=landmarkManager.js.map