export class NpcManager {
    /**
     * 該当するdataのNPCを返す
     * 複数スポーンしてしまっているときは削除
     */
    static get(data) {
        const { type, dim, pos } = data;
        const entities = dim.getEntities({
            type: type,
            location: pos,
            maxDistance: 1,
        });
        // 複数スポーンしてしまっているときは0番目以外を削除
        if (entities.length > 1) {
            for (let i = 1; i < entities.length; i++) {
                entities[i].remove();
            }
        }
        return entities.length === 0 ? undefined : entities[0];
    }
    /**
     * dataに該当するNPCをスポーン
     * 与えられたdataに該当するNPCが既に存在すれば消す
     */
    static spawn(data) {
        const { type, name, dim, pos } = data;
        // 既にスポーンしているか探索
        const entities = dim.getEntities({
            type: type,
            location: pos,
            maxDistance: 1,
        });
        if (entities.length > 0) {
            // 既にスポーンしてしまっているときはすべて削除
            entities.forEach((e) => {
                e.remove();
            });
        }
        const entity = dim.spawnEntity(type, pos);
        entity.nameTag = name;
        return entity;
    }
    static remove(data) {
        const { type, dim, pos } = data;
        // 既にスポーンしているか探索
        const entities = dim.getEntities({
            type: type,
            location: pos,
            maxDistance: 1,
        });
        entities.forEach((entity) => {
            entity.remove();
        });
    }
    static openDialogue(player, npc, dialogueKey) {
        const command = npc.runCommand(`dialogue open @s @p[name=${player.name}] ${dialogueKey}`);
        return command.successCount === 1;
    }
    static changeDialogue(npc, dialogueKey) {
        const command = npc.runCommand(`dialogue change @s ${dialogueKey}`);
        return command.successCount === 1;
    }
}
//# sourceMappingURL=npcManager.js.map