import React, { useState, useEffect } from 'react';
import { X, Save, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { getSheetUrl, setSheetUrl } from '../api';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SheetConfigModal: React.FC<SheetConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [url, setUrlInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getSheetUrl() || '');
      setStatus('idle');
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Link className="w-5 h-5 mr-2 text-green-600" />
            구글 스프레드시트 연동
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            <p className="mb-2 font-semibold">연동 방법:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>구글 스프레드시트에서 <strong>확장 프로그램 &gt; Apps Script</strong> 실행</li>
              <li>제공된 스크립트 코드를 붙여넣기 후 저장</li>
              <li><strong>배포 &gt; 새 배포</strong> 선택 (유형: 웹 앱)</li>
              <li>액세스 권한: <strong>'모든 사용자(Anyone)'</strong>로 설정</li>
              <li>생성된 <strong>웹 앱 URL</strong>을 아래에 입력하세요.</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Web App URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
            />
            {status === 'error' && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> 올바른 Google Apps Script URL이 아닙니다.
              </p>
            )}
            {status === 'success' && (
              <p className="text-green-600 text-xs mt-1 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> 연동 정보가 저장되었습니다.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            연동 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetConfigModal;