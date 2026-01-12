
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

export const formatNumberWithCommas = (value: number | string): string => {
  const num = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value.toString();
  if (!num) return '0';
  return parseInt(num).toLocaleString('ko-KR');
};

export const parseNumberFromCommas = (value: string): number => {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0;
};

export const formatCompactNumber = (number: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
