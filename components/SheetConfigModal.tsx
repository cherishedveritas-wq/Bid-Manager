
import React, { useState, useEffect } from 'react';
import { X, Save, Link, CheckCircle, AlertCircle, Copy, Code } from 'lucide-react';
import { getSheetUrl, setSheetUrl } from '../api';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const APPS_SCRIPT_CODE = `// 구글 스프레드시트 Apps Script에 복사해서 사용하세요.
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const items = rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => { obj[header] = row[i]; });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const payload = JSON.parse(e.postData.contents);
  const { action, data, id } = payload;
  
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  if (action === 'create') {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(Object.keys(data));
    }
    const newRow = headers.map(h => data[h]);
    sheet.appendRow(newRow);
  } else if (action === 'update' || action === 'delete') {
    const idIndex = headers.indexOf('id');
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIndex] === id) {
        if (action === 'update') {
          const updatedRow = headers.map(h => data[h]);
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
        } else {
          sheet.deleteRow(i + 1);
        }
        break;
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const SheetConfigModal: React.FC<SheetConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [url, setUrlInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getSheetUrl() || '');
      setStatus('idle');
    }
  }, [isOpen]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim()) {
      setSheetUrl('');
      onSaved();
      onClose();
      return;
    }

    if (!url.includes('script.google.com')) {
      setStatus('error');
      return;
    }

    setSheetUrl(url.trim());
    setStatus('success');
    setTimeout(() => {
      onSaved();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-auto overflow-hidden flex flex-col scale-in-center">
        <div className="flex justify-between items-center p-8 border-b border-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center tracking-tight">
            <Link className="w-6 h-6 mr-3 text-blue-600" />
            구글 스프레드시트 연동 설정
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl text-sm text-slate-600">
            <p className="mb-4 font-bold text-blue-800 text-base">🚀 데이터베이스 연동 가이드</p>
            <ol className="list-decimal pl-5 space-y-3 leading-relaxed font-medium">
              <li>아래의 <span className="text-blue-700 font-bold">스크립트 코드</span>를 복사합니다.</li>
              <li>사용할 구글 시트에서 <span className="font-bold">확장 프로그램 &gt; Apps Script</span>를 실행합니다.</li>
              <li>기존 코드를 지우고 복사한 코드를 붙여넣은 뒤 <span className="font-bold">저장</span>합니다.</li>
              <li>상단 <span className="font-bold text-red-600">배포 &gt; 새 배포</span> 클릭 (유형: 웹 앱).</li>
              <li>설정: 설명 입력, 다음 사용자 인증(나), 액세스 권한(<span className="text-red-600 font-bold">모든 사용자/Anyone</span>).</li>
              <li>생성된 <span className="font-bold">웹 앱 URL</span>을 아래 입력창에 붙여넣으세요.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-1">
              <label className="text-sm font-bold text-slate-500 flex items-center">
                <Code className="w-4 h-4 mr-1.5" /> Apps Script 코드
              </label>
              <button 
                onClick={copyToClipboard}
                className={`flex items-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? '복사됨!' : '코드 복사하기'}
              </button>
            </div>
            <pre className="w-full h-40 bg-slate-900 text-slate-300 p-4 rounded-2xl text-[11px] overflow-auto font-mono leading-normal custom-scrollbar select-all">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-500 ml-1">생성된 웹 앱 URL (Web App URL)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
            />
            {status === 'error' && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center animate-bounce">
                <AlertCircle className="w-4 h-4 mr-2" /> 올바른 Google Apps Script URL이 아닙니다.
              </div>
            )}
            {status === 'success' && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" /> 연동 정보가 정상적으로 저장되었습니다!
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 flex justify-end space-x-4 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Save className="w-5 h-5 mr-2" />
            연동 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetConfigModal;
