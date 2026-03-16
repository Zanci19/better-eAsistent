import React, { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
  IonButtons,
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
  IonMenuButton,
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
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type Absence,
  type AbsencesResponse,
  formatShortDate,
  getAbsences,
} from '../services/api';
import './Absences.css';

function groupAbsencesByDate(absences: Absence[]): Map<string, Absence[]> {
  const map = new Map<string, Absence[]>();
  for (const a of absences) {
    const existing = map.get(a.date) ?? [];
    existing.push(a);
    map.set(a.date, existing);
  }
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

const Absences: React.FC = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<AbsencesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAbsences = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAbsences(accessToken);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju izostankov.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadAbsences();
  }, [loadAbsences]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadAbsences();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const absences = data?.items ?? [];
  const summary = data?.summary;
  const grouped = groupAbsencesByDate(absences);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Izostanki</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="absences-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="absences-skeleton">
            <IonSkeletonText animated style={{ width: '100%', height: '90px', borderRadius: '14px', marginBottom: '16px' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-group">
                <IonSkeletonText animated style={{ width: '35%', height: '16px', marginBottom: '6px' }} />
                <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '10px', marginBottom: '8px' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absences-content">
            {summary && (
              <IonCard className="summary-card">
                <IonCardHeader>
                  <IonCardTitle className="summary-title">
                    <IonIcon icon={alertCircleOutline} />
                    Pregled izostankov
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="summary-stats">
                    <div className="stat-item stat-item--total">
                      <span className="stat-value">{summary.total ?? absences.length}</span>
                      <span className="stat-label">Skupaj</span>
                    </div>
                    <div className="stat-item stat-item--excused">
                      <IonIcon icon={checkmarkCircleOutline} />
                      <span className="stat-value">{summary.excused}</span>
                      <span className="stat-label">Opravičenih</span>
                    </div>
                    <div className="stat-item stat-item--unexcused">
                      <IonIcon icon={closeCircleOutline} />
                      <span className="stat-value">{summary.unexcused}</span>
                      <span className="stat-label">Neopravičenih</span>
                    </div>
                    {summary.justified > 0 && (
                      <div className="stat-item stat-item--justified">
                        <span className="stat-value">{summary.justified}</span>
                        <span className="stat-label">Upravičenih</span>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {absences.length === 0 ? (
              <div className="absences-empty">
                <IonIcon icon={checkmarkCircleOutline} className="absences-empty-icon" />
                <IonText color="medium">
                  <p>Ni izostankov za prikaz.</p>
                </IonText>
              </div>
            ) : (
              <div className="absences-groups">
                {[...grouped.entries()].map(([date, dayAbsences]) => (
                  <div key={date} className="absence-group">
                    <div className="absence-date-header">
                      <IonIcon icon={timeOutline} />
                      <span>{formatShortDate(date)}</span>
                      <IonBadge color="medium" className="absence-count-badge">
                        {dayAbsences.length}
                      </IonBadge>
                    </div>
                    <IonList lines="inset" className="absence-list">
                      {dayAbsences.map((absence, idx) => (
                        <IonItem
                          key={absence.id ?? idx}
                          className="absence-item"
                          lines={idx < dayAbsences.length - 1 ? 'inset' : 'none'}
                        >
                          <IonIcon
                            slot="start"
                            icon={absence.is_excused ? checkmarkCircleOutline : closeCircleOutline}
                            color={absence.is_excused ? 'success' : 'danger'}
                            className="absence-status-icon"
                          />
                          <IonLabel>
                            <div className="absence-event">
                              {absence.subject_name || absence.event_name || '—'}
                            </div>
                            {(absence.from || absence.to) && (
                              <IonNote className="absence-time">
                                {absence.from} – {absence.to}
                              </IonNote>
                            )}
                            {absence.note && (
                              <IonNote className="absence-note">{absence.note}</IonNote>
                            )}
                          </IonLabel>
                          <IonBadge
                            slot="end"
                            color={absence.is_excused ? 'success' : 'danger'}
                            className="absence-badge"
                          >
                            {absence.is_excused ? 'Opravičen' : 'Neopravičen'}
                          </IonBadge>
                        </IonItem>
                      ))}
                    </IonList>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Absences;
