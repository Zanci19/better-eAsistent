import React, { useCallback, useEffect, useState } from 'react';
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  logOutOutline,
  personCircleOutline,
  ribbonOutline,
  schoolOutline,
  timeOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { type ChildResponse, formatDateTime, formatSlovenianDay, getChild } from '../services/api';
import './Profile.css';

const GENDER_MAP: Record<string, string> = {
  m: 'Moški',
  f: 'Ženski',
};

const Profile: React.FC = () => {
  const { accessToken, user, logout } = useAuth();
  const [child, setChild] = useState<ChildResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChild = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getChild(accessToken);
      setChild(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju podatkov.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadChild();
  }, [loadChild]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadChild();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const handleLogout = () => {
    logout();
  };

  const todayEvents = child?.timetable?.hours?.filter((h) => h.type === 'event') ?? [];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profil</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleLogout} className="logout-button">
            <IonIcon icon={logOutOutline} slot="icon-only" />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="profile-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="profile-skeleton">
            <div className="skeleton-avatar-row">
              <IonSkeletonText animated style={{ width: '72px', height: '72px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <IonSkeletonText animated style={{ width: '60%', height: '22px', marginBottom: '8px' }} />
                <IonSkeletonText animated style={{ width: '40%', height: '16px' }} />
              </div>
            </div>
            <IonSkeletonText animated style={{ width: '100%', height: '120px', borderRadius: '12px', marginTop: '16px' }} />
          </div>
        ) : (
          <>
            <div className="profile-header">
              <IonAvatar className="profile-avatar">
                {child?.avatar ? (
                  <img src={child.avatar} alt="Avatar" />
                ) : (
                  <IonIcon icon={personCircleOutline} className="profile-avatar-icon" />
                )}
              </IonAvatar>
              <div className="profile-name-block">
                <h2 className="profile-display-name">{child?.display_name ?? user?.name ?? '—'}</h2>
                <p className="profile-type">
                  {user?.type === 'child' ? 'Dijak/Učenec' : user?.type ?? ''}
                </p>
              </div>
            </div>

            <div className="profile-cards">
              <IonCard className="profile-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={personCircleOutline} /> Osebni podatki
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="inset">
                    <IonItem>
                      <IonIcon icon={ribbonOutline} slot="start" color="primary" />
                      <IonLabel>
                        <IonNote>Kratko ime</IonNote>
                        <p>{child?.short_name ?? '—'}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonIcon icon={schoolOutline} slot="start" color="primary" />
                      <IonLabel>
                        <IonNote>ID učenca</IonNote>
                        <p>{child?.student_id ?? user?.id ?? '—'}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonIcon icon={personCircleOutline} slot="start" color="primary" />
                      <IonLabel>
                        <IonNote>Spol</IonNote>
                        <p>{child?.gender ? (GENDER_MAP[child.gender] ?? child.gender) : '—'}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem lines="none">
                      <IonIcon icon={calendarOutline} slot="start" color="primary" />
                      <IonLabel>
                        <IonNote>Starost</IonNote>
                        <p>{child?.age ? `${child.age} let` : '—'}</p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {todayEvents.length > 0 && (
                <IonCard className="profile-card">
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={timeOutline} /> Danes ({child?.timetable?.date ? formatSlovenianDay(child.timetable.date) : ''})
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList lines="inset">
                      {todayEvents.map((hour, idx) => {
                        const from = formatDateTime(hour.from);
                        const to = formatDateTime(hour.to);
                        return (
                          <IonItem key={idx} lines={idx < todayEvents.length - 1 ? 'inset' : 'none'}>
                            <IonLabel>
                              <p className="today-event-summary">{hour.summary}</p>
                              <IonNote>{from} – {to}</IonNote>
                            </IonLabel>
                          </IonItem>
                        );
                      })}
                    </IonList>
                  </IonCardContent>
                </IonCard>
              )}

              {child?.plus_enabled && (
                <IonCard className="profile-card profile-card--plus">
                  <IonCardContent>
                    <div className="plus-badge">
                      <span>⭐ eAsistent Plus</span>
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
            </div>

            <div className="profile-logout">
              <IonButton
                expand="block"
                fill="outline"
                color="danger"
                onClick={handleLogout}
                className="logout-full-button"
              >
                <IonIcon icon={logOutOutline} slot="start" />
                Odjava
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
