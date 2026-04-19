import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './PaperTradingButton.css';

export function PaperTradingButton() {
  const { navigateToPaperTrading } = useAuth();
  const [error, setError] = useState('');

  const handleClick = () => {
    console.log('[PaperTradingButton] Button clicked');
    const result = navigateToPaperTrading();
    console.log('[PaperTradingButton] Navigation result:', result);
    if (!result.success) {
      setError(result.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="paper-trading-button-wrapper">
      <button 
        type="button"
        onClick={handleClick}
        className="paper-trading-btn"
      >
        Start Paper Trading
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9H14M14 9L10 5M14 9L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error && <p className="paper-trading-error">{error}</p>}
    </div>
  );
}
