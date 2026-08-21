import { getErrorMessage, getFieldErrors } from "@/lib/api";
import type { ToastOptions } from "@/components/providers/toast-provider";

export interface ImportFormProps {
  workspaceId: string;
  /** Closes the dialog and lets the parent refresh context (e.g. clear filters). */
  onDone: () => void;
}

type PushToast = (options: ToastOptions) => void;

/**
 * Shared error channel for import forms: zod field errors go inline,
 * everything else (including 429 rate limits) becomes a destructive toast.
 * Returns the field-error map when there are inline errors to show.
 */
export function resolveImportError(
  push: PushToast,
  error: unknown,
  title: string,
): Record<string, string> | null {
  const fields = getFieldErrors(error);
  if (Object.keys(fields).length > 0) {
    return fields;
  }
  push({ variant: "destructive", title, description: getErrorMessage(error) });
  return null;
}

/**
 * Shared submit helper: fires the import in the background and closes the
 * dialog immediately. The mutation's onSuccess invalidates the sources
 * list (which then polls while processing), so the new source appears on
 * its own. Failures surface as a toast.
 */
export function submitInBackground<TInput>(
  mutation: {
    mutate: (
      input: TInput,
      options?: { onError?: (error: unknown) => void },
    ) => void;
  },
  input: TInput,
  push: PushToast,
  errorTitle: string,
  onDone: () => void,
) {
  onDone();
  mutation.mutate(input, {
    onError: (error) => {
      resolveImportError(push, error, errorTitle);
    },
  });
}
