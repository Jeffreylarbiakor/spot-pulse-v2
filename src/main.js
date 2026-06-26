import { MONTHS, getClusters } from './data/store.js';
import { syncPending, registerSyncTriggers } from './data/sync.js';
import { getState, onRoute, isFlow, navTo, closeSub, openSub } from './ui/router.js';
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

let currentMonth = MONTHS.length - 1;  // default to latest month (Jun)

function render(state) {
  appEl.innerHTML = '';
  const flow = isFlow();

  if (state.sub) {
    // Flow screen: sub-bar only
    const isCheckin = state.sub.type === 'checkin' || state.sub.type === 'picker';
    const label = isCheckin ? '← Cancel' : '← Back';
    const onBack = () => {
      if (state.sub.type === 'checkin' || state.sub.type === 'picker') {
        closeSub();
        navTo('home');
      } else {
        closeSub();
      }
    };
    appEl.appendChild(renderSubbar(label, onBack));
  } else {
    // Tab root: full topbar with optional month pills
    appEl.appendChild(renderTopbar(state.tab, currentMonth, (i) => {
      currentMonth = i;
      render(getState());
    }));
  }

  // Screen content
  if (state.sub) {
    const { type, id } = state.sub;
    if (type === 'detail')  appEl.appendChild(renderDetail(id));
    else if (type === 'picker')  appEl.appendChild(renderPicker());
    else if (type === 'checkin') appEl.appendChild(renderCheckin(id));
    else if (type === 'success') appEl.appendChild(renderSuccess(id));
  } else {
    if (state.tab === 'home')   appEl.appendChild(renderHome(currentMonth));
    else if (state.tab === 'spots') appEl.appendChild(renderSpots());
    else if (state.tab === 'about') appEl.appendChild(renderAbout());
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
      // Fire-and-forget: attempt sync after navigating to success screen
      syncPending();
    });
    appEl.appendChild(savebar);
  }

  // Tab bar (hidden in all sub-screens)
  if (!state.sub) {
    appEl.appendChild(renderTabBar(state.tab));
  }

  // Scroll to top on each render
  const view = document.getElementById('view');
  if (view) view.scrollTop = 0;
}

// Initialise: load from IndexedDB into cache, then render
getClusters().then(() => {
  render(getState());
  onRoute(render);
  registerSyncTriggers();
  syncPending(); // flush any pending submissions from a previous session
});
