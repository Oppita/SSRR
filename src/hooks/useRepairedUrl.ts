import { useState, useEffect } from 'react';
import { getRepairedUrl } from '../lib/storage';

export const useRepairedUrl = (url: string | null | undefined) => {
  const [repairedUrl, setRepairedUrl] = useState<string | null>(url || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!url || url === '#') {
      setRepairedUrl(url || null);
      return;
    }

    let isMounted = true;
    const repair = async () => {
      setIsLoading(true);
      try {
        const result = await getRepairedUrl(url);
        if (isMounted) {
          setRepairedUrl(result);
        }
      } catch (error) {
        console.error('Error repairing URL in hook:', error);
        if (isMounted) {
          setRepairedUrl(url);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    repair();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { repairedUrl, isLoading };
};
