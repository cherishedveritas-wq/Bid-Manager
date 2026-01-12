
import React, { useState, useEffect } from 'react';
import { X, Save, Link, CheckCircle, AlertCircle, Copy, Code, Loader2, PlayCircle } from 'lucide-react';
import { getSheetUrl, setSheetUrl, testSheetConnection } from '../api';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const APPS_SCRIPT_CODE = `// 구글 스프레드시트 Apps Script에 복사해서 사용하세요.
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    const range = sheet.getDataRange();
    
    if (sheet.getLastRow() < 1) {
      return ContentService.createTextOutput(JSON.stringify({ items: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const rows = range.getValues();
    const headers = rows[0];
    const items = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, i) => { obj[header] = row[i]; });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify({ items: items }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    const payload = JSON.parse(e.postData.contents);
    const { action, data, id } = payload;
    
    if (sheet.getLastRow() === 0 && action === 'create') {
      sheet.appendRow(Object.keys(data));
    }
    
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    
    if (action === 'create') {
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
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

const SheetConfigModal: React.FC<SheetConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [url, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getSheetUrl() || '');
      setTestResult(null);
    }
  }, [isOpen]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    if (!url.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    const result = await testSheetConnection(url.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    setSheetUrl(url.trim());
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

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
            <p className="mb-4 font-bold text-blue-800 text-base">🚀 해결 방법: 아래 단계를 꼭 확인하세요!</p>
            <ol className="list-decimal pl-5 space-y-3 leading-relaxed font-medium">
              <li>아래 코드를 복사하여 구글 시트 <span className="font-bold">Apps Script</span>에 붙여넣고 저장하세요.</li>
              <li>상단 메뉴 <span className="text-red-600 font-bold">배포 > 새 배포</span>를 클릭합니다.</li>
              <li>유형 선택: <span className="font-bold">웹 앱(Web App)</span></li>
              <li>액세스 권한: <span className="text-red-600 font-bold text-base underline">모든 사용자(Anyone)</span> 로 변경 (중요!)</li>
              <li>배포 후 생성된 <span className="font-bold">웹 앱 URL</span>을 아래에 입력하세요.</li>
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
            <pre className="w-full h-32 bg-slate-900 text-slate-300 p-4 rounded-2xl text-[10px] overflow-auto font-mono custom-scrollbar">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-500 ml-1">웹 앱 URL (반드시 /exec로 끝나는 주소)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
              />
              <button
                onClick={handleTest}
                disabled={isTesting || !url.trim()}
                className="px-5 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5 mr-2" />}
                테스트
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-start gap-3 animate-in slide-in-from-top-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {testResult.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p>{testResult.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 flex justify-end space-x-4 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!url.trim()}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
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
