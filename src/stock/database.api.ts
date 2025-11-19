
const apiurl=`https://stockmarkets000-default-rtdb.firebaseio.com/eyJhbGciOiJSUzI1NiIsImtpZCI6ImE2YzYzNTNm/stock-related`
  const now = new Date();
  const nyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

export const nyDateOnly = nyFormatter.format(now).replace(/-/g, '_');
export async function postData(location:string, symbol: string) {
  const uxud = `${apiurl}/${location}/${nyDateOnly}.json`;
  try {
    const response = await fetch(uxud, {
      method: 'POST',
      body: JSON.stringify(symbol),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to PUT data. Status: ${response?.status}`);
    }
    return await response.json();
  } catch (error) {
    return 'skipped';
  }
}

export async function getData(location: string) {
    const uxud = `${apiurl}/${location}.json`;
  try {
    const response = await fetch(uxud, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to PUT data. Status: ${response?.status}`);
    }
    return await response.json();
  } catch (error) {
    return 'skipped';
  }
}


export function formatDate(date: {
  getFullYear: () => any;
  getMonth: () => number;
  getDate: () => any;
}) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateUnder(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}_${mm}_${dd}`;
}
export function getDateNDaysAgo(n: number) {
  const now = new Date(); // current date and time
  now.setDate(now.getDate() - n); // subtract n days
  return formatDateUnder(now);
}
function getRecentWashSellSymbols(list: { [x: string]: any }, days = 32) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);

  const recentSymbols = [];

  for (const key in list) {
    // Extract date part from key, e.g., "list_day_2025_10_19"
    const match = key.match(/list_day_(\d{4})_(\d{2})_(\d{2})/);
    if (!match) continue;

    const [, year, month, day] = match;
    const listDate = new Date(`${year}-${month}-${day}T00:00:00Z`);

    if (listDate >= cutoff && listDate <= now) {
      recentSymbols.push(...list[key]);
    }
  }
  return recentSymbols;
}

function turnto(firebaseData: Record<string, Record<string, string>>) {
  const lists: Record<string, string[]> = {};

  for (const [date, symbolsObj] of Object.entries(firebaseData)) {
    const key = `list_day_${date}`;
    const symbols = Object.values(symbolsObj);
    lists[key] = symbols;
  }
  return lists;
}

export function getwashsell30(data: Record<string, Record<string, string>>) {
  const list = turnto(data);
  return getRecentWashSellSymbols(list);
}

export function getlast10days(data: Record<string, Record<string, string>>) {
  const list = turnto(data);
  return getRecentWashSellSymbols(list,2);
}

export function getlast5days(data: Record<string, Record<string, string>>) {
  const list = turnto(data);
  return getRecentWashSellSymbols(list, 5);
}

