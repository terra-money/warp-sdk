import Big from 'big.js';
import { warp_controller } from '../types';

export function computeCreationFee(queueSize: Big, config: warp_controller.Config): Big {
  const x1 = Big(config.queue_size_left);
  const y1 = Big(config.creation_fee_min);
  const x2 = Big(config.queue_size_right);
  const y2 = Big(config.creation_fee_max);

  const slope = y2.minus(y1).div(x2.minus(x1));

  if (queueSize.lt(x1)) {
    return y1;
  } else if (queueSize.lt(x2)) {
    return slope.times(queueSize).plus(y1.minus(slope.times(x1)));
  } else {
    return y2;
  }
}

export function computeMaintenanceFee(durationDays: Big, config: warp_controller.Config): Big {
  const x1 = Big(config.duration_days_min);
  const y1 = Big(config.maintenance_fee_min);
  const x2 = Big(config.duration_days_max);
  const y2 = Big(config.maintenance_fee_max);

  const slope = y2.minus(y1).div(x2.minus(x1));

  if (durationDays.lt(x1)) {
    return y1;
  } else if (durationDays.lt(x2)) {
    return slope.times(durationDays).plus(y1.minus(slope.times(x1)));
  } else {
    return y2;
  }
}

export function computeBurnFee(jobReward: Big, config: warp_controller.Config): Big {
  const minFee: Big = Big(config.burn_fee_min);
  const calculatedFee = jobReward.times(config.burn_fee_rate).div(100);

  if (calculatedFee.gt(minFee)) {
    return calculatedFee;
  } else {
    return minFee;
  }
}

export function calculateDurationDaysAdjustmentFactor(durationDays: Big): Big {
  if (durationDays.lte(7)) {
    return Big(1);
  } else if (durationDays.gte(90)) {
    return Big(2);
  }

  return Big(1).add(durationDays.sub(7).mul(Big(1).div(83)));
}
