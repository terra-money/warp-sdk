import { resolveExternalVariable } from '../variables';
import { warp_controller } from '../types/contracts';

describe('resolveExternalVariable', () => {
  it('resolves an external variable with the correct value', async () => {
    const externalVariable: warp_controller.ExternalVariable = {
      name: 'test',
      kind: 'uint',
      reinitialize: false,
      init_fn: {
        method: 'get',
        url: 'https://jsonplaceholder.typicode.com/posts',
        selector: '$[0]',
      },
    };

    const resolvedValue = await resolveExternalVariable(externalVariable);
    expect(JSON.parse(resolvedValue).userId).toEqual(1);
  });
});
