
import React, { useState, useEffect } from 'react';
import { X, Save, Link, CheckCircle, AlertCircle, Copy, Code, Loader2, PlayCircle } from 'lucide-react';
import { getSheetUrl, setSheetUrl, testSheetConnection, DEFAULT_SHEET_URL } from '../api';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const APPS_SCRIPT_CODE = `// 아래 코드를 복사하여 Apps Script에 덮어쓰기 하세요.
const BID_SHEET_NAME = "Bids";
const USER_SHEET_NAME = "Users";

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 데이터 읽기 (입찰)
  if (action === 'read' || !action) {
    const sheet = getOrCreateSheet(ss, BID_SHEET_NAME);
    return createJsonResponse({ items: getRowsData(sheet) });
  }
  
  // 데이터 읽기 (사용자)
  if (action === 'readUsers') {
    const sheet = getOrCreateSheet(ss, USER_SHEET_NAME, ["id", "name", "birthDate", "isAdmin"]);
    return createJsonResponse({ users: getRowsData(sheet) });
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);
  const { action, data, user, id } = payload;

  if (action === 'create' || action === 'update' || action === 'delete') {
    const sheet = getOrCreateSheet(ss, BID_SHEET_NAME);
    handleAction(sheet, action, data, id);
  } else if (action === 'createUser' || action === 'deleteUser') {
    const sheet = getOrCreateSheet(ss, USER_SHEET_NAME, ["id", "name", "birthDate", "isAdmin"]);
    if (action === 'createUser') handleAction(sheet, 'create', user);
    if (action === 'deleteUser') handleAction(sheet, 'delete', null, id);
  }

  return createJsonResponse({ result: 'success' });
}

function getOrCreateSheet(ss, name, headers = null) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

function getRowsData(sheet) {
  if (sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function handleAction(sheet, action, data, id) {
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIdx = headers.indexOf('id');

  if (action === 'create') {
    if (sheet.getLastRow() === 0) sheet.appendRow(Object.keys(data));
    sheet.appendRow(headers.map(h => data[h]));
  } else {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === id) {
        if (action === 'update') sheet.getRange(i + 1, 1, 1, headers.length).setValues([headers.map(h => data[h])]);
        else if (action === 'delete') sheet.deleteRow(i + 1);
        break;
      }
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

const SheetConfigModal: React.FC<SheetConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [url, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 로컬 스토리지가 비어있어도 DEFAULT_SHEET_URL이 반환됨
      setUrlInput(getSheetUrl());
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

  const useDefaultUrl = () => {
    setUrlInput(DEFAULT_SHEET_URL);
    setTestResult(null);
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
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-sm text-slate-600">
            <p className="mb-2 font-bold text-emerald-800 text-base">✅ 공용 DB URL이 설정되어 있습니다.</p>
            <p className="font-medium text-emerald-700">제공해주신 고정 주소가 기본값으로 적용되었습니다. 별도 수정을 원치 않으시면 그대로 사용하시면 됩니다.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end mb-1">
              <label className="text-sm font-bold text-slate-500 flex items-center">
                <Code className="w-4 h-4 mr-1.5" /> Apps Script 코드 (새 시트 생성 시 필요)
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
            <pre className="w-full h-24 bg-slate-900 text-slate-300 p-4 rounded-2xl text-[10px] overflow-auto font-mono custom-scrollbar">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-slate-500 ml-1">웹 앱 URL</label>
              <button 
                onClick={useDefaultUrl}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                기본 URL로 초기화
              </button>
            </div>
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
