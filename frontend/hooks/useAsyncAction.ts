import { useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export function useAsyncAction() {
  const { setGlobalLoading, setGlobalProgress } = useStore();

  const performAction = useCallback(async (
    action: () => Promise<any>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (data: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    try {
      setGlobalLoading(true);
      setGlobalProgress(10);
      
      // Artificial delay for small steps
      const progressTimer = setInterval(() => {
        setGlobalProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressTimer);
            return 80;
          }
          return prev + 5;
        });
      }, 200);

      const result = await action();
      
      clearInterval(progressTimer);
      setGlobalProgress(100);
      
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      // Delay reset to allow user to see 100%
      setTimeout(() => {
        setGlobalLoading(false);
        setGlobalProgress(0);
      }, 500);
      
      return result;
    } catch (error: any) {
      setGlobalProgress(100);
      const message = options?.errorMessage || error.message || "Something went wrong";
      toast.error(message);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      setTimeout(() => {
        setGlobalLoading(false);
        setGlobalProgress(0);
      }, 500);
      
      throw error;
    }
  }, [setGlobalLoading, setGlobalProgress]);

  return { performAction };
}
