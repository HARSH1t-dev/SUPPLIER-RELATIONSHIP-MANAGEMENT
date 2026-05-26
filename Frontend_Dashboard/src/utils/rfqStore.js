import { rfqs as seedRfqs } from '../data/mockData.js';

const RFQ_STORAGE_KEY = 'srm.rfqs';

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

export function getStoredRfqs() {
  if (!canUseStorage()) return seedRfqs;

  try {
    const stored = window.localStorage.getItem(RFQ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedRfqs;
  } catch {
    return seedRfqs;
  }
}

export function saveStoredRfqs(rfqs) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(rfqs));
}

export function createRfqId(rfqs) {
  const maxNumber = rfqs.reduce((max, rfq) => {
    const match = String(rfq.id).match(/RFQ-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 24000);

  return `RFQ-${maxNumber + 1}`;
}
