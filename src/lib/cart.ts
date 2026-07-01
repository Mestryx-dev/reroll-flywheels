export interface CartLine {
  id: string;
  label: string;
  amount: number;
  /** Clipboard text — defaults to label when omitted */
  copyText?: string;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function createCartLine(label: string, amount: number, copyText?: string): CartLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    amount,
    copyText,
  };
}
