// メッセージ送信関係

import { Player, system, world } from "@minecraft/server";
import { isTestMode } from "../config/testMode";

let actionBarInterval: number | undefined;

/** 全プレイヤーにタイトル表示 */
export function broadcastTitle(title: string, subtitle: string = "") {
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
export async function resultTitle(player: Player, success: boolean = true): Promise<void> {
  return new Promise<void>((resolve) => {
    let count: number = 0;
    let title: string;
    success ? (title = "§a§lクリア！！") : (title = "§9§lざんねん・・・");

    const interval: number = system.runInterval(() => {
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
export function broadcastChat(message: string) {
  world.sendMessage(message);
}

/** アクションバー設定上書き　message=""のときは中止 */
export function setActionBar(player: Player, message: string) {
  // 既に表示中の場合は上書き
  if (actionBarInterval) {
    system.clearRun(actionBarInterval);
    actionBarInterval = undefined;
  }

  // メッセージが無い場合は中断のみ
  if (message === "") return;

  actionBarInterval = system.runInterval(() => {
    player.onScreenDisplay.setActionBar(message);
  }, 20);
}

/** テストモード時のみチャット送信（ログ用） */
export function systemMessage(text: string): void {
  if (isTestMode) {
    world.sendMessage(`§a[TEST MODE] ${text}`);
    console.log(`[TEST MODE] ${text}`);
  }
}
