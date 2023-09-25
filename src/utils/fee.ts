import Big from 'big.js';
import { max } from './big';
import { NativeToken, NATIVE_TOKENS } from './token';

type FeeConfig = {
  creationFeeMin: number;
  creationFeeMax: number;
  burnFeeMin: number;
  maintenanceFeeMin: number;
  maintenanceFeeMax: number;
  nativeToken: NativeToken;
};

export const feeConfigByChainId: Record<string, FeeConfig> = {
  'pisco-1': {
    creationFeeMin: 0.5,
    creationFeeMax: 100,
    burnFeeMin: 0.1,
    maintenanceFeeMin: 0.05,
    maintenanceFeeMax: 10,
    nativeToken: NATIVE_TOKENS.LUNA,
  },
  'phoenix-1': {
    creationFeeMin: 0.5,
    creationFeeMax: 100,
    burnFeeMin: 0.1,
    maintenanceFeeMin: 0.05,
    maintenanceFeeMax: 10,
    nativeToken: NATIVE_TOKENS.LUNA,
  },
  'pion-1': {
    creationFeeMin: 1,
    creationFeeMax: 200,
    burnFeeMin: 0.5,
    maintenanceFeeMin: 0.1,
    maintenanceFeeMax: 20,
    nativeToken: NATIVE_TOKENS.NEUTRON,
  },
  'neutron-1': {
    creationFeeMin: 1,
    creationFeeMax: 200,
    burnFeeMin: 0.5,
    maintenanceFeeMin: 0.1,
    maintenanceFeeMax: 20,
    nativeToken: NATIVE_TOKENS.NEUTRON,
  },
  'injective-1': {
    creationFeeMin: 0.05,
    creationFeeMax: 10,
    burnFeeMin: 0.025,
    maintenanceFeeMin: 0.005,
    maintenanceFeeMax: 1,
    nativeToken: NATIVE_TOKENS.INJ,
  },
  'injective-888': {
    creationFeeMin: 0.05,
    creationFeeMax: 10,
    burnFeeMin: 0.025,
    maintenanceFeeMin: 0.005,
    maintenanceFeeMax: 1,
    nativeToken: NATIVE_TOKENS.INJ,
  },
};

export function computeCreationFee(queue_size: number, feeConfig: FeeConfig): Big {
  const x1 = 5000;
  const y1 = feeConfig.creationFeeMin;
  const x2 = 50000;
  const y2 = feeConfig.creationFeeMax;

  const slope = (y2 - y1) / (x2 - x1);
  const y_intercept = y1 - slope * x1;

  if (queue_size < x1) {
    return Big(feeConfig.creationFeeMin);
  } else if (queue_size < x2) {
    return Big(slope * queue_size + y_intercept);
  } else {
    return Big(feeConfig.creationFeeMax);
  }
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function smoothTransition(x: number, min: number, max: number, k: number = 0.2): number {
  const a = min;
  const b = max;
  const c = (max + min) / 2;

  const sigmoid_val = sigmoid(k * (x - c));

  return a + (b - a) * sigmoid_val;
}

export function computeMaintenanceFee(duration_days: number, feeConfig: FeeConfig, k: number = 0.2): Big {
  if (duration_days < 10) {
    return Big(feeConfig.maintenanceFeeMin);
  } else if (duration_days <= 100) {
    return Big(smoothTransition(duration_days, feeConfig.maintenanceFeeMin, feeConfig.maintenanceFeeMax, k));
  } else {
    return Big(feeConfig.maintenanceFeeMax);
  }
}

export function computeBurnFee(jobReward: Big, feeConfig: FeeConfig): Big {
  return max(Big(feeConfig.burnFeeMin), jobReward.mul(0.25));
}
