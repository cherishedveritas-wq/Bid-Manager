import { Bid } from './types';

const STORAGE_KEY = 'googleSheetUrl';

export const getSheetUrl = () => localStorage.getItem(STORAGE_KEY);
export const setSheetUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

export const hasSheetUrl = () => !!getSheetUrl();

// Fetch all bids
export async function fetchBids(): Promise<Bid[]> {
  const url = getSheetUrl();
  if (!url) return [];
  
  try {
    const response = await fetch(`${url}?action=read`);
    const data = await response.json();
    
    // Ensure numeric fields are numbers
    return (data.items || []).map((item: any) => ({
      ...item,
      proposalAmount: Number(item.proposalAmount) || 0
    }));
  } catch (error) {
    console.error("Failed to fetch bids", error);
    throw error;
  }
}

// Generic sync function for Create, Update, Delete
export async function syncBidToSheet(
  action: 'create' | 'update' | 'delete', 
  data?: Bid, 
  id?: string
): Promise<boolean> {
  const url = getSheetUrl();
  if (!url) return false;

  try {
    // We use a POST request with text/plain to avoid CORS preflight issues in some environments,
    // though GAS handles CORS well for simple requests.
    const payload = JSON.stringify({
      action,
      data,
      id: id || data?.id
    });

    await fetch(url, {
      method: 'POST',
      body: payload
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to ${action} bid`, error);
    return false;
  }
}