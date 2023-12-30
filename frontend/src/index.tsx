/* @refresh reload */
import { Router, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import ActiveScan from './routes/ActiveScan';
import Reports from './routes/Reports';
import Admin from './routes/Admin';
import './input.css';
import App from './App';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}
render(() => (
  <Router>
    <Route path="/" component={App} />
    <Route path="/active-scan" component={ActiveScan} />
    <Route path="/reports" component={Reports} />
    <Route path="/admin" component={Admin} />
  </Router>
), document.getElementById('root')!);
