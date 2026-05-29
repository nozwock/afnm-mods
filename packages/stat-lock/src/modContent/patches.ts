import { PhysicalStatistic, PlayerEntity, RootState } from 'afnm-types';
import { getSaveModData } from 'common/data';
import { definePatch, PatchManager } from 'common/patch';
import { produce } from 'immer';
import { defaultModConfig, ModConfig, saveConfigKey } from './config';
import { MOD_ID } from './const';

export const patchManager = new PatchManager();
export const patches = {
  lockPhysicalStats: definePatch({
    name: 'lockPhysicalStats',
    onEnable() {
      window.modAPI.hooks.onNewGame((intent) => {
        // `intent` here is mutable. No object path of the returned object should be frozen.
        // This might get changed in the future.
        this._tryLockStats(intent.player);
        return intent;
      });
      window.modAPI.hooks.onGameLoad((state) => {
        return produce(state, (state) => {
          this._tryLockStats(state.player.player, state);
        });
      });
      window.modAPI.hooks.onReduxAction((action, prevState, state) => {
        if (action === 'player/updatePlayer') {
          return produce(state, (state) => {
            this._tryLockStats(state.player.player, state);
          });
        }
        return state;
      });
    },
    _tryLockStats(
      player: PlayerEntity,
      state: Readonly<RootState> | undefined = undefined,
    ): void {
      const config =
        getSaveModData<ModConfig>(MOD_ID, saveConfigKey, state) ??
        defaultModConfig;
      if (!config.modEnabled) return;
      for (const [stat, it] of Object.entries(config.lockedPhysicalStats)) {
        if (it.locked)
          player.physicalStats[stat as PhysicalStatistic] = it.value;
      }
    },
  }),
};
