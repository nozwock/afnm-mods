import { PhysicalStatistic } from 'afnm-types';
import { baseGameState } from './const';

interface ModConfigV1 {
  configVersion: number;
  modEnabled: boolean;
  lockedPhysicalStats: Record<
    PhysicalStatistic,
    {
      locked: boolean;
      value: number;
    }
  >;
}

export type ModConfig = ModConfigV1;

export const saveConfigKey = 'config';
export const defaultModConfig: ModConfig = {
  configVersion: 1,
  modEnabled: false,
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
