import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi, integrated, recordsApi, request } from '../services/api';
afterEach(() => vi.unstubAllGlobals());
function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Django request boundary', () => {
  it('uses session cookies and rotated CSRF tokens for writes', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ csrf_token: 'first' }))
      .mockResolvedValueOnce(
        response({ csrf_token: 'rotated', user: { id: 1 } }),
      )
      .mockResolvedValueOnce(response({ user: null }));
    vi.stubGlobal('fetch', fetch);
    await authApi.session();
    await authApi.login({ login: 'provider', password: 'secret' });
    await authApi.logout();
    expect(fetch.mock.calls[1][1]).toMatchObject({
      credentials: 'same-origin',
      redirect: 'error',
      headers: { 'X-CSRFToken': 'first' },
    });
    expect(fetch.mock.calls[2][1].headers['X-CSRFToken']).toBe('rotated');
  });
  it.each([401, 403, 404, 500])(
    'handles HTTP %s without success',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(response({ message: 'Failure' }, status)),
      );
      await expect(request('/verified-test-endpoint/')).rejects.toMatchObject({
        status,
      });
    },
  );
  it('never accepts HTML as confirmation of a save', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Login</html>', {
            headers: { 'Content-Type': 'text/html' },
          }),
        ),
    );
    await expect(request('/verified-test-endpoint/')).rejects.toThrow(
      'No save was confirmed',
    );
  });
  it('handles an unreachable server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Network failure')),
    );
    await expect(authApi.session()).rejects.toMatchObject({ status: 0 });
  });
  it('pending record operations do not issue requests', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const operation of Object.values(recordsApi))
      await expect(operation()).rejects.toMatchObject({ pending: true });
    expect(fetch).not.toHaveBeenCalled();
    expect(Object.values(integrated).every((value) => value === false)).toBe(
      true,
    );
  });
});
