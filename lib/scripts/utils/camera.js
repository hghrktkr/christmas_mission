// カメラの制御関係
import { EasingType, system } from "@minecraft/server";
export class CameraController {
    static play(player, steps, options) {
        const id = player.id;
        // 既存停止
        this.stop(player);
        const handles = [];
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
                        easeType: step.easeType ?? EasingType.InOutSine,
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
    static stop(player) {
        const id = player.id;
        const handles = this.timeouts.get(id);
        if (handles) {
            handles.forEach(h => system.clearRun(h));
            this.timeouts.delete(id);
        }
        player.camera.clear();
    }
    static skip(player) {
        this.stop(player);
    }
}
CameraController.timeouts = new Map();
//# sourceMappingURL=camera.js.map