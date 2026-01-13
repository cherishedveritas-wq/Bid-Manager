
import { Bid, AppUser } from './types';

const STORAGE_KEY = 'googleSheetUrl';
// 제공해주신 고정 URL을 기본값으로 설정
export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxLZloLUk0buA3OHI-BiGTGc39qHeoCYn-KW8SjlsHDicaVcpQAlb7p41CSNUx0uB8D/exec';

export const getSheetUrl = () => localStorage.getItem(STORAGE_KEY) || DEFAULT_SHEET_URL;
export const setSheetUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

// 기본 URL이 있으므로 항상 true를 반환하거나, 저장된 값이 없을 때도 기본값을 사용함을 보장
export const hasSheetUrl = () => !!getSheetUrl();

/**
 * 연동 상태 테스트
 */
export async function testSheetConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url.startsWith('https://script.google.com/')) {
    return { success: false, message: '올바른 Google Apps Script URL이 아닙니다.' };
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}?action=read`, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      return { success: false, message: `서버 응답 오류 (상태코드: ${response.status})` };
    }

    const data = await response.json();
    if (data && (data.items || Array.isArray(data))) {
      return { success: true, message: '연동 성공! 데이터를 정상적으로 불러왔습니다.' };
    }
    return { success: false, message: '응답 데이터 형식이 올바르지 않습니다.' };
  } catch (error: any) {
    return { success: false, message: '네트워크 연결 오류 또는 권한 설정(Anyone) 문제입니다.' };
  }
}

/**
 * 입찰 데이터 처리
 */
export async function fetchBids(): Promise<Bid[]> {
  const url = getSheetUrl();
  if (!url) return [];
  
  try {
    const response = await fetch(`${url}?action=read`);
    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      ...item,
      proposalAmount: Number(item.proposalAmount) || 0,
      targetYear: Number(item.targetYear) || 2026
    }));
  } catch (error) {
    console.error("Failed to fetch bids", error);
    throw error;
  }
}

export async function syncBidToSheet(action: 'create' | 'update' | 'delete', data?: Bid, id?: string): Promise<boolean> {
  const url = getSheetUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action, data, id: id || data?.id })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 사용자 데이터 처리
 */
export async function fetchUsersFromSheet(): Promise<AppUser[]> {
  const url = getSheetUrl();
  if (!url) return [];
  try {
    const response = await fetch(`${url}?action=readUsers`);
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    return [];
  }
}

export async function syncUserToSheet(action: 'createUser' | 'updateUser' | 'deleteUser', user?: AppUser, id?: string): Promise<boolean> {
  const url = getSheetUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action, user, id: id || user?.id })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
