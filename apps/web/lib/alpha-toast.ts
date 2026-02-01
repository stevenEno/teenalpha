import { toast } from 'sonner';

/**
 * Show a toast notification when Alpha is earned.
 */
export function showAlphaEarned(amount: number, source: string) {
  toast(`+${amount} Alpha`, {
    description: `Earned from ${source}`,
    icon: '\u26A1',
    duration: 3000,
  });
}
