import { PhysicalStatistic } from 'afnm-types';
import { GlobalConfig } from 'common/config';
import { baseGameState, MOD_ID } from './const';

interface ModConfigV1 {
  lockedPhysicalStats: Record<
    PhysicalStatistic,
    {
      locked: boolean;
      value: number;
    }
  >;
}

export type ModConfig = ModConfigV1;

const defaultModConfig: ModConfig = {
  lockedPhysicalStats: (
    Object.entries(baseGameState.player.player.physicalStats) as [
      PhysicalStatistic,
      number,
    ][]
  ).reduce(
    (acc, [stat, n]) => {
      acc[stat] = {
        locked: false,
        value: n,
      };
      return acc;
    },
    {} as ModConfig['lockedPhysicalStats'],
  ),
};

export const modConfig = new GlobalConfig(`${MOD_ID}.config`, defaultModConfig);
