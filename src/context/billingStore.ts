import { create } from 'zustand';
import { getJson, setJson } from '../services/storage';

export type BillingStatus = 'loading' | 'trial' | 'expired' | 'subscribed';

type BillingState = {
  status: BillingStatus;
  trialStartedAt: number | null;
  subscribed: boolean;
  bootstrap: () => Promise<void>;
  ensureTrialStarted: () => Promise<void>;
  subscribeMock: () => Promise<void>;
  resetBillingForDebug: () => Promise<void>;
  getTrialDaysLeft: () => number;
};

const STORAGE_TRIAL_STARTED_AT = 'billing:trialStartedAt';
const STORAGE_SUBSCRIBED = 'billing:subscribed';

const TRIAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const useBillingStore = create<BillingState>((set, get) => ({
  status: 'loading',
  trialStartedAt: null,
  subscribed: false,

  bootstrap: async () => {
    set({ status: 'loading' });
    const rawTrial = await getJson(STORAGE_TRIAL_STARTED_AT);
    const rawSubscribed = await getJson(STORAGE_SUBSCRIBED);

    const trialStartedAt = parseNumber(rawTrial);
    const subscribed = parseBoolean(rawSubscribed) ?? false;

    const nextStatus = computeStatus({ trialStartedAt, subscribed });
    set({ trialStartedAt, subscribed, status: nextStatus });
  },

  ensureTrialStarted: async () => {
    const current = get();
    if (current.trialStartedAt) return;
    const now = Date.now();
    await setJson(STORAGE_TRIAL_STARTED_AT, now);
    const nextStatus = computeStatus({ trialStartedAt: now, subscribed: current.subscribed });
    set({ trialStartedAt: now, status: nextStatus });
  },

  subscribeMock: async () => {
    await setJson(STORAGE_SUBSCRIBED, true);
    set({ subscribed: true, status: 'subscribed' });
  },

  resetBillingForDebug: async () => {
    await setJson(STORAGE_TRIAL_STARTED_AT, Date.now());
    await setJson(STORAGE_SUBSCRIBED, false);
    set({ trialStartedAt: Date.now(), subscribed: false, status: 'trial' });
  },

  getTrialDaysLeft: () => {
    const { trialStartedAt } = get();
    if (!trialStartedAt) return TRIAL_DAYS;
    const endsAt = trialStartedAt + TRIAL_DAYS * DAY_MS;
    const leftMs = endsAt - Date.now();
    const days = Math.ceil(leftMs / DAY_MS);
    return Math.max(0, days);
  },
}));

function computeStatus(input: {
  trialStartedAt: number | null;
  subscribed: boolean;
}): BillingStatus {
  if (input.subscribed) return 'subscribed';
  if (!input.trialStartedAt) return 'trial';
  const endsAt = input.trialStartedAt + TRIAL_DAYS * DAY_MS;
  return Date.now() > endsAt ? 'expired' : 'trial';
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value !== 'boolean') return null;
  return value;
}

