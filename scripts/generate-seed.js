/**
 * Generates seed/clusters.json from the real EduSpots network data (as of June 2026).
 * Sources: eduspots.org/the-eduspots-network/, EduSpots Projects PDF, network infographic.
 *
 * Spot status:
 *   - Active spots:        pillar scores + trend data (Apr/May illustrative, Jun null)
 *   - New 2024 (induction): induction:true, lower illustrative scores
 *   - Legacy (inactive):   inactive:true, no scores
 *
 * Run: node scripts/generate-seed.js
 */
import { writeFileSync } from 'fs';

// ── Pillar score templates (access/25, engagement/20, support/25, governance/30) ──
const PERF = {
  high:      { access: 22, engagement: 17, support: 22, governance: 27 }, // ~88
  good:      { access: 19, engagement: 15, support: 20, governance: 23 }, // ~77
  average:   { access: 16, engagement: 12, support: 16, governance: 19 }, // ~63
  induction: { access: 11, engagement:  8, support: 11, governance: 14 }, // ~44
};

const score = p => p.access + p.engagement + p.support + p.governance;

function pillars(perf, delta = 0) {
  const base = PERF[perf];
  return {
    access:     Math.min(25, base.access     + delta),
    engagement: Math.min(20, base.engagement + (delta > 0 ? 1 : 0)),
    support:    Math.min(25, base.support    + delta),
    governance: Math.min(30, base.governance + (delta > 0 ? 1 : 0)),
  };
}

// Active/induction spot — has scores and trend
function spot(id, name, community, district, region, year, programmes, perf, induction = false) {
  const apr = pillars(perf, 0);
  const may = pillars(perf, 1);
  const s = {
    id, name, community, district, region, year, programmes,
    pillars: apr,
    trend: [score(apr), score(may), null],
  };
  if (induction) s.induction = true;
  return s;
}

// Legacy/inactive spot — no scores
function legacy(id, name, community, district, region, year = null) {
  return { id, name, community, district, region, ...(year ? { year } : {}), inactive: true };
}

const S = spot;
const L = legacy;

// ─────────────────────────────────────────────────────────────────────────────
const seed = {
  months: ['Apr 2026', 'May 2026', 'Jun 2026'],
  reportingMonth: 'Jun 2026',
  clusters: [

    // ── 1. Volta ─────────────────────────────────────────────────────────────
    {
      name: 'Volta',
      rc: 'Cynthia Mawuena Tetteh',
      rcId: 'rc-001',
      spots: [
        // Active (8)
        S('agbledomi',        'Agbledomi Spot',             'Agbledomi',        'Agortime-Ziope',         'Volta',           2020, ['EduKidz','DigiLit'],                        'average'),
        S('atsata-bame',      'Atsata Bame Spot',           'Atsata Bame',      'Volta Region',           'Volta',           2021, ['EduKidz'],                                  'average'),
        S('atanve',           'Atanve Spot',                'Atanve',           'Agortime-Ziope',         'Volta',           2019, ['EduKidz','DigiLit'],                        'average'),
        S('dodome-awuiasu',   'Dodome Awuiasu Spot',        'Dodome Awuiasu',   'Akatsi North',           'Volta',           2021, ['EduKidz','EcoSTEM'],                        'average'),
        S('metstrikasa',      'Metstrikasa Spot',           'Metstrikasa',      'Ketu North',             'Volta',           2021, ['EduKidz','DigiLit'],                        'average'),
        S('posmonu',          'Posmonu Spot',               'Ave Posmonu',      'Central Tongu',          'Volta',           2016, ['EduKidz','DigiLit','EcoSTEM','Ignite Equity'], 'high'),
        S('takuve',           'Takuve Spot',                'Takuve',           'Agortime-Ziope',         'Volta',           2018, ['EduKidz','DigiLit','Ignite Equity'],        'good'),
        S('wodome-akatsi',    'Wodome Akatsi Spot',         'Wodome',           'Akatsi South',           'Volta',           2020, ['EduKidz','DigiLit'],                        'average'),
        // Legacy (2)
        L('apegusu',          'Apegusu Spot',               'Apegusu',          'Volta Region',           'Volta'),
        L('kodzi',            'Kodzi Spot',                 'Kodzi',            'Volta Region',           'Volta'),
      ],
    },

    // ── 2. Middle ────────────────────────────────────────────────────────────
    {
      name: 'Middle',
      rc: 'Yahya Seidu',
      rcId: 'rc-002',
      spots: [
        // Active (13)
        S('abofour',          'Abofour Spot',               'Abofour',          'Offinso North',          'Ashanti',         2015, ['EduKidz','DigiLit','EcoSTEM','Ignite Equity'], 'high'),
        S('ahenkiro',         'Ahenkiro Spot',              'Ahenkiro',         'Afigya Nwabre North',    'Ashanti',         2020, ['EduKidz','DigiLit'],                        'average'),
        S('akumadan',         'Akumadan Spot',              'Akumadan',         'Offinso North',          'Ashanti',         2016, ['EduKidz','DigiLit','EcoSTEM','Ignite Equity'], 'high'),
        S('ameyaw',           'Ameyaw Spot',                'Ameyaw',           'Techiman Municipal',     'Bono',            2021, ['EduKidz','DigiLit'],                        'average'),
        S('banda',            'Banda Spot',                 'Banda Kabrono',    'Banda District',         'Bono',            2022, ['EduKidz'],                                  'average'),
        S('bono-manso',       'Bono Manso Spot',            'Bono Manso',       'Sunyani Municipal',      'Bono',            2021, ['EduKidz','DigiLit'],                        'average'),
        S('donkorkrom',       'Donkorkrom Spot',            'Donkorkrom',       'Kwahu East',             'Eastern',         2020, ['EduKidz','DigiLit'],                        'average'),
        S('ejura',            'Ejura Spot',                 'Ejura',            'Ejura-Sekyedumase',      'Ashanti',         2017, ['EduKidz','DigiLit','Ignite Equity'],        'good'),
        S('ejisu-besease',    'Ejisu-Besease Spot',         'Ejisu-Besease',    'Ejisu-Juaben',           'Ashanti',         2019, ['EduKidz','DigiLit'],                        'good'),
        S('ekawso',           'Ekawso Spot',                'Nkawkaw',          'Kwahu West',             'Eastern',         2021, ['EduKidz'],                                  'average'),
        S('nkonya',           'Nkonya Spot',                'Nkonya',           'Nkoranza South',         'Bono',            2022, ['EduKidz'],                                  'average'),
        S('sefwi-asanteman',  'Sefwi Asanteman Spot',       'Sefwi Asanteman',  'Bibiani-Anhwiaso-Bekwai','Western North',   2022, ['EduKidz','DigiLit'],                        'average'),
        S('yamfo',            'Yamfo Spot',                 'Yamfo',            'Tano South',             'Ahafo',           2020, ['EduKidz','DigiLit'],                        'good'),
        // Legacy (2)
        L('dichemso',         'Dichemso Spot',              'Dichemso',         'Kumasi Metro',           'Ashanti'),
        L('tease',            'Tease Spot',                 'Tease',            'Ashanti Region',         'Ashanti'),
      ],
    },

    // ── 3. Northern ──────────────────────────────────────────────────────────
    {
      name: 'Northern/Overseas',
      rc: 'Getrude Akunlibe',
      rcId: 'rc-003',
      spots: [
        // Active (7 — includes Joska, Kenya as the "Overseas" Spot)
        S('bimbilla',         'Bimbilla Spot',              'Bimbilla',         'Nanumba North',          'Northern',        2019, ['EduKidz','DigiLit'],                        'average'),
        S('dulugu',           'Dulugu Spot',                'Dulugu',           'Tolon District',         'Northern',        2017, ['EduKidz','DigiLit','EcoSTEM'],              'good'),
        S('joska',            'Joska Spot',                 'Joska',            'Mavoko Sub-County',      'Machakos (Kenya)',2023, ['EduKidz'],                                  'average'),
        S('kalpohin',         'Kalpohin Spot',              'Kalpohin',         'Savelugu Municipal',     'Northern',        2019, ['EduKidz','DigiLit','Ignite Equity'],        'good'),
        S('sakasaka',         'Sakasaka Spot',              'Sakasaka',         'Tamale Metro',           'Northern',        2018, ['EduKidz','DigiLit'],                        'average'),
        S('savelugu',         'Savelugu Spot',              'Savelugu',         'Savelugu Municipal',     'Northern',        2019, ['EduKidz'],                                  'average'),
        S('zangbalun',        'Zangbalun Spot',             'Zangbalun',        'Kumbungu District',      'Northern',        2022, ['EduKidz','DigiLit'],                        'average'),
        // Legacy (1)
        L('badili-zone',      'Badili Zone Spot',           'Badili',           'Nairobi County',         'Nairobi (Kenya)'),
      ],
    },

    // ── 4. Central/Western ───────────────────────────────────────────────────
    {
      name: 'Central/Western',
      rc: 'Abdul Wadud Suleiman',
      rcId: 'rc-004',
      spots: [
        // Active (12 — includes Teshie, Greater Accra)
        S('ampatano',         'Ampatano Spot',              'Ampatano',         'Ahanta West',            'Western',         2019, ['EduKidz','DigiLit','Ignite Equity'],        'good'),
        S('asemkow',          'Asemkow Spot',               'Asemkow',          'Ahanta West',            'Western',         2020, ['EduKidz','DigiLit'],                        'average'),
        S('bosomadwe',        'Bosomadwe Spot',             'Bosomadwe',        'Assin North',            'Central',         2020, ['EduKidz','EcoSTEM'],                        'average'),
        S('dadwen',           'Dadwen Spot',                'Dadwen',           'Prestea-Huni Valley',    'Western',         2022, ['EduKidz','DigiLit'],                        'average'),
        S('ekumfi',           'Ekumfi Spot',                'Ekumfi Ekumpoano', 'Mfantsiman',             'Central',         2021, ['EduKidz','Ignite Equity'],                  'average'),
        S('elmina',           'Elmina Spot',                'Elmina',           'KEEA',                   'Central',         2018, ['EduKidz','DigiLit','EcoSTEM'],              'good'),
        S('funkoe',           'Funkoe Spot',                'Funka',            'Ahanta West',            'Western',         2021, ['EduKidz'],                                  'average'),
        S('gomoa-manso',      'Gomoa-Manso Spot',           'Gomoa Manso',      'Gomoa Central',          'Central',         2020, ['EduKidz','DigiLit'],                        'average'),
        S('kotokoli-zongo',   'Kotokoli Zongo Spot',        'Kotokoli Zongo',   'Kumasi Metro',           'Ashanti',         2022, ['EduKidz','DigiLit'],                        'average'),
        S('new-ebu',          'New Ebu Spot',               'New Ebu',          'Ahanta District',        'Western',         2022, ['EduKidz'],                                  'average'),
        S('sanzule',          'Sanzule Spot',               'Sanzule',          'Ellembelle District',    'Western',         2021, ['EduKidz','EcoSTEM'],                        'average'),
        S('teshie',           'Teshie Spot',                'Teshie',           'Ledzokuku',              'Greater Accra',   2025, ['EduKidz'],                                  'average'),
        // Legacy (2)
        L('cape-3-points',    'Cape 3 Points Spot',         'Cape Three Points','Ahanta West',            'Western'),
        L('new-atuabo',       'New Atuabo Spot',            'New Atuabo',       'Ellembelle District',    'Western'),
      ],
    },

    // ── 5. New Spots ─────────────────────────────────────────────────────────
    // Cross-network induction cluster — all spots admitted 2024, being onboarded
    {
      name: 'New Spots',
      rc: 'Abdul-Malik Iddrisu',
      rcId: 'rc-005',
      spots: [
        // From Volta geography (2)
        S('abutia',           'Abutia Spot',                'Abutia',           'Ho Municipal',           'Volta',           2024, ['EduKidz'],                                  'induction', true),
        S('ho-kpenue',        'Ho-Kpenue Spot',             'Ho-Kpenue',        'Ho Municipal',           'Volta',           2024, ['EduKidz'],                                  'induction', true),
        // From Middle geography (3)
        S('dormaa-aboabo',    'Dormaa Ahenkro Aboabo No.4', 'Dormaa Ahenkro',   'Dormaa Central',         'Bono',            2024, ['EduKidz'],                                  'induction', true),
        S('kato-berekum',     'Kato-Berekum Spot',          'Kato',             'Berekum East',           'Bono',            2024, ['EduKidz'],                                  'induction', true),
        S('soko',             'Soko Spot',                  'Soko',             'Afigya Kwabre',          'Ashanti',         2024, ['EduKidz'],                                  'induction', true),
        // From Central/Western geography (2)
        S('asemasa',          'Asemasa Spot',               'Butre',            'Ahanta West',            'Western',         2024, ['EduKidz'],                                  'induction', true),
        S('kejabil',          'Kejabil Spot',               'Kejabil',          'Ahanta West',            'Western',         2024, ['EduKidz'],                                  'induction', true),
        // From Northern geography (4)
        S('gambibgo',         'Gambibgo Spot',              'Gambibgo',         'Gambibgo District',      'Upper East',      2024, ['EduKidz'],                                  'induction', true),
        S('katanga-zuarungu', 'Katanga-Zuarungu Spot',      'Katanga-Zuarungu', 'Bolgatanga Municipal',   'Upper East',      2024, ['EduKidz'],                                  'induction', true),
        S('kumbungu-zamigu',  'Kumbungu Zamigu Spot',       'Kumbungu Zamigu',  'Kumbungu District',      'Northern',        2024, ['EduKidz'],                                  'induction', true),
        S('piisie',           'Piisie Spot',                'Piisie',           'Kumbungu District',      'Northern',        2024, ['EduKidz'],                                  'induction', true),
      ],
    },

  ],
};

// ── Write output ──────────────────────────────────────────────────────────────
writeFileSync('./seed/clusters.json', JSON.stringify(seed, null, 2));

const allSpots   = seed.clusters.flatMap(c => c.spots);
const active     = allSpots.filter(s => !s.inactive && !s.induction);
const induction  = allSpots.filter(s => s.induction);
const inactiveS  = allSpots.filter(s => s.inactive);

console.log(`\nSeed written → seed/clusters.json`);
console.log(`Total spots : ${allSpots.length}`);
console.log(`  Active    : ${active.length}`);
console.log(`  Induction : ${induction.length}`);
console.log(`  Legacy    : ${inactiveS.length}`);
console.log(`\nBy cluster:`);
seed.clusters.forEach(c => {
  const a = c.spots.filter(s => !s.inactive && !s.induction).length;
  const i = c.spots.filter(s => s.induction).length;
  const l = c.spots.filter(s => s.inactive).length;
  console.log(`  ${c.name.padEnd(42)} active:${a}  induction:${i}  legacy:${l}`);
});
