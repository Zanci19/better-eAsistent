import React, { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  checkmarkDoneOutline,
  documentTextOutline,
  micOutline,
  personOutline,
  timeOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type Evaluation,
  daysUntil,
  formatShortDate,
  getEvaluations,
} from '../services/api';
import './Evaluations.css';

type Filter = 'future' | 'past';

function evalTypeLabel(type: string): string {
  switch (type) {
    case 'writing': return 'Pisno';
    case 'oral': return 'Ustno';
    case 'practical': return 'Praktično';
    default: return type ?? '';
  }
}

function evalTypeIcon(type: string): string {
  switch (type) {
    case 'oral': return micOutline;
    case 'writing':
    default: return documentTextOutline;
  }
}

const Evaluations: React.FC = () => {
  const { accessToken } = useAuth();
  const [filter, setFilter] = useState<Filter>('future');
  const [futureItems, setFutureItems] = useState<Evaluation[]>([]);
  const [pastItems, setPastItems] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluations = useCallback(
    async (selectedFilter: Filter) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await getEvaluations(accessToken, selectedFilter);
        if (selectedFilter === 'future') {
          setFutureItems(res.items ?? []);
        } else {
          setPastItems(res.items ?? []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Napaka pri nalaganju ocenjevanj.');
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    loadEvaluations(filter);
  }, [filter, loadEvaluations]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadEvaluations(filter);
    (event.target as HTMLIonRefresherElement).complete();
  };

  const items = filter === 'future' ? futureItems : pastItems;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Ocenjevanja</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={filter}
            onIonChange={(e) => setFilter(e.detail.value as Filter)}
            className="eval-segment"
          >
            <IonSegmentButton value="future">
              <IonLabel>Prihajajoča</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="past">
              <IonLabel>Pretekla</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="eval-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="eval-skeleton">
            {[1, 2, 3].map((i) => (
              <IonSkeletonText
                key={i}
                animated
                style={{ width: '100%', height: '100px', borderRadius: '14px', marginBottom: '10px' }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="eval-empty">
            <IonIcon icon={checkmarkDoneOutline} className="eval-empty-icon" />
            <IonText color="medium">
              <p>
                {filter === 'future'
                  ? 'Ni prihajajočih ocenjevanj.'
                  : 'Ni preteklih ocenjevanj.'}
              </p>
            </IonText>
          </div>
        ) : (
          <div className="eval-list">
            {items.map((ev, idx) => {
              const days = filter === 'future' ? daysUntil(ev.date) : null;
              const isToday = days === 0;
              const isSoon = days !== null && days > 0 && days <= 3;
              return (
                <IonCard
                  key={ev.id ?? idx}
                  className={`eval-card${isToday ? ' eval-card--today' : ''}${isSoon ? ' eval-card--soon' : ''}`}
                >
                  <IonCardContent className="eval-card-content">
                    <div className="eval-top-row">
                      <div className="eval-subject-block">
                        <IonIcon icon={evalTypeIcon(ev.type)} className="eval-type-icon" />
                        <span className="eval-subject">{ev.subject_name}</span>
                      </div>
                      {days !== null && (
                        <IonBadge
                          color={isToday ? 'danger' : isSoon ? 'warning' : 'medium'}
                          className="eval-days-badge"
                        >
                          {isToday ? 'Danes!' : `čez ${days} ${days === 1 ? 'dan' : days < 5 ? 'dni' : 'dni'}`}
                        </IonBadge>
                      )}
                    </div>

                    <div className="eval-chips-row">
                      <IonChip className="eval-chip eval-chip--date">
                        <IonIcon icon={calendarOutline} />
                        <IonLabel>{formatShortDate(ev.date)}</IonLabel>
                      </IonChip>
                      {ev.from && (
                        <IonChip className="eval-chip eval-chip--time">
                          <IonIcon icon={timeOutline} />
                          <IonLabel>{ev.from}{ev.to ? ` – ${ev.to}` : ''}</IonLabel>
                        </IonChip>
                      )}
                      {ev.type && (
                        <IonChip className="eval-chip eval-chip--type">
                          <IonLabel>{evalTypeLabel(ev.type)}</IonLabel>
                        </IonChip>
                      )}
                    </div>

                    {ev.description && (
                      <div className="eval-description">{ev.description}</div>
                    )}

                    {ev.teacher_name && (
                      <div className="eval-teacher">
                        <IonIcon icon={personOutline} />
                        <span>{ev.teacher_name}</span>
                      </div>
                    )}

                    {!ev.confirmed && filter === 'future' && (
                      <IonButtons className="eval-unconfirmed">
                        <IonButton size="small" fill="clear" color="warning" disabled>
                          ⚠ Ni potrjeno
                        </IonButton>
                      </IonButtons>
                    )}
                  </IonCardContent>
                </IonCard>
              );
            })}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Evaluations;
