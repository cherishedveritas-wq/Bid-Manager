
import { Bid, AppUser } from './types';
import { generateId } from './utils';

const STORAGE_KEY = 'googleSheetUrl';
export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxLZloLUk0buA3OHI-BiGTGc39qHeoCYn-KW8SjlsHDicaVcpQAlb7p41CSNUx0uB8D/exec';

export const getSheetUrl = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SHEET_URL;
  } catch (e) {
    return DEFAULT_SHEET_URL;
  }
};
export const setSheetUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);
export const hasSheetUrl = () => !!getSheetUrl();

/**
 * 타임아웃이 포함된 fetch 헬퍼
 */
async function fetchWithTimeout(url: string, options: any = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: 'cors',
      redirect: 'follow'
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function testSheetConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url.startsWith('https://script.google.com/')) {
    return { success: false, message: '올바른 Google Apps Script URL이 아닙니다.' };
  }

  try {
    const response = await fetchWithTimeout(`${url}?action=read`, {}, 5000);
    if (!response.ok) return { success: false, message: `서버 응답 오류 (${response.status})` };
    const data = await response.json();
    return (data && (data.items || Array.isArray(data) || data.result === 'success')) 
      ? { success: true, message: '연동 성공!' }
      : { success: false, message: '응답 데이터 형식이 올바르지 않습니다.' };
  } catch (error: any) {
    return { success: false, message: '연결 실패 (타임아웃 또는 권한 설정 확인)' };
  }
}

export async function fetchBids(): Promise<Bid[]> {
  const url = getSheetUrl();
  try {
    const response = await fetchWithTimeout(`${url}?action=read`, {}, 10000);
    const data = await response.json();
    const items = data.items || [];
    
    return items.map((item: any) => {
      let finalId = item.id !== null && item.id !== undefined && String(item.id).trim() !== "" 
        ? String(item.id).trim() 
        : `temp_${generateId()}`;
      
      return {
        ...item,
        id: finalId,
        proposalAmount: Number(item.proposalAmount) || 0,
        targetYear: Number(item.targetYear) || 2026,
        // 시트에서 날짜가 누락되어 오더라도 앱에서 에러가 나지 않도록 처리
        workStartDate: item.workStartDate || ''
      };
    });
  } catch (error) {
    console.error("Failed to fetch bids", error);
    throw error;
  }
}

export async function syncBidToSheet(action: 'create' | 'update' | 'delete', data?: Bid, id?: string): Promise<boolean> {
  const url = getSheetUrl();
  try {
    const payload = { 
      action, 
      data, 
      id: id || data?.id 
    };

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    }, 15000);
    
    if (!response.ok) {
      console.error("Sync failed with status:", response.status);
      return false;
    }

    const result = await response.json();
    if (result.result !== 'success') {
      console.error("GAS Server returned error:", result.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Sync connection error:", error);
    return false;
  }
}

export async function fetchUsersFromSheet(): Promise<AppUser[]> {
  const url = getSheetUrl();
  try {
    const response = await fetchWithTimeout(`${url}?action=readUsers`, {}, 5000);
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.warn("User fetch failed or timed out", error);
    return [];
  }
}

export async function syncUserToSheet(action: 'createUser' | 'updateUser' | 'deleteUser', user?: AppUser, id?: string): Promise<boolean> {
  const url = getSheetUrl();
  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, user, id: id || user?.id })
    }, 15000);
    
    if (!response.ok) return false;
    const result = await response.json();
    return result.result === 'success';
  } catch (error) {
    return false;
  }
}
