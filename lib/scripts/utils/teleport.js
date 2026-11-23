// テレポート関係
import { InputPermissionCategory, system } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
let isTeleporting = new Set();
export async function fadeTp(player, loc, fadeTick = 10, holdTick = 20) {
    if (isTeleporting.has(player.id))
        return;
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
    }
    finally {
        if (player.isValid) {
            player.camera.clear();
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Camera, true);
        }
        isTeleporting.delete(player.id);
    }
}
/** エンティティを歩かせる（テレポート使用） */
export async function entityWalk(dim, typeId, from, to, name, totalSecond = 5) {
    const entity = dim.getEntities({
        type: typeId,
        name: name,
    })[0];
    if (!entity || !entity.isValid)
        return;
    const totalSteps = totalSecond / 0.5; // 何回teleportするか
    const step = {
        x: (to.x - from.x) / totalSteps,
        y: (to.y - from.y) / totalSteps,
        z: (to.z - from.z) / totalSteps,
    }; // 0.5秒あたりの移動成分
    let tpLoc = { ...from };
    for (let i = 0; i < totalSteps; i++) {
        tpLoc = Vector3Utils.add(tpLoc, step);
        entity.teleport(tpLoc, { keepVelocity: true });
        await system.waitTicks(10);
    }
}
//# sourceMappingURL=teleport.js.map