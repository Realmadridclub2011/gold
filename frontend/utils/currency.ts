// Currency conversion utilities
// 1 USD = 3.64 QAR (Qatari Riyal)

export const USD_TO_QAR = 3.64;

export const formatCurrency = (amountInUSD: number): string => {
  const amountInQAR = amountInUSD * USD_TO_QAR;
  return `${amountInQAR.toFixed(2)} ريال`;
};

export const convertToQAR = (amountInUSD: number): number => {
  return amountInUSD * USD_TO_QAR;
};

export const convertToUSD = (amountInQAR: number): number => {
  return amountInQAR / USD_TO_QAR;
};
