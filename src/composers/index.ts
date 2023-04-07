import {
  ConditionComposer,
  DecimalValueComposer,
  IntValueComposer,
  StringValueComposer,
  UintValueComposer,
  UpdateFnComposer,
} from './condition';
import { JobComposer } from './job';
import { MessageComposer } from './msg';
import { TemplateComposer } from './template';
import { VariableComposer } from './variable';

export * from './condition';
export * from './job';
export * from './msg';
export * from './template';
export * from './variable';

export const decimal = new DecimalValueComposer();
export const uint = new UintValueComposer();
export const int = new IntValueComposer();
export const string = new StringValueComposer();
export const cond = new ConditionComposer();
export const fn = new UpdateFnComposer();
export const msg = new MessageComposer();
export const template = new TemplateComposer();
export const job = new JobComposer();
export const variable = new VariableComposer();
