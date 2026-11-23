import { Dimension, system, world, type Entity, type Vector3 } from "@minecraft/server";
import { Mission2Config, type MoveTarget, type SortingDestination } from "../../config/mission2Config";
import { systemMessage } from "../../utils/message";

// クレーンの操作
export class CraneManager {
  private crane?: Entity;
  private moving = false;

  /** クレーンをスポーンさせる */
  public spawn(): Entity {
    const dimension = world.getDimension(Mission2Config.dimensionId);

    // 既にスポーンしている場合は消す
    this.remove();

    this.crane = dimension.spawnEntity(Mission2Config.craneEntityId, Mission2Config.craneStartPosition);
    // 一括削除用タグ
    this.crane.addTag("mission2_crane");

    return this.crane;
  }

  /** クレーンを消す */
  public remove(): void {
    if (this.crane === undefined) return;
    if (this.crane.isValid) this.crane.remove();
    this.crane = undefined;
  }

  /** 残存エンティティの消去 */
  public cleanUp(dim: Dimension): void {
    const cranes = dim.getEntities({
      tags: ["mission2_crane"],
    });

    for (const crane of cranes) {
      crane.remove();
    }
  }

  /** クレーンの位置を初期位置に戻す */
  public async resetCranePos(): Promise<void> {
    if (this.crane === undefined || !this.crane.isValid) {
      systemMessage(`[CraneManager resetCranePos] クレーンの状態異常: ${this.crane?.isValid}`);
      return;
    }
    if (this.moving) {
      systemMessage("[CraneManager resetCranePos] movingがtrueです");
      return;
    }

    this.moving = true;

    try {
      await this.moveTo([{ entity: this.crane, destination: Mission2Config.craneStartPosition }]);
    } catch (e) {
      systemMessage(`[CraneManager resetCranePos] エラー: ${e}`);
    } finally {
      this.moving = false;
    }
  }

  /** Mission2Managerから受け取った位置へプレゼントを運ぶ */
  public async transportGift(gift: Entity, destination: SortingDestination): Promise<void> {
    const crane = this.crane;

    if (!gift.isValid || !crane?.isValid) {
      systemMessage("[CraneManager transportGift] Entityが無効です");
      return;
    }

    if (this.moving) {
      systemMessage("[CraneManager transportGift] 移動中です");
      return;
    }

    this.moving = true;

    try {
      const dropPosition = Mission2Config.destinations[destination].drop;

      const craneDestination = {
        x: dropPosition.x,
        y: crane.location.y,
        z: dropPosition.z,
      };

      await this.moveTo([
        {
          entity: crane,
          destination: craneDestination,
        },
        {
          entity: gift,
          destination: dropPosition,
        },
      ]);

      await this.openArm(10);
    } catch (e) {
      systemMessage(`[CraneManager transportGift] エラー: ${e}`);
    } finally {
      this.moving = false;
    }
  }

  public reset(): void {
    this.remove();
    this.moving = false;
  }

  /** エンティティを指定位置まで動かす */
  private async moveTo(targets: MoveTarget[], durationTicks: number = 20): Promise<void> {
    if (durationTicks <= 0) {
      systemMessage(`[CraneManager moveTo] durationTicks${durationTicks}が不正です`);
      return;
    }

    const moveLocations = targets.map((target) => ({
      entity: target.entity,
      start: target.entity.location,
      destination: target.destination,
    }));

    for (let tick = 1; tick <= durationTicks; tick++) {
      await system.waitTicks(1);
      const t = tick / durationTicks;

      for (const target of moveLocations) {
        if (!target.entity.isValid) {
          systemMessage(`[CraneManager moveTo] エンティティ${target.entity.typeId}が無効です`);
          throw new Error(`[CraneManager moveTo] エンティティ${target.entity.typeId}が無効です`);
        }

        target.entity.teleport({
          x: target.start.x + (target.destination.x - target.start.x) * t,
          y: target.start.y + (target.destination.y - target.start.y) * t,
          z: target.start.z + (target.destination.z - target.start.z) * t,
        });
      }
    }
  }

  /** クレーンのアームを広げるアニメーション */
  private async openArm(animationTicks: number = 20): Promise<void> {
    if (this.crane === undefined || !this.crane.isValid) {
      systemMessage(`[CraneManager openArm] クレーンの状態異常: ${this.crane?.isValid}`);
      return;
    }

    this.crane.playAnimation("open_arm");
    await system.waitTicks(animationTicks);
  }

  /** クレーンのアームを閉じるアニメーション */
  private async closeArm(animationTicks: number = 20): Promise<void> {
    if (this.crane === undefined || !this.crane.isValid) {
      systemMessage(`[CraneManager closeArm] クレーンの状態異常: ${this.crane?.isValid}`);
      return;
    }

    this.crane.playAnimation("close_arm");
    await system.waitTicks(animationTicks);
  }
}
