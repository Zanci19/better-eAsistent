import {
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { fetchAllFromApi, resolveAvatarUrl, type ApiBundle, type DateRange } from '../api';
import './Tab1.css';

const getSchoolYearRange = (): DateRange => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    from: `${year}-09-01`,
    to: `${year + 1}-06-30`,
  };
};

const Tab1: React.FC = () => {
  const [data, setData] = useState<ApiBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(getSchoolYearRange, []);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const result = await fetchAllFromApi(range);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range]);

  const avatarUrl = resolveAvatarUrl(data?.user);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Overview</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="overview-content">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Student profile</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="profile-row">
              <IonAvatar className="profile-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Student avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar-fallback">?</div>
                )}
              </IonAvatar>
              <IonBadge color={error ? 'danger' : 'success'}>{error ? 'Load failed' : 'Connected'}</IonBadge>
            </div>
            <div className="range-label">Range: {range.from} → {range.to}</div>
          </IonCardContent>
        </IonCard>

        {loading && <IonSpinner className="loader" name="crescent" />}
        {error && <p className="error-text">{error}</p>}

        {data && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>API payload loaded</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
