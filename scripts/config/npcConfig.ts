import { Dimension, Vector3 } from "@minecraft/server";

export interface NpcData {
  type: string;
  name: string;
  dim: Dimension;
  pos: Vector3;
}
