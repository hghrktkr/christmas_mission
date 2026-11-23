import { EntityDamageCause, InputPermissionCategory, system, world, } from "@minecraft/server";
import { mission1Config } from "../../config/mission1Config";
import { broadcastTitle, setActionBar, systemMessage } from "../../utils/message";
import { convertToDLoc, isSameLocation, makeBlockVolume, offset, toBlockLocation } from "../../utils/location";
import { fadeTp } from "../../utils/teleport";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
// ステージの破壊・復旧
export class Mission1StageManager {
    constructor(lv) {
        this.lv = lv;
    }
    /** ゲーム全体の処理 */
    async runGame(player) {
        const { rule } = this.getData();
        // 初期化
        this.initialize(player);
        if (this.survivals === undefined || this.deaths === undefined) {
            throw new Error("[Mission1StageManager runGame] 初期化失敗");
        }
        broadcastTitle("§6ゲームスタート！！");
        player.playMusic("edu.mission1_bgm", { loop: true });
        await system.waitTicks(30);
        // 必要回数までラウンドを繰り返す
        while (this.survivals <= rule.requiredSurvivals) {
            const resultRound = await this.runRound(player);
            // クリアまたはゲームオーバーの処理
            if (resultRound) {
                broadcastTitle(`§a${this.survivals}かいめクリア！`);
                player.playSound("edu.good");
                await system.waitTicks(20);
                this.survivals++;
            }
            else {
                this.deaths++;
                // 死亡回数で分岐
                if (this.deaths >= rule.maxDeaths) {
                    player.stopMusic();
                    await this.playDeathEffect(player);
                    setActionBar(player, "");
                    return;
                }
                else {
                    broadcastTitle("§bざんねん・・・");
                    player.playSound("edu.miss");
                    systemMessage(`[Mission1StageManager runGame] ${this.deaths}回死亡`);
                    await system.waitTicks(20);
                }
            }
        }
        // クリア処理を後で追加
        player.stopMusic();
        await this.playGameClearEffect(player);
        setActionBar(player, "");
    }
    /** lvに応じてデータ取得 */
    getData() {
        return mission1Config[this.lv];
    }
    /** 初期化 */
    initialize(player) {
        const { spawnPointRoom } = this.getData();
        const dLoc = convertToDLoc(player.dimension, spawnPointRoom);
        this.correctPos = undefined;
        this.survivals = 1;
        this.deaths = 0;
        // スポーンポイント更新
        player.setSpawnPoint(dLoc);
    }
    /** 正解となる座標を選択する */
    chooseRandomLoc() {
        const { stageOrigin, stageOffset } = this.getData();
        this.correctPos = {
            x: stageOrigin.x + Math.floor(Math.random() * (stageOffset.x + 1)),
            y: stageOrigin.y + Math.floor(Math.random() * (stageOffset.y + 1)) + 1,
            z: stageOrigin.z + Math.floor(Math.random() * (stageOffset.z + 1)),
        };
    }
    /** プレイヤーが正解の位置にいるか確認する */
    check(player) {
        if (!this.correctPos) {
            systemMessage(`[Mission1StageManager check] 正解の座標が${this.correctPos}です`);
            throw new Error(`[Mission1StageManager check] 正解の座標が${this.correctPos}です`);
        }
        const playerPos = toBlockLocation(player.location);
        systemMessage(`[Mission1StageManager check] player: (${playerPos.x}, ${playerPos.y}, ${playerPos.z})`);
        systemMessage(`[Mission1StageManager check] correct: (${this.correctPos.x}, ${this.correctPos.y}, ${this.correctPos.z})`);
        return isSameLocation(this.correctPos, playerPos);
    }
    /** 正解位置を表すタイトルの文面を、レベルに応じて作成する */
    makeCorrectPosText() {
        const { stageOrigin } = this.getData();
        if (!this.correctPos) {
            systemMessage(`[Mission1StageManager makeCorrectPosText] 正解の座標が${this.correctPos}です`);
            throw new Error(`[Mission1StageManager makeCorrectPosText] 正解の座標が${this.correctPos}です`);
        }
        let titleText = "";
        switch (this.lv) {
            case "lv1": {
                // lv1のとき：相対位置を作成して表示
                const relativePos = {
                    x: this.correctPos.x - stageOrigin.x + 1,
                    y: this.correctPos.z - stageOrigin.z + 1,
                };
                titleText = `§a(~${relativePos.x}, ~${relativePos.y})へいどうしよう！`;
                break;
            }
            case "lv2":
            case "lv3": {
                // lv2,3のとき：ワールド座標で表示
                titleText = `§a(${this.correctPos.x}, ${this.correctPos.y}, ${this.correctPos.z})へいどうしよう！`;
                break;
            }
            default:
                break;
        }
        return titleText;
    }
    /** プレイヤーをレベルに応じてスタート地点へ移動させる */
    async setStartPosition(player) {
        const { stageOrigin, stageOffset, spawnPointStage, rule } = this.getData();
        if (rule.randomRotate) {
            const randomLoc = {
                x: stageOrigin.x + Math.floor(Math.random() * (stageOffset.x + 1)),
                y: stageOrigin.y + Math.floor(Math.random() * (stageOffset.y + 1)) + 1,
                z: stageOrigin.z + Math.floor(Math.random() * (stageOffset.z + 1)),
            };
            const randomRot = {
                x: 0,
                y: Math.floor(Math.random() * 360),
            };
            await fadeTp(player, randomLoc, 3, 3);
            player.setRotation(randomRot);
        }
        else {
            const startLoc = {
                x: spawnPointStage.x,
                y: spawnPointStage.y + 1,
                z: spawnPointStage.z,
            };
            await fadeTp(player, startLoc, 3, 3);
            player.setRotation({ x: 0, y: 0 });
        }
    }
    /** 1ラウンドを実行する */
    async runRound(player) {
        const { rule } = this.getData();
        this.chooseRandomLoc();
        // スタート地点へ移動
        await this.setStartPosition(player);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
        // タイトル作成
        const correctText = this.makeCorrectPosText();
        // 正解位置を表示する処理
        broadcastTitle(correctText, `${rule.timeLimitSeconds}びょういないにたどりつこう`);
        setActionBar(player, correctText);
        await system.waitTicks(60);
        // スタートして動作開始
        broadcastTitle("§6スタート！");
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
        // 制限時間が経過するまで待機
        let currentSeconds = 0;
        while (currentSeconds < rule.timeLimitSeconds) {
            // 残り3秒になったらタイトルで残り秒数を表示する
            const timeLeft = rule.timeLimitSeconds - currentSeconds;
            if (timeLeft <= 3) {
                broadcastTitle(`§cのこり${timeLeft}びょう`);
                player.playSound("edu.switch");
            }
            currentSeconds++;
            // 1秒待つ
            await system.waitTicks(20);
        }
        return this.check(player);
    }
    /**
     * エフェクト関連
     */
    /** 死亡演出をランダムに選択して実行する */
    async playDeathEffect(player) {
        const { stageOrigin, stageOffset } = this.getData();
        // ステージ中央に固定
        const tpPos = {
            x: stageOrigin.x + stageOffset.x / 2,
            y: stageOrigin.y + 1,
            z: stageOrigin.z + stageOffset.z / 2,
        };
        player.teleport(tpPos);
        // タイトル表示
        broadcastTitle("§c§lゲームオーバー・・・");
        player.playSound("edu.game_over");
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
        await system.waitTicks(40);
        const effects = [
            () => this.playLavaEffect(player),
            () => this.playAnvilEffect(player),
            () => this.playExplosionEffect(player),
        ];
        const index = Math.floor(Math.random() * effects.length);
        player.playMusic("edu.alert");
        await effects[index]();
        player.stopMusic();
    }
    /** 溶岩を使った失敗演出 */
    async playLavaEffect(player) {
        const { stageOrigin, stageOffset } = this.getData();
        const originBelow = offset(stageOrigin, { x: 0, y: -1, z: 0 });
        const offsetBelow = offset(stageOffset, { x: 0, y: -1, z: 0 });
        // 溶岩の演出
        broadcastTitle("§cマグマだ！！");
        const volume = makeBlockVolume(stageOrigin, stageOffset);
        const volumeBelow = makeBlockVolume(originBelow, offsetBelow);
        player.dimension.fillBlocks(volumeBelow, MinecraftBlockTypes.Lava);
        player.dimension.fillBlocks(volume, MinecraftBlockTypes.Air);
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
        await system.waitTicks(40);
        player.applyDamage(200, { cause: EntityDamageCause.lava });
        // 演出終了まで待機
        const volumeFix = makeBlockVolume(stageOrigin, offsetBelow);
        player.dimension.fillBlocks(volumeFix, MinecraftBlockTypes.ChiseledStoneBricks);
    }
    /** 金床を使った失敗演出 */
    async playAnvilEffect(player) {
        const { stageOrigin, stageOffset } = this.getData();
        const startAbove = offset(stageOrigin, { x: 0, y: 6, z: 0 });
        await new Promise(async (resolve) => {
            let completed = false;
            // 共通処理：ダメージを与えて購読解除、resolve()
            const finish = async (applyDamage) => {
                // イベントとタイムアウトの二重実行を防ぐ
                if (completed)
                    return;
                completed = true;
                world.afterEvents.entityHurt.unsubscribe(handler);
                player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
                if (applyDamage) {
                    player.applyDamage(200, {
                        cause: EntityDamageCause.anvil,
                    });
                }
                await system.waitTicks(20);
                // 金床消去
                const startFix = offset(stageOrigin, { x: 0, y: 1, z: 0 });
                const volumeFix = makeBlockVolume(startFix, { x: 8, y: 3, z: 8 });
                player.dimension.fillBlocks(volumeFix, MinecraftBlockTypes.Air, {
                    blockFilter: {
                        includeTypes: [MinecraftBlockTypes.Anvil],
                    },
                });
                resolve();
            };
            // ダメージ検知イベント
            const handler = async (event) => {
                if (event.hurtEntity.id !== player.id)
                    return;
                if (event.damageSource.cause !== EntityDamageCause.anvil)
                    return;
                // 金床が命中したので追加ダメージを与える
                await finish(true);
            };
            // 購読開始
            world.afterEvents.entityHurt.subscribe(handler);
            // 金床の演出開始
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
            broadcastTitle("§c金床だ！！");
            await system.waitTicks(20);
            const volume = makeBlockVolume(startAbove, stageOffset);
            player.dimension.fillBlocks(volume, MinecraftBlockTypes.Anvil);
            // 3秒以内にイベントが発生しなければ、強制的にダメージを与える
            system.runTimeout(async () => {
                await finish(true);
            }, 60);
        });
    }
    /** 爆発を使った失敗演出 */
    async playExplosionEffect(player) {
        // 爆発の演出
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
        broadcastTitle("§cばくはつするー！！");
        await system.waitTicks(40);
        const countdown = [3, 2, 1];
        for (const num of countdown) {
            broadcastTitle(`§c${num}`);
            player.playSound("edu.switch");
            await system.waitTicks(20);
        }
        broadcastTitle("");
        // 演出終了まで待機
        player.spawnParticle("minecraft:huge_explosion_emitter", player.location);
        player.playSound("random.explode");
        player.applyDamage(200, { cause: EntityDamageCause.entityExplosion });
    }
    async playGameClearEffect(player) {
        broadcastTitle("§aゲームクリア！！");
        player.playSound("edu.clear");
        player.spawnParticle("edu:snowman", player.location);
    }
}
//# sourceMappingURL=mission1StageManager.js.map