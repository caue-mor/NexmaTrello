import { toast } from "sonner";

export function useToastActions() {
  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  const handleError = (error: unknown, defaultMessage = "Erro ao processar solicitação") => {
    const message = error instanceof Error ? error.message : defaultMessage;
    toast.error(message);
  };

  const handleInfo = (message: string) => {
    toast.info(message);
  };

  const handleLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismissToast = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    success: handleSuccess,
    error: handleError,
    info: handleInfo,
    loading: handleLoading,
    dismiss: dismissToast,
  };
}