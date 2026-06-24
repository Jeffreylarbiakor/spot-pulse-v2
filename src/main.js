import { getState, onRoute, isFlow } from './ui/router.js';
import { renderTabBar } from './ui/components/tabbar.js';
import { renderTopbar } from './ui/components/topbar.js';
import { renderHome }    from './ui/screens/home.js';
import { renderSpots }   from './ui/screens/spots.js';
import { renderAbout }   from './ui/screens/about.js';
import { renderDetail }  from './ui/screens/detail.js';
import { renderPicker }  from './ui/screens/picker.js';
import { renderCheckin } from './ui/screens/checkin.js';
import { renderSuccess } from './ui/screens/success.js';
import { closeSub }      from './ui/router.js';

const app = document.getElementById('app');

function render(state) {
  app.innerHTML = '';

  const flow = isFlow();

  // Topbar
  if (flow) {
    const titles = { picker: 'Select Spot', checkin: 'Check-in', success: 'Check-in saved' };
    app.appendChild(renderTopbar({
      title: titles[state.sub.type] || '',
      showBack: true,
      onBack: closeSub,
    }));
  } else {
    const titles = { home: 'Spot Pulse', spots: 'Spots', about: 'About' };
    app.appendChild(renderTopbar({ title: titles[state.tab] || 'Spot Pulse' }));
  }

  // Screen
  if (flow) {
    const { type, id } = state.sub;
    if (type === 'detail')  app.appendChild(renderDetail(id));
    else if (type === 'picker') app.appendChild(renderPicker());
    else if (type === 'checkin') app.appendChild(renderCheckin(id));
    else if (type === 'success') app.appendChild(renderSuccess(id));
  } else {
    if (state.tab === 'home')  app.appendChild(renderHome());
    else if (state.tab === 'spots') app.appendChild(renderSpots());
    else if (state.tab === 'about') app.appendChild(renderAbout());
  }

  // Tab bar (hidden in flow)
  if (!flow) {
    app.appendChild(renderTabBar(state.tab));
  }
}

// Initial render and subscribe
render(getState());
onRoute(render);
