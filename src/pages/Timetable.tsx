import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
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
import { chevronBack, chevronForward, calendarOutline, timeOutline, locationOutline, personOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type TimetableEvent,
  formatDate,
  formatSlovenianDay,
  getTimetable,
  getWeekBounds,
} from '../services/api';
import './Timetable.css';

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function groupEventsByDay(events: TimetableEvent[]): Map<string, TimetableEvent[]> {
  const map = new Map<string, TimetableEvent[]>();
  for (const event of events) {
    const existing = map.get(event.date) ?? [];
    existing.push(event);
    map.set(event.date, existing);
  }
  for (const [key, value] of map.entries()) {
    map.set(key, value.sort((a, b) => a.from.localeCompare(b.from)));
  }
  return map;
}

function getWeekDates(monday: Date): string[] {
  return DAYS_ORDER.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDate(d);
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

const Timetable: React.FC = () => {
  const { accessToken } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const { from } = getWeekBounds(new Date());
    return from;
  });
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const loadTimetable = useCallback(async (weekStart: Date) => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const from = formatDate(weekStart);
      const toDate = new Date(weekStart);
      toDate.setDate(weekStart.getDate() + 4);
      const to = formatDate(toDate);
      const data = await getTimetable(accessToken, from, to);
      setEvents(data.events ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju urnika.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadTimetable(currentWeekStart);
  }, [currentWeekStart, loadTimetable]);

  const goToPrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToCurrentWeek = () => {
    const { from } = getWeekBounds(new Date());
    setCurrentWeekStart(from);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadTimetable(currentWeekStart);
    (event.target as HTMLIonRefresherElement).complete();
  };

  const weekDates = getWeekDates(currentWeekStart);
  const eventsByDay = groupEventsByDay(events);

  const endWeek = new Date(currentWeekStart);
  endWeek.setDate(currentWeekStart.getDate() + 4);
  const weekLabel = `${currentWeekStart.getDate()}. ${currentWeekStart.getMonth() + 1}. – ${endWeek.getDate()}. ${endWeek.getMonth() + 1}. ${endWeek.getFullYear()}`;

  const isCurrentWeek = formatDate(currentWeekStart) === formatDate(getWeekBounds(new Date()).from);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Urnik</IonTitle>
          {!isCurrentWeek && (
            <IonButtons slot="end">
              <IonButton onClick={goToCurrentWeek} size="small">
                Danes
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar className="week-nav-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={goToPrevWeek}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle size="small" className="week-label">
            <IonIcon icon={calendarOutline} className="week-label-icon" />
            {weekLabel}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={goToNextWeek}>
              <IonIcon icon={chevronForward} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="timetable-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="timetable-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-day">
                <IonSkeletonText animated style={{ width: '40%', height: '20px', marginBottom: '8px' }} />
                {[1, 2, 3].map((j) => (
                  <IonSkeletonText key={j} animated style={{ width: '100%', height: '72px', marginBottom: '8px', borderRadius: '12px' }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="timetable-days">
            {weekDates.map((dateStr) => {
              const dayEvents = eventsByDay.get(dateStr) ?? [];
              const today = isToday(dateStr);
              return (
                <div key={dateStr} className={`timetable-day${today ? ' timetable-day--today' : ''}`}>
                  <div className="day-header">
                    <span className="day-name">{formatSlovenianDay(dateStr)}</span>
                    {today && <IonBadge color="primary" className="today-badge">Danes</IonBadge>}
                  </div>

                  {dayEvents.length === 0 ? (
                    <div className="day-empty">
                      <IonText color="medium">
                        <p>Ni pouka</p>
                      </IonText>
                    </div>
                  ) : (
                    <IonList lines="none" className="day-events">
                      {dayEvents.map((event, idx) => (
                        <IonItem
                          key={idx}
                          className="event-item"
                          style={{ '--event-color': event.color || 'var(--ion-color-primary)' }}
                        >
                          <div className="event-color-bar" style={{ background: event.color || 'var(--ion-color-primary)' }} />
                          <IonLabel>
                            <div className="event-title">
                              <span className="event-subject">{event.title}</span>
                              {event.lesson && (
                                <span className="event-lesson">{event.lesson}</span>
                              )}
                            </div>
                            <div className="event-meta">
                              <IonChip className="event-chip event-chip--time">
                                <IonIcon icon={timeOutline} />
                                <IonLabel>{formatTime(event.from)} – {formatTime(event.to)}</IonLabel>
                              </IonChip>
                              {event.classroom && (
                                <IonChip className="event-chip event-chip--room">
                                  <IonIcon icon={locationOutline} />
                                  <IonLabel>{event.classroom}</IonLabel>
                                </IonChip>
                              )}
                            </div>
                            {event.teachers && event.teachers.length > 0 && (
                              <div className="event-teachers">
                                <IonIcon icon={personOutline} />
                                <span>{event.teachers.join(', ')}</span>
                              </div>
                            )}
                            {event.homework && event.homework.length > 0 && (
                              <IonNote color="warning" className="event-homework">
                                📝 Domača naloga
                              </IonNote>
                            )}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Timetable;
