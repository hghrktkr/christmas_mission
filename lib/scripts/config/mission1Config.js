export const mission1Config = {
    lv1: {
        spawnPointRoom: { x: 5, y: 0, z: -3 },
        spawnPointStage: { x: 0, y: 0, z: 0 },
        stageOrigin: { x: 1, y: -1, z: 1 },
        stageOffset: { x: 8, y: 0, z: 8 }, // size = origin + offset
        rule: {
            requiredSurvivals: 5,
            maxDeaths: 3,
            timeLimitSeconds: 7,
            randomRotate: false,
        },
    },
    lv2: {
        spawnPointRoom: { x: 5, y: -64, z: -3 },
        spawnPointStage: { x: 0, y: -64, z: 0 },
        stageOrigin: { x: 0, y: -65, z: 0 },
        stageOffset: { x: 9, y: 0, z: 9 },
        rule: {
            requiredSurvivals: 7,
            maxDeaths: 3,
            timeLimitSeconds: 5,
            randomRotate: true,
        },
    },
    lv3: {
        spawnPointRoom: { x: 5, y: -64, z: -3 },
        spawnPointStage: { x: 0, y: -64, z: 0 },
        stageOrigin: { x: 0, y: -65, z: 0 },
        stageOffset: { x: 9, y: 0, z: 9 },
        rule: {
            requiredSurvivals: 9,
            maxDeaths: 3,
            timeLimitSeconds: 10,
            randomRotate: true,
        },
    },
};
//# sourceMappingURL=mission1Config.js.map