import Big from 'big.js';

export function max(a: Big, b: Big): Big {
  return a.cmp(b) >= 0 ? a : b;
}

export function min(a: Big, b: Big): Big {
  return a.cmp(b) <= 0 ? a : b;
}
