import { lazy, Suspense } from 'react';
import { Redirect, Route, Router, Switch, useLocation, useSearch } from 'wouter';
import { isValidISODate, todayLocal, toMonthKey } from '../shared/dates';
import { baseFor } from './lib/baseFor';
import { AppMark } from './components/AppMark/AppMark';
import { AppShell } from './components/AppShell/AppShell';
import { Button } from './components/Button/Button';
import { ToastRegion } from './components/Toast/ToastRegion';
import { appNavigate, useAppLocation } from './lib/nav';
import { calendarPath, isViewPath } from './routes';
import { DataProvider } from './state/DataContext';
import { FilterProvider } from './state/FilterContext';
import { LastViewProvider, useLastView } from './state/LastViewContext';
import { PinPromptProvider } from './state/PinPromptContext';
import { SessionProvider, useSession } from './state/SessionContext';
import { ThemeProvider } from './state/ThemeContext';
import { ToastProvider } from './state/ToastContext';
import { CalendarView } from './views/CalendarView/CalendarView';
import { DayDetail } from './views/DayDetail/DayDetail';
import { EventDetail } from './views/EventDetail/EventDetail';
import { NotFound } from './views/NotFound/NotFound';
import { PasscodeGate } from './views/PasscodeGate/PasscodeGate';
import { TimelineView } from './views/TimelineView/TimelineView';

const EventForm = lazy(() => import('./views/EventForm/EventForm'));
const PeoplePage = lazy(() => import('./views/PeoplePage/PeoplePage'));
const PersonForm = lazy(() => import('./views/PeoplePage/PersonForm'));
const AdminPage = lazy(() => import('./views/AdminPage/AdminPage'));

function LoadingShell() {
  return (
    <div className="loading-shell" aria-busy="true">
      <div className="loading-shell__header">
        <AppMark size={24} />
        <span className="loading-shell__name">Friends Plans</span>
      </div>
      <div className="loading-shell__toolbar" />
      <div className="loading-shell__grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="loading-shell__row" />
        ))}
      </div>
    </div>
  );
}

function Pages() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to={calendarPath(toMonthKey(todayLocal()))} replace />
      </Route>
      <Route path="/calendar/:month">
        <CalendarView />
      </Route>
      <Route path="/timeline/:month">
        <TimelineView />
      </Route>
      <Route path="/people">
        <Suspense fallback={null}>
          <PeoplePage />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={null}>
          <AdminPage />
        </Suspense>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function Sheets() {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/day/:date">{(p) => (p.date && isValidISODate(p.date) ? <DayDetail key={p.date} date={p.date} /> : null)}</Route>
        <Route path="/plans/new">
          <EventForm />
        </Route>
        <Route path="/plans/:id/edit">{(p) => <EventForm key={p.id} id={p.id ?? ''} />}</Route>
        <Route path="/plans/:id">{(p) => <EventDetail key={p.id} id={p.id ?? ''} />}</Route>
        <Route path="/people/new">
          <PersonForm />
        </Route>
        <Route path="/people/:id/edit">{(p) => <PersonForm key={p.id} id={p.id ?? ''} />}</Route>
      </Switch>
    </Suspense>
  );
}

function AuthedApp() {
  const [path] = useLocation();
  const search = useSearch();
  const { lastViewPath, hasRealView } = useLastView();
  const base = baseFor(path, search, lastViewPath, hasRealView);
  return (
    <AppShell showFab={isViewPath(base)}>
      {/* The page under any open sheet is rendered with a fixed location. */}
      <Router hook={() => [base, appNavigate]}>
        <Pages />
      </Router>
      <Sheets />
    </AppShell>
  );
}

function ConnectionProblem() {
  const { refresh } = useSession();
  return (
    <main className="connection-problem">
      <p>Couldn&apos;t reach the server. Check your connection.</p>
      <Button variant="primary" onClick={() => void refresh()}>
        Try again
      </Button>
    </main>
  );
}

function Root() {
  const session = useSession();
  if (session.status === 'loading') return <LoadingShell />;
  if (!session.authenticated) {
    return session.failed ? <ConnectionProblem /> : <PasscodeGate />;
  }
  return (
    <DataProvider>
      <FilterProvider>
        <LastViewProvider>
          <PinPromptProvider>
            <AuthedApp />
          </PinPromptProvider>
        </LastViewProvider>
      </FilterProvider>
    </DataProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <Router hook={useAppLocation}>
            <Root />
          </Router>
          <ToastRegion />
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
