import { Entity, Player, system } from "@minecraft/server";

// エンティティの周囲を光らせる
export function showHintEffect(player: Player, entity: Entity, durationTicks: number = 40) {
  let tick = 0;

  const intervalId = system.runInterval(() => {
    tick++;

    const pos = entity.location;

    // アイテムの周囲にパーティクル
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;

      player.spawnParticle("minecraft:critical_hit_emitter", {
        x: pos.x + Math.cos(rad) * 0.2,
        y: pos.y + 0.2,
        z: pos.z + Math.sin(rad) * 0.2,
      });
    }

    if (tick >= durationTicks) {
      system.clearRun(intervalId);
    }
  }, 1);
}
