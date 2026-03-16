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
import { calendarOutline, checkmarkCircleOutline, restaurantOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type CateringOrder,
  formatShortDate,
  getSchoolCatering,
} from '../services/api';
import './Prehrana.css';

function groupOrdersByDate(orders: CateringOrder[]): Map<string, CateringOrder[]> {
  const map = new Map<string, CateringOrder[]>();
  for (const o of orders) {
    const existing = map.get(o.date) ?? [];
    existing.push(o);
    map.set(o.date, existing);
  }
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

const mealTypeLabel = (type: string): string => {
  switch (type) {
    case 'breakfast': return 'Zajtrk';
    case 'lunch': return 'Kosilo';
    case 'snack': return 'Malica';
    case 'afternoon_snack': return 'Popoldanska malica';
    default: return type ?? 'Obrok';
  }
};

const Prehrana: React.FC = () => {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<CateringOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatering = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSchoolCatering(accessToken);
      setOrders(res.orders ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju prehrane.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadCatering();
  }, [loadCatering]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadCatering();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const grouped = groupOrdersByDate(orders);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Prehrana</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="prehrana-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="prehrana-skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="prehrana-skeleton-row">
                <IonSkeletonText animated style={{ width: '35%', height: '16px', marginBottom: '6px' }} />
                <IonSkeletonText animated style={{ width: '100%', height: '64px', borderRadius: '12px', marginBottom: '10px' }} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="prehrana-empty">
            <IonIcon icon={restaurantOutline} className="prehrana-empty-icon" />
            <IonText color="medium">
              <p>Ni naročil za prikaz.</p>
            </IonText>
          </div>
        ) : (
          <div className="prehrana-list">
            {[...grouped.entries()].map(([date, dayOrders]) => {
              const isToday = date === todayStr;
              return (
                <div key={date} className={`prehrana-day${isToday ? ' prehrana-day--today' : ''}`}>
                  <div className="prehrana-date-header">
                    <IonIcon icon={calendarOutline} />
                    <span>{formatShortDate(date)}</span>
                    {isToday && <IonBadge color="primary" className="today-pill">Danes</IonBadge>}
                  </div>
                  {dayOrders.map((order, idx) => (
                    <IonCard key={order.id ?? idx} className={`prehrana-card${order.ordered ? ' prehrana-card--ordered' : ''}`}>
                      <IonCardContent className="prehrana-card-content">
                        <div className="prehrana-meal-row">
                          <IonIcon icon={restaurantOutline} className="prehrana-meal-icon" />
                          <span className="prehrana-meal-name">
                            {order.meal_name || order.menu_name || mealTypeLabel(order.meal_type)}
                          </span>
                          {order.ordered ? (
                            <IonBadge color="success" className="prehrana-badge">
                              <IonIcon icon={checkmarkCircleOutline} />
                              Naročeno
                            </IonBadge>
                          ) : (
                            <IonBadge color="medium" className="prehrana-badge">Ni naročeno</IonBadge>
                          )}
                        </div>
                        <div className="prehrana-chips-row">
                          <IonChip className="prehrana-chip">
                            <IonLabel>{mealTypeLabel(order.meal_type)}</IonLabel>
                          </IonChip>
                          {order.price != null && (
                            <IonChip className="prehrana-chip prehrana-chip--price">
                              <IonLabel>{order.price.toFixed(2)} €</IonLabel>
                            </IonChip>
                          )}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Prehrana;
