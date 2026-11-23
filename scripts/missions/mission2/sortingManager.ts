import { world, Vector3, ButtonPushAfterEvent, Player } from "@minecraft/server";
import { Mission2Config, GiftDefinition, SortingDestination } from "../../config/mission2Config";
import { broadcastTitle, systemMessage } from "../../utils/message";
import { isSameLocation } from "../../utils/location";

// 結果
export interface SortingResult {
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
  score: number;
}

export class SortingManager {
  private acceptingInput = false;

  private correctCount = 0;
  private incorrectCount = 0;

  private currentGiftData?: GiftDefinition;

  // コールバック用
  private onSortingDecided?: (
    player: Player,
    destination: SortingDestination,
    gift: GiftDefinition,
    isCorrect: boolean
  ) => void;

  // ボタン押下イベントハンドラ
  private sortingHandler?: (ev: ButtonPushAfterEvent) => void;

  /** スポーンしたプレゼントの情報をプロパティへ設定 */
  public setCurrentGiftData(gift: GiftDefinition): void {
    this.currentGiftData = gift;
    // ボタンの受付開始
    this.acceptingInput = true;
  }

  /** ボタン押下イベントの購読管理 */
  public startListening(player: Player, isTrue: boolean): void {
    // ボタン押下時に実行する処理
    const sorting = (ev: ButtonPushAfterEvent) => {
      const pushedLoc = ev.block.location;

      const destination = this.getDestination(pushedLoc);

      if (!this.acceptingInput) {
        systemMessage("[SortingManager startListening] inputがfalseです");
        return;
      }
      if (this.currentGiftData === undefined) {
        systemMessage("[SortingManager startListening] currentGiftDataがundefinedです");
        return;
      }
      if (destination === undefined) {
        systemMessage("[SortingManager startListening] destinationがundefinedです");
        return;
      }

      // 二重入力を防止
      this.stopInput();

      // 正解となる仕分け先
      const correctDestination: SortingDestination = isTrue ? "true" : "false";

      // ボタンを押した瞬間に正誤を確定
      const isCorrect = destination === correctDestination;

      isCorrect ? this.correctCount++ : this.incorrectCount++;

      broadcastTitle(isCorrect ? "§aせいかい！" : "§cざんねん・・・");
      const se = isCorrect ? "edu.good" : "edu.miss";
      player.playSound(se);

      // Mission2Managerから受け取った処理を実行する
      this.onSortingDecided?.(player, destination, this.currentGiftData, isCorrect);
    };

    this.sortingHandler = sorting;
    world.afterEvents.buttonPush.subscribe(sorting);
  }

  /** Mission2Managerで処理を登録する */
  public setOnSortingDecided(
    callback: (player: Player, destination: SortingDestination, gift: GiftDefinition, isCorrect: boolean) => void
  ): void {
    this.onSortingDecided = callback;
  }

  /** どの色の箱へ移動させたかを取得 */
  private getDestination(pushedLoc: Vector3): SortingDestination | undefined {
    for (const [key, value] of Object.entries(Mission2Config.destinations)) {
      const buttonLoc: Vector3 = value.button;

      // 座標が一致した色を返す
      if (isSameLocation(pushedLoc, buttonLoc)) {
        return key as SortingDestination;
      }
    }

    return undefined;
  }

  /** 結果を渡す */
  public getScore(): SortingResult {
    const total = this.correctCount + this.incorrectCount;
    const accuracy = total === 0 ? 0 : (this.correctCount / total) * 100;
    const score = Math.round(this.correctCount * accuracy);

    return {
      correct: this.correctCount,
      incorrect: this.incorrectCount,
      total,
      accuracy,
      score,
    };
  }

  /** ボタン入力を止める */
  public stopInput(): void {
    this.acceptingInput = false;

    if (this.sortingHandler) {
      world.afterEvents.buttonPush.unsubscribe(this.sortingHandler);
      this.sortingHandler = undefined;
    }
  }

  public reset(): void {
    this.acceptingInput = false;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.currentGiftData = undefined;
  }
}
