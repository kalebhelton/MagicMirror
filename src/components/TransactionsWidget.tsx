'use client';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  payee: string;
  amount: number;
  notes: string | null;
}

export default function TransactionsWidget() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => {
        if (data.error?.includes('not configured')) setConfigured(false);
        else if (data.error) setError(data.error);
        setTransactions(data.transactions || []);
        setSource(data.source || null);
      })
      .catch(() => setError('Failed to load'));
  }, []);

  return (
    <div className="transactions-widget">
      <h3>
        Recent Transactions
        {source && <span style={{fontSize:'0.6rem',marginLeft:'8px',color:'rgba(255,255,255,0.25)',fontWeight:400}}>{source}</span>}
      </h3>

      {!configured && (
        <div className="not-connected">
          Add ACTUAL_DRIVE_FOLDER_ID to .env.local
          <div style={{fontSize:'0.7rem',marginTop:'4px'}}>Upload your Actual Budget .sqlite file to a shared Google Drive folder</div>
        </div>
      )}

      {error && configured && (
        <div style={{fontSize:'0.78rem',color:'#ff6b6b'}}>{error}</div>
      )}

      {transactions.length === 0 && configured && !error && (
        <div className="not-connected">No transactions found</div>
      )}

      {transactions.map(txn => (
        <div key={txn.id} className="transaction-row">
          <div>
            <div className="txn-payee">{txn.payee}</div>
            <div className="txn-date">{txn.date}</div>
          </div>
          <div className={`txn-amount ${txn.amount < 0 ? 'negative' : 'positive'}`}>
            {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
