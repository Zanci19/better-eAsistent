import React, { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
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
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  bookOutline,
  calendarOutline,
  checkmarkCircleOutline,
  personOutline,
  timeOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type HomeworkItem,
  daysUntil,
  formatShortDate,
  getHomework,
} from '../services/api';
import './Homework.css';

function sortHomework(items: HomeworkItem[]): HomeworkItem[] {
  return [...items].sort((a, b) => {
    const dateA = a.date_expire || a.date_created;
    const dateB = b.date_expire || b.date_created;
    return dateA.localeCompare(dateB);
  });
}

const Homework: React.FC = () => {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHomework = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getHomework(accessToken);
      setItems(res.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju domačih nalog.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadHomework();
  }, [loadHomework]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadHomework();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const sorted = sortHomework(items);
  const pending = sorted.filter((h) => !h.done);
  const done = sorted.filter((h) => h.done);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Domača naloga</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="hw-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="hw-skeleton">
            {[1, 2, 3].map((i) => (
              <IonSkeletonText
                key={i}
                animated
                style={{ width: '100%', height: '90px', borderRadius: '14px', marginBottom: '10px' }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="hw-empty">
            <IonIcon icon={checkmarkCircleOutline} className="hw-empty-icon" />
            <IonText color="medium">
              <p>Ni domačih nalog za prikaz. 🎉</p>
            </IonText>
          </div>
        ) : (
          <div className="hw-list">
            {pending.length > 0 && (
              <>
                <div className="hw-section-header">
                  <IonIcon icon={bookOutline} />
                  <span>Nerešene ({pending.length})</span>
                </div>
                {pending.map((hw, idx) => (
                  <HomeworkCard key={hw.id ?? idx} hw={hw} showCountdown />
                ))}
              </>
            )}

            {done.length > 0 && (
              <>
                <div className="hw-section-header hw-section-header--done">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Rešene ({done.length})</span>
                </div>
                {done.map((hw, idx) => (
                  <HomeworkCard key={hw.id ?? idx} hw={hw} showCountdown={false} />
                ))}
              </>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

interface HomeworkCardProps {
  hw: HomeworkItem;
  showCountdown: boolean;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ hw, showCountdown }) => {
  const days = hw.date_expire ? daysUntil(hw.date_expire) : null;
  const isOverdue = days !== null && days < 0;
  const isDueSoon = days !== null && days >= 0 && days <= 2;

  return (
    <IonCard
      className={`hw-card${hw.done ? ' hw-card--done' : ''}${isOverdue ? ' hw-card--overdue' : ''}${isDueSoon && !hw.done ? ' hw-card--soon' : ''}`}
    >
      <IonCardContent className="hw-card-content">
        <div className="hw-top-row">
          <span className="hw-subject">{hw.subject_name || hw.subject_shortname || '—'}</span>
          {showCountdown && days !== null && (
            <IonBadge
              color={isOverdue ? 'danger' : isDueSoon ? 'warning' : 'medium'}
              className="hw-due-badge"
            >
              {isOverdue
                ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dan' : 'dni'} zamude`
                : days === 0
                  ? 'Danes!'
                  : `čez ${days} ${days === 1 ? 'dan' : 'dni'}`}
            </IonBadge>
          )}
          {hw.done && (
            <IonBadge color="success" className="hw-done-badge">
              ✓ Rešena
            </IonBadge>
          )}
        </div>

        {hw.description && (
          <div className="hw-description">{hw.description}</div>
        )}

        <div className="hw-chips-row">
          {hw.date_expire && (
            <IonChip className="hw-chip hw-chip--due">
              <IonIcon icon={calendarOutline} />
              <IonLabel>Rok: {formatShortDate(hw.date_expire)}</IonLabel>
            </IonChip>
          )}
          {hw.date_created && (
            <IonChip className="hw-chip hw-chip--created">
              <IonIcon icon={timeOutline} />
              <IonLabel>Dano: {formatShortDate(hw.date_created)}</IonLabel>
            </IonChip>
          )}
        </div>

        {hw.teacher_name && (
          <div className="hw-teacher">
            <IonIcon icon={personOutline} />
            <span>{hw.teacher_name}</span>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default Homework;
