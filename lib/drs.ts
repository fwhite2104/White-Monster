import { getPackCount } from './constants'

const DRS_RATE = 0.15

export function splitPrice(
  totalPrice: number,
  packSize: string,
): { base_price: number; drs_deposit: number } {
  const drs = Number((DRS_RATE * getPackCount(packSize)).toFixed(2))
  return {
    base_price: Number((totalPrice - drs).toFixed(2)),
    drs_deposit: drs,
  }
}
