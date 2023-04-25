import { warp_controller } from './contracts';

export type AccountFund = warp_controller.Fund | { native: warp_controller.Coin };
