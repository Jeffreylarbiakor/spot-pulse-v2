import { MONTHS, getClusters } from './data/store.js';
import { syncPending, registerSyncTriggers } from './data/sync.js';
import { getSession, signOut } from './auth/session.js';
import { showSignInOverlay } from './ui/screens/signin.js';
import { getState, onRoute, navTo, closeSub, openSub } from './ui/router.js';
import { renderTopbar, renderSubbar } from './ui/components/topbar.js';
import { renderTabBar }  from './ui/components/tabbar.js';
import { renderHome }    from './ui/screens/home.js';
import { renderSpots }   from './ui/screens/spots.js';
import { renderAbout }   from './ui/screens/about.js';
import { renderDetail }  from './ui/screens/detail.js';
import { renderPicker }  from './ui/screens/picker.js';
import { renderCheckin, saveCheckin } from './ui/screens/checkin.js';
import { renderSuccess } from './ui/screens/success.js';

const appEl = document.getElementById('app');
appEl.className = 'app';

let currentMonth = MONTHS.length - 1;

function renderSessionStrip(session) {
  const el = document.createElement('div');
  if (session.mode === 'rc') {
    const firstName = session.rc.name.split(' ')[0];
    const clusterShort = session.rc.clusterName.split(' ')[0];
    el.className = 'session-strip rc';
    el.innerHTML = `
      <span>RC: ${firstName} · ${clusterShort}</span>
      <button id="signOutBtn" aria-label="Sign out">Sign out</button>`;
    el.querySelector('#signOutBtn').addEventListener('click', signOut);
  } else {
    el.className = 'session-strip demo';
    el.innerHTML = `
      <span>Demo mode · Illustrative data only</span>
      <button id="signInBtn" aria-label="Sign in as Regional Coordinator">Sign in as RC →</button>`;
    el.querySelector('#signInBtn').addEventListener('click', showSignInOverlay);
  }
  return el;
}

function render(state) {
  const session = getSession();
  appEl.innerHTML = '';

  if (state.sub) {
    const isCheckin = state.sub.type === 'checkin' || state.sub.type === 'picker';
    const label = isCheckin ? '← Cancel' : '← Back';
    const onBack = () => {
      if (state.sub.type === 'checkin' || state.sub.type === 'picker') {
        closeSub(); navTo('home');
      } else {
        closeSub();
      }
    };
    appEl.appendChild(renderSubbar(label, onBack));
  } else {
    appEl.appendChild(renderTopbar(state.tab, currentMonth, (i) => {
      currentMonth = i;
      render(getState());
    }));
    // Session strip only on tab roots (not flow screens)
    appEl.appendChild(renderSessionStrip(session));
  }

  // Screen content
  if (state.sub) {
    const { type, id } = state.sub;
    if (type === 'detail')   appEl.appendChild(renderDetail(id));
    else if (type === 'picker')  appEl.appendChild(renderPicker());
    else if (type === 'checkin') appEl.appendChild(renderCheckin(id));
    else if (type === 'success') appEl.appendChild(renderSuccess(id));
  } else {
    if (state.tab === 'home')        appEl.appendChild(renderHome(currentMonth));
    else if (state.tab === 'spots')  appEl.appendChild(renderSpots());
    else if (state.tab === 'about')  appEl.appendChild(renderAbout());
  }

  // Save bar (check-in only)
  if (state.sub?.type === 'checkin') {
    const savebar = document.createElement('div');
    savebar.className = 'savebar';
    savebar.innerHTML = `<button class="btn btn-primary btn-block" id="saveBtn">Save check-in</button>`;
    const spotId = state.sub.id;
    savebar.querySelector('#saveBtn').addEventListener('click', async () => {
      await saveCheckin(spotId);
      await getClusters();
      openSub('success', spotId);
      syncPending();
    });
    appEl.appendChild(savebar);
  }

  if (!state.sub) appEl.appendChild(renderTabBar(state.tab));

  const view = document.getElementById('view');
  if (view) view.scrollTop = 0;
}

// Re-render when session changes (sign-in / sign-out)
window.addEventListener('spot-pulse:session-changed', () => render(getState()));

getClusters().then(() => {
  render(getState());
  onRoute(render);
  registerSyncTriggers();
  syncPending();
});
