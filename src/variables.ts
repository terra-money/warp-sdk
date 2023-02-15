import { warp_controller } from 'types';
import * as jsonpath from 'jsonpath';
import axios from 'axios';

export const extractVariableName = (str: string) => {
  const parts = str.split('.');
  return parts[parts.length - 1];
};

export const variableName = (v: warp_controller.Variable): string => {
  if ('static' in v) {
    return v.static.name;
  }

  if ('external' in v) {
    return v.external.name;
  }

  return v.query.name;
};

export const resolveExternalVariable = async (external: warp_controller.ExternalVariable): Promise<string> => {
  const { init_fn } = external;
  const { body, method, selector, url } = init_fn;

  const options = {
    method: method ? method.toUpperCase() : 'GET',
    url,
    data: body,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const resp = await axios.request({ ...options, responseType: 'json' });
    const extracted = jsonpath.query(JSON.parse(resp.data), selector);

    if (extracted[0] == null) {
      return null;
    } else {
      return String(extracted[0]);
    }
  } catch (error) {
    console.error(`Error resolving external variable: ${error.message}`);
    return null;
  }
};

const resolveExternalInput = async (
  external: warp_controller.ExternalVariable
): Promise<warp_controller.ExternalInput> => {
  const input = await resolveExternalVariable(external);

  return { name: external.name, input };
};

export const resolveExternalInputs = async (
  variables: warp_controller.Variable[]
): Promise<warp_controller.ExternalInput[]> => {
  const externals = variables.filter((v) => 'external' in v) as Extract<warp_controller.Variable, { external: {} }>[];

  return Promise.all(externals.map((e) => resolveExternalInput(e.external)));
};
