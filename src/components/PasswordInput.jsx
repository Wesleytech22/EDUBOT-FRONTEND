import { useState } from 'react';
import '../styles/passwordInput.css';

// Campo de senha com o botão de olho para mostrar/ocultar o que foi
// digitado — usado no login e no cadastro de contas, para quem cria a
// senha inicial conferir o que vai repassar à pessoa. Os demais atributos
// (id, value, onChange, minLength, required...) vão direto para o <input>.
export default function PasswordInput({ className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ocultar senha' : 'Mostrar senha';

  return (
    <div className={`password-field ${className}`.trim()}>
      <input {...inputProps} className="input" type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={label}
        title={label}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.36 5.11A9.94 9.94 0 0112 5c5 0 9 4.5 10 7-.42 1.13-1.16 2.34-2.17 3.44M6.53 6.53C4.6 7.9 3.08 9.77 2 12c1 2.5 5 7 10 7 1.29 0 2.5-.24 3.6-.67" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
