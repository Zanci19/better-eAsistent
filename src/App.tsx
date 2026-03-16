import { Redirect, Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  alertCircleOutline,
  bookOutline,
  calendarOutline,
  documentTextOutline,
  personOutline,
  restaurantOutline,
  ribbonOutline,
} from 'ionicons/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Timetable from './pages/Timetable';
import Grades from './pages/Grades';
import Absences from './pages/Absences';
import Evaluations from './pages/Evaluations';
import Homework from './pages/Homework';
import Profile from './pages/Profile';
import Prehrana from './pages/Prehrana';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

interface NavItem {
  label: string;
  href: string;
  icon: string;
  note?: string;
}

const SIDE_NAV_ITEMS: NavItem[] = [
  { label: 'Ocene', href: '/ocene', icon: ribbonOutline },
  { label: 'Izostanki', href: '/izostanki', icon: alertCircleOutline },
  { label: 'Ocenjevanja', href: '/ocenjevanja', icon: documentTextOutline },
  { label: 'Domača naloga', href: '/naloge', icon: bookOutline },
];

const AppMenu: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonContent>
        <div className="menu-header">
          <IonIcon icon={personOutline} className="menu-avatar-icon" />
          <div>
            <p className="menu-user-name">{user?.name ?? 'Dijak'}</p>
            <IonNote className="menu-user-sub">eAsistent</IonNote>
          </div>
        </div>

        <IonList lines="none">
          <IonListHeader>Šola</IonListHeader>
          {SIDE_NAV_ITEMS.map((item) => (
            <IonMenuToggle key={item.href} autoHide={false}>
              <IonItem
                button
                detail={false}
                className={`menu-item${history.location.pathname === item.href ? ' menu-item--active' : ''}`}
                onClick={() => history.push(item.href)}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{item.label}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <IonRouterOutlet>
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    );
  }

  return (
    <>
      <AppMenu />
      <IonTabs>
        <IonRouterOutlet id="main-content">
          <Route exact path="/prehrana" component={Prehrana} />
          <Route exact path="/urnik" component={Timetable} />
          <Route exact path="/ocene" component={Grades} />
          <Route exact path="/izostanki" component={Absences} />
          <Route exact path="/ocenjevanja" component={Evaluations} />
          <Route exact path="/naloge" component={Homework} />
          <Route exact path="/profil" component={Profile} />
          <Route exact path="/">
            <Redirect to="/urnik" />
          </Route>
          <Route>
            <Redirect to="/urnik" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="prehrana" href="/prehrana">
            <IonIcon aria-hidden="true" icon={restaurantOutline} />
            <IonLabel>Prehrana</IonLabel>
          </IonTabButton>
          <IonTabButton tab="urnik" href="/urnik">
            <IonIcon aria-hidden="true" icon={calendarOutline} />
            <IonLabel>Urnik</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profil" href="/profil">
            <IonIcon aria-hidden="true" icon={personOutline} />
            <IonLabel>Profil</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
