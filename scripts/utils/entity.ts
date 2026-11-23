import { Entity, Player } from "@minecraft/server";
import { systemMessage } from "./message";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

/** EntityがPlayerであるかどうかを確認する */
export function getPlayerFromEntity(entity: Entity | undefined, eventName: string): Player | undefined {
  if (entity === undefined) {
    systemMessage(`[${eventName}] Playerが存在しません`);
    return undefined;
  }

  if (entity.typeId !== MinecraftEntityTypes.Player) {
    systemMessage(`[${eventName}] EntityのtypeIdが${entity.typeId}です`);
    return undefined;
  }

  return entity as Player;
}
