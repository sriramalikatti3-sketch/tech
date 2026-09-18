import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Download,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  category?: string;
  referenceNo?: string;
}

const SAMPLE_CSV_CONTENT = `Date,Narration / Description,Debit Amount (INR),Reference No,Category
2026-03-15,UPI-AUTOPAY-NETFLIX INDIA-MUMBAI,649.00,UPI9920148192,Entertainment
2026-03-12,POS SPOTIFY INDIA PVT LTD BANGALORE,119.00,POS44810294,Music
2026-03-10,AUTOPAY SWIGGY ONE MEMBERSHIP 3MO,299.00,SI88201948,Food & Delivery
2026-03-08,UPI-AUTOPAY-DISNEY HOTSTAR SUPER,299.00,UPI88291041,Entertainment
2026-03-05,OPENAI CHATGPT PLUS SUBSCRIPTION,1999.00,PG99201481,Productivity & AI
2026-03-02,APPLE SERVICES INDIA ICLOUD 200GB,219.00,APPL991823,Cloud Storage
2026-02-28,UPI-AUTOPAY-CULTFIT CULTPASS MONTHLY,1490.00,UPI11820491,Fitness & Health
2026-02-26,CARE HEALTH INSURANCE MONTHLY PREMIUM,2499.00,CH99281041,Insurance
2026-02-20,AMAZON PRIME INDIA RECURRING,149.00,AMZN771829,Entertainment
2026-02-15,CHESS.COM DIAMOND MEMBERSHIP,829.00,CHESS88192,Gaming & Strategy`;

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTransaction[]>([]);
  const [bankName, setBankName] = useState<string>('HDFC Bank NetBanking Statement');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string): ParsedTransaction[] => {
    const rawLines = text.trim().split(/\r?\n/);
    if (rawLines.length < 2) return [];

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = rawLines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const parseLine = (line: string) => {
      if (delimiter === ',') {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches) return matches.map(v => v.replace(/^"|"$/g, '').trim());
      }
      return line.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());
    };

    const headers = parseLine(firstLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Identify column indices
    let dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('post') || h.includes('day'));
    let descIdx = headers.findIndex(h => h.includes('desc') || h.includes('narrat') || h.includes('particular') || h.includes('detail') || h.includes('remark') || h.includes('merchant') || h.includes('vendor') || h.includes('payee') || h.includes('service') || h.includes('name'));
    let debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('amount') || h.includes('withdrawal') || h.includes('inr') || h.includes('rs') || h.includes('price') || h.includes('cost') || h.includes('spend') || h.includes('charge'));
    let refIdx = headers.findIndex(h => h.includes('ref') || h.includes('chq') || h.includes('txn') || h.includes('utr') || h.includes('id'));
    let catIdx = headers.findIndex(h => h.includes('cat') || h.includes('type') || h.includes('tag') || h.includes('group'));

    if (dateIdx === -1) dateIdx = 0;
    if (descIdx === -1) descIdx = Math.min(1, headers.length - 1);
    if (debitIdx === -1) debitIdx = Math.min(2, headers.length - 1);

    const results: ParsedTransaction[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      const cleanVals = parseLine(line);
      if (cleanVals.length === 0) continue;

      const rawDate = cleanVals[dateIdx] || new Date().toISOString().split('T')[0];
      const rawDesc = cleanVals[descIdx] || 'Bank Subscription Debit';
      
      // Clean amount: support formats like "1,999.00", "₹649.00", "-1490.00"
      const rawAmtStr = cleanVals[debitIdx] ? cleanVals[debitIdx].replace(/[^0-9.-]/g, '') : '0';
      const rawAmt = Math.abs(parseFloat(rawAmtStr));

      if (!isNaN(rawAmt) && rawAmt > 0) {
        results.push({
          date: rawDate,
          description: rawDesc,
          amount: rawAmt,
          referenceNo: refIdx >= 0 && cleanVals[refIdx] ? cleanVals[refIdx] : undefined,
          category: catIdx >= 0 && cleanVals[catIdx] ? cleanVals[catIdx] : undefined,
        });
      }
    }

    return results;
  };

  const handleFileChange = (file: File) => {
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsvText(text);
        if (parsed.length === 0) {
          setError('No valid transaction rows found in CSV. Please verify column format.');
        } else {
          setParsedRows(parsed);
        }
      } catch (err: any) {
        setError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setError(null);
    setSelectedFile(new File([SAMPLE_CSV_CONTENT], 'hdfc_subscriptions_statement.csv', { type: 'text/csv' }));
    setBankName('HDFC Bank NetBanking Statement');
    const parsed = parseCsvText(SAMPLE_CSV_CONTENT);
    setParsedRows(parsed);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_bank_subscriptions_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.uploadCsvStatements(parsedRows, bankName);
      // Run an autonomous scan to process new subscriptions immediately
      await api.triggerScan();
      onSuccess(res.newSubscriptions || parsedRows.length);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV statements into Secure Money.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0B132B] border border-cyan-500/40 p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          id="close-csv-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Import Bank Statement CSV
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                INR (₹) Subscriptions
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload bank statements from HDFC, ICICI, SBI, Axis, or custom CSVs to detect real-life recurring subscriptions and auto-guard your money.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Bank Selection & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0F1A36] border border-slate-800">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Statement Source / Bank
              </label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-[#152347] border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
              >
                <option value="HDFC Bank NetBanking Statement">HDFC Bank NetBanking Statement</option>
                <option value="ICICI Bank iMobile & NetBanking">ICICI Bank iMobile & NetBanking</option>
                <option value="State Bank of India (SBI) Statement">State Bank of India (SBI) Statement</option>
                <option value="Axis Bank Statements Feed">Axis Bank Statements Feed</option>
                <option value="Kotak Mahindra NetBanking">Kotak Mahindra NetBanking</option>
                <option value="Standard Bank Statement CSV">Standard Bank Statement CSV</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Real Sample</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                title="Download CSV Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700/80 bg-[#0E1730] hover:border-cyan-500/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Upload className="w-5 h-5" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{selectedFile.name}</span>
                </p>
                <p className="text-xs text-emerald-400 mt-1 font-mono">
                  {parsedRows.length} subscription transaction line(s) parsed
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white">
                  Drop your Bank Statement (.csv) here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports columns: Date, Description / Narration, Debit Amount (₹), Reference No
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="rounded-2xl bg-[#0E1833] border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  Parsed Subscription Transactions ({parsedRows.length})
                </span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  Total Debit: ₹{parsedRows.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 rounded-xl border border-slate-800/60 bg-[#090F24]">
                {parsedRows.slice(0, 8).map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-semibold text-white truncate">{row.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {row.date} {row.referenceNo ? `• Ref: ${row.referenceNo}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {row.category && (
                        <p className="text-[10px] text-slate-500 capitalize">{row.category}</p>
                      )}
                    </div>
                  </div>
                ))}
                {parsedRows.length > 8 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-900/50">
                    + {parsedRows.length - 8} more transactions ready for autonomous guardrail evaluation
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security & Enclave Notice */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Your bank statements are parsed strictly client-side & in encrypted memory enclaves. No credentials or unencrypted account numbers are ever stored.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            id="confirm-import-csv-btn"
            onClick={handleImport}
            disabled={parsedRows.length === 0 || isLoading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing & Scanning...</span>
              </>
            ) : (
              <>
                <span>Import & Guard Subscriptions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
