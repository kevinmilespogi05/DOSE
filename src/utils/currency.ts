export const formatPeso = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// Utility function to parse peso string back to number if needed
export const parsePeso = (pesoString: string): number => {
  return parseFloat(pesoString.replace(/[₱,]/g, ''));
}; 