// テレポート関係

import { Dimension, Entity, InputPermissionCategory, Player, system, Vector3 } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";

let isTeleporting = new Set<string>();

export async function fadeTp(
  player: Player,
  loc: Vector3,
  fadeTick: number = 10,
  holdTick: number = 20
): Promise<void> {
  if (isTeleporting.has(player.id)) return;

  isTeleporting.add(player.id);

  try {
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
    player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, false);

    player.camera.fade();

    await system.waitTicks(fadeTick + holdTick / 2);

    const success = player.tryTeleport(loc);
    if (!success) {
      throw new Error("テレポートに失敗しました");
    }

    await system.waitTicks(fadeTick + holdTick / 2);
  } finally {
    if (player.isValid) {
      player.camera.clear();
      player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
      player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, true);
    }

    isTeleporting.delete(player.id);
  }
}

/** エンティティを歩かせる（テレポート使用） */
export async function entityWalk(
  dim: Dimension,
  typeId: string,
  from: Vector3,
  to: Vector3,
  name?: string,
  totalSecond: number = 5
): Promise<void> {
  const entity: Entity | undefined = dim.getEntities({
    type: typeId,
    name: name,
  })[0];

  if (!entity || !entity.isValid) return;

  const totalSteps: number = totalSecond / 0.5; // 何回teleportするか
  const step: Vector3 = {
    x: (to.x - from.x) / totalSteps,
    y: (to.y - from.y) / totalSteps,
    z: (to.z - from.z) / totalSteps,
  }; // 0.5秒あたりの移動成分

  let tpLoc: Vector3 = { ...from };

  for (let i = 0; i < totalSteps; i++) {
    tpLoc = Vector3Utils.add(tpLoc, step);
    entity.teleport(tpLoc, { keepVelocity: true });
    await system.waitTicks(10);
  }
}
