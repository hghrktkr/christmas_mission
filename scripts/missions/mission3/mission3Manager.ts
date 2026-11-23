import {
  ItemLockMode,
  ItemStack,
  ItemUseAfterEvent,
  Player,
  PlayerInteractWithEntityAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { GameLevel } from "../../config/gameConfig";
import { Gift, HintContext, Landmark, LandmarkType, mission3Config } from "../../config/mission3Config";
import { broadcastTitle, setActionBar, systemMessage } from "../../utils/message";
import { GiftManager } from "./giftManager";
import { HintGenerator, Mission3Question } from "./hintGenerator";
import { LandmarkManager } from "./landmarkManager";
import { ActionFormData } from "@minecraft/server-ui";

type ScoreData = {
  total: number;
  elapsed: number;
  timeScore: number;
  penalty: number;
  bonus: number;
};

export class Mission3Manager {
  private giftManager: GiftManager;
  private landmarkManager: LandmarkManager;
  private hintGenerator: HintGenerator;

  private lv: GameLevel;

  private question?: Mission3Question;

  /** 正解のプレゼントID */
  private correctGiftIds: Set<number> = new Set();

  /** 発見済みの正解プレゼントID */
  private foundGiftIds: Set<number> = new Set();

  /** 開封演出中のプレゼントID */
  private openingGiftIds: Set<number> = new Set();

  // 開けた数
  private openCount: number = 0;

  private isRunning: boolean = false;
  private isCleared: boolean = false;
  private startTime: number = 0;

  // アイテム使用検知ハンドラ
  private itemUseHandler?: (ev: ItemUseAfterEvent) => void;

  // プレゼントインタラクト検知ハンドラ
  private onInteractHandlear?: (ev: PlayerInteractWithEntityAfterEvent) => void;

  constructor(lv: GameLevel) {
    this.lv = lv;

    this.giftManager = new GiftManager();
    this.landmarkManager = new LandmarkManager();
    this.hintGenerator = new HintGenerator();
  }

  public async runGame(player: Player): Promise<void> {
    if (this.isRunning) return;
    systemMessage(`[Mission3Manager runGame] ゲーム開始`);

    // 前回の状態をリセット
    this.reset(player);

    this.isRunning = true;

    // ランダムにプレゼント生成
    const gifts = this.giftManager.spawnGifts(this.lv);

    // ランダムにランドマーク生成（Lv.3のみ）
    const landmarks =
      this.lv === "lv3" ? this.landmarkManager.spawnLandmarks(gifts) : ({} as Record<LandmarkType, Landmark>);

    // HintContext作成
    const hintContext: HintContext = {
      origin: mission3Config.origin,
      offset: mission3Config.offset,
      gifts,
      landmarks,
    };

    // 問題生成
    while (!this.question) {
      this.question = this.hintGenerator.generate(this.lv, hintContext);
    }
    // 正解をセット
    this.question.correctGiftIds.forEach((id) => this.correctGiftIds.add(id));

    // 問題の内容を表示
    // this.showQuestion();

    broadcastTitle("§6ゲームスタート！", "ヒントにあうプレゼントをぜんぶみつけよう！");
    player.playSound("edu.gong_start");
    this.startListeningOnUse();
    this.startListeningOnInteract();

    // アクションバー表示
    setActionBar(player, `みつけたプレゼント：§a${this.foundGiftIds.size} §r/ ${this.correctGiftIds.size}`);

    // アイテム付与
    const hintItem = new ItemStack("edu:hint", 1);
    hintItem.lockMode = ItemLockMode.inventory;
    player.addItem(hintItem);

    this.startTime = Date.now();

    while (this.isRunning) {
      const elapsed = this.getElapsedTime();
      const timeLimit = mission3Config.rules[this.lv].timeLimitSeconds;

      if (elapsed >= timeLimit) {
        this.isRunning = false;
        break;
      }

      const remaining = Math.floor(timeLimit - elapsed);
      if (remaining === 120) {
        broadcastTitle("§cのこり2ふん！");
      }
      if (remaining === 60) {
        broadcastTitle("§cのこり1ふん！");
      }

      systemMessage(`remaining: ${remaining}`);
      await system.waitTicks(20);
    }

    // 時間になってもゲームクリアしていなければ終了処理
    if (!this.isCleared) await this.endGame(player);
  }

  private getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  private showQuestion(): void {
    if (!this.question) return;

    this.question.hints.forEach((hint, index) => {
      systemMessage(`${index + 1}. ${hint.text}`);
    });

    if (this.question.orIndexes) {
      const [a, b] = this.question.orIndexes;
      systemMessage(`OR対象: ${a + 1}番目と${b + 1}番目`);
    }

    systemMessage(`正解のプレゼント数: ${this.question.correctGiftIds.length}`);
  }

  /** アイテム使用イベントの購読開始 */
  private startListeningOnUse(): void {
    this.itemUseHandler = (ev: ItemUseAfterEvent) => {
      if (ev.itemStack.typeId === "edu:hint") {
        // 誤操作防止のためにインタラクトをいったん禁止
        this.stopListeningOnInteract();
        void this.showHint(ev.source);
      }
    };

    world.afterEvents.itemUse.subscribe(this.itemUseHandler);
  }

  /** アイテム使用イベントの購読停止 */
  private stopListeningOnUse(): void {
    if (!this.itemUseHandler) return;
    world.afterEvents.itemUse.unsubscribe(this.itemUseHandler);
    this.itemUseHandler = undefined;
  }

  private startListeningOnInteract(): void {
    this.onInteractHandlear = async (ev: PlayerInteractWithEntityAfterEvent) => {
      systemMessage("[Mission3Manager startListeningOnInteract] エンティティをインタラクト");

      if (ev.target.typeId === "edu:gift_box") {
        systemMessage("[Mission3Manager startListeningOnInteract] gift_boxをインタラクト");
        const gift = this.giftManager.getGiftByEntity(ev.target);

        if (gift === undefined) {
          systemMessage(`[Mission3Manager startListeningOnInteract] giftIdが見つかりません`);
          return;
        }

        // 二重実行防止
        if (this.openingGiftIds.has(gift.id) || this.foundGiftIds.has(gift.id)) {
          return;
        }

        this.openingGiftIds.add(gift.id);

        try {
          await this.giftManager.playOpenAnimation(ev.player, gift.id);
          await this.check(ev.player, gift);
        } finally {
          this.giftManager.removeGiftEntity(gift.id);
          this.openingGiftIds.delete(gift.id);
        }
      }
    };

    world.afterEvents.playerInteractWithEntity.subscribe(this.onInteractHandlear);
  }

  private stopListeningOnInteract(): void {
    if (!this.onInteractHandlear) return;
    world.afterEvents.playerInteractWithEntity.unsubscribe(this.onInteractHandlear);
    this.onInteractHandlear = undefined;
  }

  /** 判定 */
  private async check(player: Player, gift: Gift): Promise<void> {
    this.openCount++;
    const isCorrect = this.correctGiftIds.has(gift.id);

    if (isCorrect) {
      broadcastTitle("§aせいかい！");
      player.playSound("edu.good");

      this.foundGiftIds.add(gift.id);

      // アクションバーの更新
      setActionBar(player, `みつけたプレゼント：§a${this.foundGiftIds.size} §r/ ${this.correctGiftIds.size}`);

      // 全問正解ならクリア
      if (this.foundGiftIds.size === this.correctGiftIds.size) {
        await system.waitTicks(20);

        await this.clearMission(player);
      }
    } else {
      broadcastTitle("§cざんねん・・・");
      player.playSound("edu.miss");
      await system.waitTicks(20);
    }
  }

  private async clearMission(player: Player): Promise<void> {
    this.isCleared = true;
    this.isRunning = false;
    this.stopListeningOnInteract();
    this.stopListeningOnUse();
    this.removeItem(player);

    broadcastTitle("§aゲームクリア！！");
    player.playSound("edu.clear");
    player.spawnParticle("edu:santa", player.location);
    await system.waitTicks(60);
    await this.showResult(player);
    setActionBar(player, "");
    this.reset(player);
  }

  private async endGame(player: Player): Promise<void> {
    this.isRunning = false;
    this.stopListeningOnInteract();
    this.stopListeningOnUse();
    this.removeItem(player);

    broadcastTitle("§c§lゲームオーバー・・・");
    player.playSound("edu.game_over");
    await system.waitTicks(60);
    await this.showResult(player);
    setActionBar(player, "");
    this.reset(player);
  }

  private removeItem(player: Player): void {
    // 持っているアイテムを削除
    player.runCommand("clear @s edu:hint");
  }

  /** ヒント表示（アイテム使用時用） */
  private async showHint(player: Player): Promise<void> {
    if (this.question === undefined) {
      systemMessage(`[Mission3Manager showHint] questionが見つかりません`);
      throw new Error(`[Mission3Manager showHint] questionが見つかりません`);
    }

    if (!this.isRunning || this.question === undefined) {
      return;
    }

    let message = ["§eせいかいをみつけるヒント", ""];

    this.question.hints.forEach((hint, index) => {
      const line = `ヒント${index + 1}： ${hint.text}`;
      message.push(line);
    });

    if (this.question.orIndexes) {
      const [a, b] = this.question.orIndexes;

      message.push("");
      message.push(`ヒント${a + 1}とヒント${b + 1}は、§6どちらかをみたせばOK！§r`);
    }

    message.push("");
    message.push("せいかいだとおもうプレゼントのはこをみつけたら、そのはこを§6みぎクリック§rしてあけてみよう！");

    const text = message.join("\n");

    const form = new ActionFormData().title("プレゼントさがしゲーム").body(text).button("とじる");
    try {
      await form.show(player);
    } finally {
      if (this.isRunning) {
        this.startListeningOnInteract();
      }
    }
  }

  // 結果表示
  private async showResult(player: Player): Promise<void> {
    const isCleared = this.isCleared;

    // 経過時間
    const timeLimit = mission3Config.rules[this.lv].timeLimitSeconds;
    const elapsed = Math.min(this.getElapsedTime(), timeLimit);

    // 発見数
    const foundCount = this.foundGiftIds.size;
    const correctCount = this.correctGiftIds.size;

    // 開けた回数
    const openedCount = this.openCount;

    // ミスの回数
    const mistakeCount = openedCount - foundCount;

    // 正解率（開けたプレゼントが0個の場合は0%）
    const accuracy = openedCount > 0 ? Math.floor((foundCount / openedCount) * 100) : 0;

    const title = isCleared ? "§aゲームクリア！！" : "§cゲームオーバー・・・";

    const resultText = isCleared ? "§aすべてのプレゼントをみつけたよ！" : "§cじかんぎれ！";

    const body = [
      resultText,
      "",
      `みつけたプレゼント： §e${foundCount} / ${correctCount}`,
      `プレゼントをあけたかず： §e${openedCount}回`,
      `せいかいりつ： §e${accuracy}パーセント`,
      `ミスしたかず： §c${mistakeCount}回`,
      `かかった時間： §e${this.formatTime(elapsed)}`,
    ];

    // クリア時のみスコアを表示
    if (isCleared) {
      const score = this.calculateScore();

      body.push(
        "",
        "§6§l★ スコア ★",
        `基本スコア： §e${score.timeScore}点`,
        `ミスによる減点： §c-${score.penalty}点`,
        `ボーナス： §a+${score.bonus}点`,
        "",
        `§6§lTOTAL： ${score.total}点`
      );
    }

    const form = new ActionFormData().title(title).body(body.join("\n")).button("とじる");

    await form.show(player);
  }

  private reset(player: Player): void {
    systemMessage(`[Mission3Manager reset] リセット処理`);

    this.stopListeningOnUse();
    this.stopListeningOnInteract();

    this.giftManager.removeGifts();
    this.landmarkManager.removeLandmarks();
    this.openCount = 0;
    this.startTime = 0;
    this.isRunning = false;
    this.isCleared = false;
    this.removeItem(player);

    this.question = undefined;
    this.correctGiftIds.clear();
    this.openingGiftIds.clear();
    this.foundGiftIds.clear();
  }

  /** 時間をmm:ssに変換 */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  /** スコア算出 */
  private calculateScore(): ScoreData {
    const elapsed = this.getElapsedTime();
    const mistakeCount = this.openCount - this.foundGiftIds.size;
    const timeLimitSeconds = mission3Config.rules[this.lv].timeLimitSeconds;

    const { baseScore, mistakePenalty, perfectBonus } = mission3Config.rules[this.lv].scoreConfig;

    // 残り時間に応じた基本スコア
    const timeScore = Math.floor(baseScore * Math.max(0, 1 - elapsed / timeLimitSeconds));

    // ミスによる減点
    const penalty = mistakeCount * mistakePenalty;

    // ミスなしボーナス
    const bonus = mistakeCount === 0 ? perfectBonus : 0;

    return {
      total: Math.max(0, timeScore - penalty + bonus),
      elapsed,
      timeScore,
      penalty,
      bonus,
    };
  }
}
