// カメラの制御関係
import { EasingType, Player, system, Vector3 } from "@minecraft/server";

export type CameraKeyframe = {
  location: Vector3;

  lookAt?: Vector3;
  rotation?: { x: number; y: number };

  duration: number; // 秒
  easeType?: EasingType;

  onStart?: () => void;
  onEnd?: () => void;
};

export type CameraSequenceOptions = {
  onComplete?: () => void;
  skippable?: boolean;
};

export class CameraController {

  private static timeouts = new Map<string, number[]>();

  static play(
    player: Player,
    steps: CameraKeyframe[],
    options?: CameraSequenceOptions
  ) {
    const id = player.id;

    // 既存停止
    this.stop(player);

    const handles: number[] = [];
    let accumulatedTick = 0;

    steps.forEach((step, index) => {

      const tickDelay = accumulatedTick;

      const handle = system.runTimeout(() => {

        step.onStart?.();

        player.camera.setCamera("minecraft:free", {
          location: step.location,

          ...(step.lookAt
            ? { facingLocation: step.lookAt }
            : step.rotation
            ? { rotation: step.rotation }
            : {}),

          easeOptions: {
            easeTime: step.duration,
            easeType:  step.easeType ?? EasingType.InOutSine,
          }
        });

        // 終了イベント
        const endHandle = system.runTimeout(() => {
          step.onEnd?.();

          if (index === steps.length - 1) {
            options?.onComplete?.();
          }
        }, step.duration * 20);

        handles.push(endHandle);

      }, tickDelay);

      handles.push(handle);

      accumulatedTick += step.duration * 20;
    });

    this.timeouts.set(id, handles);
  }

  static stop(player: Player) {
    const id = player.id;
    const handles = this.timeouts.get(id);

    if (handles) {
      handles.forEach(h => system.clearRun(h));
      this.timeouts.delete(id);
    }

    player.camera.clear();
  }

  static skip(player: Player) {
    this.stop(player);
  }
}