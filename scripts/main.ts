import { world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { Mission1StageManager } from "./missions/mission1/mission1StageManager";
import { Mission2Manager } from "./missions/mission2/mission2Manager";
import { Mission3Manager } from "./missions/mission3/mission3Manager";

world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack.typeId === MinecraftItemTypes.Stick) {
    const mission1 = new Mission1StageManager("lv1");
    mission1.runGame(ev.source);
  }

  if (ev.itemStack.typeId === MinecraftItemTypes.EndRod) {
    const mission2 = new Mission2Manager("lv1");
    mission2.runGame(ev.source);
  }

  if (ev.itemStack.typeId === MinecraftItemTypes.BreezeRod) {
    const mission3 = new Mission3Manager("lv3");
    mission3.runGame(ev.source);
  }
});
