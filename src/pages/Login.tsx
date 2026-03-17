import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Vnesite uporabniško ime in geslo.');
      return;
    }

    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Napaka pri prijavi. Preverite podatke in poskusite znova.');
      } else {
        setError('Napaka pri prijavi. Preverite podatke in poskusite znova.');
      }
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
        <div className="login-container">
          <div className="login-logo">
            <div className="login-logo-icon">eA</div>
            <IonText>
              <h1 className="login-title">better eAsistent</h1>
              <p className="login-subtitle">Slovenian school companion</p>
            </IonText>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <IonItem className="login-item" lines="none">
              <IonLabel position="stacked">Uporabniško ime</IonLabel>
              <IonInput
                type="text"
                value={username}
                onIonInput={(e) => setUsername(e.detail.value ?? '')}
                placeholder="npr. 12345678"
                autocomplete="username"
                disabled={isLoading}
              />
            </IonItem>

            <IonItem className="login-item" lines="none">
              <IonLabel position="stacked">Geslo</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value ?? '')}
                placeholder="Vnesite geslo"
                autocomplete="current-password"
                disabled={isLoading}
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
            </IonItem>

            {error && (
              <div className="login-error">
                <IonNote color="danger">{error}</IonNote>
              </div>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Prijava'}
            </IonButton>
          </form>

          <IonText className="login-footer">
            <p>Uporabite enake podatke kot v aplikaciji eAsistent.</p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
