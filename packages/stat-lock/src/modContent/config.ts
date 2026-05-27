import { PhysicalStatistic } from 'afnm-types';
import { GlobalConfig } from 'common/config';
import { baseGameState, MOD_ID } from './const';

interface ModConfigV1 {
  lockedPhysicalStats: Record<PhysicalStatistic, number>;
}

export type ModConfig = ModConfigV1;

const defaultModConfig: ModConfig = {
  lockedPhysicalStats: baseGameState.player.player.physicalStats,
};

export const modConfig = new GlobalConfig(`${MOD_ID}.config`, defaultModConfig);
