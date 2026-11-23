// メッセージ送信関係
import { system, world } from "@minecraft/server";
import { isTestMode } from "../config/testMode";
let actionBarInterval;
/** 全プレイヤーにタイトル表示 */
export function broadcastTitle(title, subtitle = "") {
    for (const player of world.getPlayers()) {
        player.onScreenDisplay.setTitle(title, {
            stayDuration: 100,
            fadeInDuration: 2,
            fadeOutDuration: 4,
            subtitle: subtitle,
        });
    }
}
/** クリア時の判定タイトル表示 */
export async function resultTitle(player, success = true) {
    return new Promise((resolve) => {
        let count = 0;
        let title;
        success ? (title = "§a§lクリア！！") : (title = "§9§lざんねん・・・");
        const interval = system.runInterval(() => {
            player.onScreenDisplay.setTitle("§6判定中・・・", {
                fadeInDuration: 5,
                stayDuration: 10,
                fadeOutDuration: 5,
            });
            count++;
            if (count >= 3) {
                system.clearRun(interval);
            }
        }, 20);
        system.runTimeout(() => {
            player.onScreenDisplay.setTitle(title, {
                fadeInDuration: 5,
                stayDuration: 20,
                fadeOutDuration: 5,
            });
        }, 80);
        system.runTimeout(() => {
            resolve();
        }, 110);
    });
}
/** チャット送信 */
export function broadcastChat(message) {
    world.sendMessage(message);
}
/** アクションバー設定上書き　message=""のときは中止 */
export function setActionBar(player, message) {
    // 既に表示中の場合は上書き
    if (actionBarInterval) {
        system.clearRun(actionBarInterval);
        actionBarInterval = undefined;
    }
    // メッセージが無い場合は中断のみ
    if (message === "")
        return;
    actionBarInterval = system.runInterval(() => {
        player.onScreenDisplay.setActionBar(message);
    }, 20);
}
/** テストモード時のみチャット送信（ログ用） */
export function systemMessage(text) {
    if (isTestMode) {
        world.sendMessage(`§a[TEST MODE] ${text}`);
        console.log(`[TEST MODE] ${text}`);
    }
}
//# sourceMappingURL=message.js.map