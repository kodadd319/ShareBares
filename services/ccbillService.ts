import CryptoJS from 'crypto-js';

const CCBILL_CLIENT_ACCOUNT = import.meta.env.VITE_CCBILL_CLIENT_ACCOUNT || '000000';
const CCBILL_SUB_ACCOUNT = import.meta.env.VITE_CCBILL_SUB_ACCOUNT || '0000';
const CCBILL_FLEXFORM_ID = import.meta.env.VITE_CCBILL_FLEXFORM_ID || '00000000-0000-0000-0000-000000000000';
const CCBILL_SALT = import.meta.env.VITE_CCBILL_SALT || '';

export interface CCBillPaymentParams {
  amount: string;
  currencyCode: string; // e.g., '840' for USD
  period: string; // e.g., '30' for 30 days
  recurring?: boolean;
}

/**
 * Generates a CCBill FlexForm URL with a secure MD5 digest.
 * This is for Dynamic Pricing.
 */
export const generateCCBillUrl = (params: CCBillPaymentParams, metadata: Record<string, string> = {}) => {
  const { amount, currencyCode, period, recurring = false } = params;
  
  // Standard CCBill Dynamic Pricing Digest: md5(amount + currencyCode + period + isRecurring + salt)
  // isRecurring is '0' or '1'
  const recurringFlag = recurring ? '1' : '0';
  const stringToHash = amount + currencyCode + period + recurringFlag + CCBILL_SALT;
  const digest = CryptoJS.MD5(stringToHash).toString();

  const baseUrl = `https://api.ccbill.com/wap-frontflex/flexform/${CCBILL_FLEXFORM_ID}`;
  const urlParams = new URLSearchParams({
    clientAccnum: CCBILL_CLIENT_ACCOUNT,
    clientSubacc: CCBILL_SUB_ACCOUNT,
    initialPrice: amount,
    initialPeriod: period,
    currencyCode: currencyCode,
    formDigest: digest,
    ...metadata // custom variables like creatorId, itemId, etc.
  });

  return `${baseUrl}?${urlParams.toString()}`;
};

/**
 * Specifically for the 80/20 platform split.
 * CCBill handles this via "Secondary Payouts" which are configured in their portal.
 * You send the total amount, and CCBill splits it according to the rule set on the sub-account.
 */
export const getCreatorPaymentUrl = (amount: number, creatorId: string, itemId: string) => {
  return generateCCBillUrl({
    amount: amount.toFixed(2),
    currencyCode: '840', // USD
    period: '99', // Non-recurring / length of access
  }, {
    userId: creatorId,
    itemId: itemId,
    platformSplit: '0.20' // Reference for postback logic if needed
  });
};
