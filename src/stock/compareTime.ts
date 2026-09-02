import { DateTime } from 'luxon';
 
export function checkIfWithin5MinutesEST(dateString: string, range = 7): boolean {
  if (!dateString) return false;

  // Parse provider's date as EST
  const providerTime = DateTime.fromFormat(
    dateString.trim(),
    'yyyy-MM-dd HH:mm:ss',
    { zone: 'America/New_York' }
  );
  if (!providerTime.isValid) {
    console.log('❌ Invalid date:', dateString);
    return false;
  }
  // Current EST time
  const nowEST = DateTime.now().setZone('America/New_York');

  const diff = providerTime.diff(nowEST, 'minutes').minutes;

  return Math.abs(diff) <= range;
}


export function checkIfWithin5MinutesCST(
  dateString: string,
  range = 7
): boolean {
  if (!dateString) return false;

  // Parse provider's date as CST
  const providerTime = DateTime.fromFormat(
    dateString.trim(),
    'yyyy-MM-dd HH:mm:ss',
    { zone: 'America/Chicago' }
  );

  if (!providerTime.isValid) {
    console.log('❌ Invalid date:', dateString);
    return false;
  }

  // Current CST time
  const nowCST = DateTime.now().setZone('America/Chicago');

  const diff = providerTime.diff(nowCST, 'minutes').minutes;

  return Math.abs(diff) <= range;
}