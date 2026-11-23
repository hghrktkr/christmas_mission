import { systemMessage } from "./message";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
/** EntityがPlayerであるかどうかを確認する */
export function getPlayerFromEntity(entity, eventName) {
    if (entity === undefined) {
        systemMessage(`[${eventName}] Playerが存在しません`);
        return undefined;
    }
    if (entity.typeId !== MinecraftEntityTypes.Player) {
        systemMessage(`[${eventName}] EntityのtypeIdが${entity.typeId}です`);
        return undefined;
    }
    return entity;
}
//# sourceMappingURL=entity.js.map