// lib/drs.ts — Ireland Deposit Return Scheme calculation logic
// DRS deposit: €0.15 per 250ml can (standard for all Monster Energy variants in this app)

import { getPackCount } from './constants'

const DRS_RATE_250ML = 0.15

/**
 * Calculate the DRS deposit for a given product configuration.
 * All Monster variants in this app are 250ml cans.
 */
export function calculateDrsDeposit(
  packSize: string,
  quantity: number = 1,
): number {
  const cans = getPackCount(packSize)
  return Number((DRS_RATE_250ML * cans * quantity).toFixed(2))
}

/**
 * Split a total price into base product price + DRS deposit.
 */
export function splitPrice(
  totalPrice: number,
  packSize: string,
): { base_price: number; drs_deposit: number } {
  const drs = calculateDrsDeposit(packSize)
  return {
    base_price: Number((totalPrice - drs).toFixed(2)),
    drs_deposit: drs,
  }
}

/**
 * Get DRS deposit per individual can. Always €0.15 per 250ml can.
 */
export function drsPerCan(_packSize: string): number {
  return DRS_RATE_250ML
}

export const DRS_INFO = {
  rate: DRS_RATE_250ML,
  description:
    'Ireland\'s Deposit Return Scheme (DRS) adds a refundable €0.15 deposit to each 250ml can. You get it back when you return the can to a collection point.',
  schemeName: 'Deposit Return Scheme (DRS)',
  applicableSizes: '250ml cans',
} as const
