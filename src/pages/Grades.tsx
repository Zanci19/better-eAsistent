import React, { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
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
import { schoolOutline, ribbonOutline, timeOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  type Grade,
  type GradesResponse,
  formatShortDate,
  getGrades,
  gradeColor,
  gradeLabel,
} from '../services/api';
import './Grades.css';

interface SubjectGroup {
  subject_name: string;
  subject_shortname: string;
  teacher_name: string;
  grades: Grade[];
  average: number | null;
}

function groupGradesBySubject(grades: Grade[]): SubjectGroup[] {
  const map = new Map<number, SubjectGroup>();

  for (const g of grades) {
    const existing = map.get(g.subject_id);
    if (existing) {
      existing.grades.push(g);
    } else {
      map.set(g.subject_id, {
        subject_name: g.subject_name,
        subject_shortname: g.subject_shortname,
        teacher_name: g.teacher_name,
        grades: [g],
        average: null,
      });
    }
  }

  const groups = Array.from(map.values());

  for (const group of groups) {
    group.grades.sort((a, b) => b.date_created.localeCompare(a.date_created));
    const numericGrades = group.grades
      .filter((g) => !g.is_final && typeof g.grade_value === 'number' && g.grade_value > 0)
      .map((g) => g.grade_value);
    if (numericGrades.length > 0) {
      group.average = numericGrades.reduce((s, v) => s + v, 0) / numericGrades.length;
    }
  }

  groups.sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'sl'));
  return groups;
}

function gradeTypeLabel(type: string): string {
  switch (type) {
    case 'writing': return 'Pisno';
    case 'oral': return 'Ustno';
    case 'practical': return 'Praktično';
    default: return type ?? '';
  }
}

const Grades: React.FC = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<GradesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGrades = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getGrades(accessToken);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Napaka pri nalaganju ocen.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadGrades();
    (event.target as HTMLIonRefresherElement).complete();
  };

  const groups = groupGradesBySubject(data?.items ?? []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Ocene</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <div className="grades-error">
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {isLoading ? (
          <div className="grades-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <IonSkeletonText animated style={{ width: '55%', height: '20px', marginBottom: '8px' }} />
                <IonSkeletonText animated style={{ width: '100%', height: '64px', borderRadius: '10px' }} />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="grades-empty">
            <IonIcon icon={ribbonOutline} className="grades-empty-icon" />
            <IonText color="medium">
              <p>Ni ocen za prikaz.</p>
            </IonText>
          </div>
        ) : (
          <div className="grades-list">
            {groups.map((group) => (
              <IonCard key={group.subject_name} className="subject-card">
                <IonCardHeader className="subject-card-header">
                  <div className="subject-header-row">
                    <div className="subject-title-block">
                      <IonIcon icon={schoolOutline} className="subject-icon" />
                      <div>
                        <IonCardTitle className="subject-name">{group.subject_name}</IonCardTitle>
                        <IonNote className="subject-teacher">{group.teacher_name}</IonNote>
                      </div>
                    </div>
                    {group.average !== null && (
                      <div className="subject-avg-block">
                        <IonBadge
                          color={gradeColor(Math.round(group.average))}
                          className="subject-avg-badge"
                        >
                          {group.average.toFixed(2)}
                        </IonBadge>
                        <span className="subject-avg-label">povprečje</span>
                      </div>
                    )}
                  </div>
                </IonCardHeader>
                <IonCardContent className="subject-card-content">
                  <IonList lines="inset" className="grade-list">
                    {group.grades.map((grade, idx) => (
                      <IonItem
                        key={grade.id ?? idx}
                        className="grade-item"
                        lines={idx < group.grades.length - 1 ? 'inset' : 'none'}
                      >
                        <IonBadge
                          slot="start"
                          color={gradeColor(grade.grade_value)}
                          className="grade-badge"
                        >
                          {grade.grade}
                        </IonBadge>
                        <IonLabel>
                          <div className="grade-desc">{grade.description || gradeLabel(grade.grade_value)}</div>
                          <div className="grade-meta">
                            {grade.type && (
                              <IonChip className="grade-chip">
                                <IonLabel>{gradeTypeLabel(grade.type)}</IonLabel>
                              </IonChip>
                            )}
                            {grade.period && (
                              <IonChip className="grade-chip grade-chip--period">
                                <IonLabel>{grade.period}</IonLabel>
                              </IonChip>
                            )}
                          </div>
                        </IonLabel>
                        <div slot="end" className="grade-date">
                          <IonIcon icon={timeOutline} />
                          <span>{formatShortDate(grade.date_created)}</span>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Grades;
