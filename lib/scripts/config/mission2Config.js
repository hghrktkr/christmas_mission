export const Mission2Config = {
    dimensionId: "overworld",
    // エンティティID
    giftEntityId: "edu:gift_box",
    craneEntityId: "edu:crane",
    // ゲーム時間
    timeLimitSeconds: 60,
    // プレゼントを提示する位置
    presentationPosition: {
        x: 10.5,
        y: 4.5,
        z: 28.5,
    },
    // プレゼントの搬送開始位置
    craneStartPosition: {
        x: 10.5,
        y: 6,
        z: 28.5,
    },
    // 仕分け先の位置
    destinations: {
        true: {
            button: { x: 3, y: 0, z: 20 },
            drop: { x: 18, y: 4.5, z: 28.5 },
        },
        false: {
            button: { x: 1, y: 0, z: 20 },
            drop: { x: 2, y: 4.5, z: 28.5 },
        },
    },
    // レベルごとの出題条件
    rules: {
        // Lv.1：単一条件
        lv1: [{ wrappingColor: "red" }, { wrappingColor: "blue" }, { ribbonColor: "yellow" }, { ribbonColor: "green" }],
        // Lv.2：AND条件
        lv2: [
            {
                operator: "AND",
                conditions: [{ wrappingColor: "red" }, { ribbonColor: "yellow" }],
            },
            {
                operator: "AND",
                conditions: [{ wrappingColor: "blue" }, { ribbonColor: "green" }],
            },
        ],
        // Lv.3：AND / OR条件
        lv3: [
            {
                operator: "OR",
                conditions: [{ wrappingColor: "red" }, { ribbonColor: "yellow" }],
            },
            {
                operator: "AND",
                conditions: [{ wrappingColor: "blue" }, { ribbonColor: "green" }],
            },
        ],
    },
    // クリア基準
    result: {
        lv1: {
            targetScore: 800,
        },
        lv2: {
            targetScore: 1000,
        },
        lv3: {
            targetScore: 1200,
        },
    },
    // 動作確認用の仮データ
    gifts: {
        lv1: [
            {
                id: "red-yellow",
                wrappingColor: "red",
                ribbonColor: "yellow",
            },
            {
                id: "blue-yellow",
                wrappingColor: "blue",
                ribbonColor: "yellow",
            },
            {
                id: "yellow-red",
                wrappingColor: "blue",
                ribbonColor: "red",
            },
        ],
        lv2: [
            {
                id: "red-yellow",
                wrappingColor: "red",
                ribbonColor: "yellow",
            },
            {
                id: "blue-yellow",
                wrappingColor: "blue",
                ribbonColor: "yellow",
            },
            {
                id: "yellow-red",
                wrappingColor: "blue",
                ribbonColor: "red",
            },
        ],
        lv3: [
            {
                id: "red-yellow",
                wrappingColor: "red",
                ribbonColor: "yellow",
            },
            {
                id: "blue-yellow",
                wrappingColor: "blue",
                ribbonColor: "yellow",
            },
            {
                id: "yellow-red",
                wrappingColor: "blue",
                ribbonColor: "red",
            },
        ],
    },
};
//# sourceMappingURL=mission2Config.js.map