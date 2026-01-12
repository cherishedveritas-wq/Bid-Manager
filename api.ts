
import { Bid } from './types';

const STORAGE_KEY = 'googleSheetUrl';

export const getSheetUrl = () => localStorage.getItem(STORAGE_KEY);
export const setSheetUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

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
    const id = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    const response = await fetch(`${url}?action=read`, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) {
      return { success: false, message: `서버 응답 오류 (상태코드: ${response.status})` };
    }

    const data = await response.json();
    if (data && (data.items || Array.isArray(data))) {
      return { success: true, message: '연동 성공! 데이터를 정상적으로 불러왔습니다.' };
    } else if (data.error) {
      return { success: false, message: `스크립트 에러: ${data.error}` };
    }
    
    return { success: false, message: '응답 데이터 형식이 올바르지 않습니다.' };
  } catch (error: any) {
    if (error.name === 'AbortError') return { success: false, message: '연결 시간이 초과되었습니다.' };
    return { success: false, message: '네트워크 연결 오류 또는 CORS 정책 위반입니다. (배포 설정을 확인하세요)' };
  }
}

// Fetch all bids
export async function fetchBids(): Promise<Bid[]> {
  const url = getSheetUrl();
  if (!url) return [];
  
  try {
    const response = await fetch(`${url}?action=read`);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);

    // Ensure numeric fields are numbers
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

// Generic sync function for Create, Update, Delete
export async function syncBidToSheet(
  action: 'create' | 'update' | 'delete', 
  data?: Bid, 
  id?: string
): Promise<boolean> {
  const url = getSheetUrl();
  if (!url) return false;

  try {
    const payload = JSON.stringify({
      action,
      data,
      id: id || data?.id
    });

    const response = await fetch(url, {
      method: 'POST',
      body: payload
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Failed to ${action} bid`, error);
    return false;
  }
}
