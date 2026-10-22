import { useEffect, useState } from 'react';

export default function useResource(loader, id) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => loader(id))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (active) setState({ data: null, loading: false, error });
      });
    return () => {
      active = false;
    };
  }, [loader, id, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
