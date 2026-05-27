import { PhysicalStatistic, PlayerEntity } from 'afnm-types';
import { definePatch, PatchManager } from 'common/patch';
import { produce } from 'immer';
import { modConfig } from './config';

export const patchManager = new PatchManager();
export const patches = {
  lockPhysicalStats: definePatch({
    name: 'lockPhysicalStats',
    onEnable() {
      window.modAPI.hooks.onNewGame((intent) => {
        return produce(intent, (intent) => {
          this._tryLockStats(intent.player);
        });
      });
      window.modAPI.hooks.onGameLoad((state) => {
        return produce(state, (state) => {
          this._tryLockStats(state.player.player);
        });
      });
      window.modAPI.hooks.onReduxAction((action, prevState, state) => {
        if (action === 'player/updatePlayer') {
          return produce(state, (state) => {
            this._tryLockStats(state.player.player);
          });
        }
        return state;
      });
    },
    _tryLockStats(player: PlayerEntity) {
      const stats = modConfig.value.lockedPhysicalStats;
      for (const [stat, it] of Object.entries(stats)) {
        if (it.locked)
          player.physicalStats[stat as PhysicalStatistic] = it.value;
      }
    },
  }),
};
