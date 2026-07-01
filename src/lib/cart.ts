export interface CartLine {
  id: string;
  label: string;
  amount: number;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function createCartLine(label: string, amount: number): CartLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    amount,
  };
}
