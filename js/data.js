/* ============================================================================
   data.js — Country dataset + age-structure construction
   Figures from UN World Population Prospects 2024 (medium variant) and
   World Bank data (2024). Source: database.earth / population.un.org/wpp/
   ============================================================================ */

const BRACKETS = [
  { key: 'child',  label: '0–14',  lo: 0,  hi: 14,  color: '#14B8A6' },
  { key: 'young',  label: '15–39', lo: 15, hi: 39,  color: '#0EA5E9' },
  { key: 'adult',  label: '40–64', lo: 40, hi: 64,  color: '#6366F1' },
  { key: 'senior', label: '65+',   lo: 65, hi: 100, color: '#64748B' },
];

const REPLACEMENT_TFR = 2.1;
const PERSONS_PER_FIGURE = 1;


const COUNTRIES = [
  // ── EAST ASIA ────────────────────────────────────────────────────────────────────
  { name: 'South Korea',            label: 'South Korea',   iso: 'KR', pop: 51.7, tfr: 0.73, lifeExp: 84.4, u15: 0.112, o65: 0.190, med: 45.5 },
  { name: 'Japan',                  label: 'Japan',         iso: 'JP', pop: 123.8, tfr: 1.22, lifeExp: 84.9, u15: 0.112, o65: 0.300, med: 49.9 },
  { name: 'China',                  label: 'China',         iso: 'CN', pop: 1419, tfr: 1.01, lifeExp: 78.0, u15: 0.165, o65: 0.147, med: 40.1 },
  { name: 'North Korea',            label: 'North Korea',   iso: 'KP', pop: 26.5, tfr: 1.78, lifeExp: 73.7, u15: 0.190, o65: 0.115, med: 36.5 },
  { name: 'Mongolia',               label: 'Mongolia',      iso: 'MN', pop: 3.5,  tfr: 2.63, lifeExp: 72.0, u15: 0.275, o65: 0.050, med: 29.0 },
  { name: 'Taiwan',                 label: 'Taiwan',        iso: 'TW', pop: 23.2, tfr: 0.86, lifeExp: 80.7, u15: 0.118, o65: 0.198, med: 43.5 },
  // ── SOUTHEAST ASIA ─────────────────────────────────────────────────────────────────
  { name: 'Indonesia',              label: 'Indonesia',     iso: 'ID', pop: 283.5, tfr: 2.11, lifeExp: 71.3, u15: 0.248, o65: 0.072, med: 30.5 },
  { name: 'Vietnam',                label: 'Vietnam',       iso: 'VN', pop: 101.0, tfr: 1.90, lifeExp: 74.7, u15: 0.228, o65: 0.082, med: 32.5 },
  { name: 'Philippines',            label: 'Philippines',   iso: 'PH', pop: 115.8, tfr: 1.89, lifeExp: 69.9, u15: 0.290, o65: 0.058, med: 25.5 },
  { name: 'Thailand',               label: 'Thailand',      iso: 'TH', pop: 71.7, tfr: 1.20, lifeExp: 76.6, u15: 0.155, o65: 0.145, med: 41.0 },
  { name: 'Myanmar',                label: 'Myanmar',       iso: 'MM', pop: 54.5, tfr: 2.10, lifeExp: 67.1, u15: 0.252, o65: 0.060, med: 29.5 },
  { name: 'Malaysia',               label: 'Malaysia',      iso: 'MY', pop: 35.6, tfr: 1.54, lifeExp: 76.8, u15: 0.230, o65: 0.078, med: 31.5 },
  { name: 'Cambodia',               label: 'Cambodia',      iso: 'KH', pop: 17.6, tfr: 2.55, lifeExp: 70.8, u15: 0.290, o65: 0.050, med: 26.5 },
  { name: 'Laos',                   label: 'Laos',          iso: 'LA', pop: 7.8,  tfr: 2.40, lifeExp: 69.2, u15: 0.298, o65: 0.045, med: 25.0 },
  { name: 'Papua New Guinea',       label: 'Papua New Guinea', iso: 'PG', pop: 10.6, tfr: 3.07, lifeExp: 66.3, u15: 0.350, o65: 0.036, med: 22.5 },
  { name: 'Timor-Leste',            label: 'Timor-Leste',   iso: 'TL', pop: 1.4,  tfr: 2.63, lifeExp: 67.9, u15: 0.340, o65: 0.038, med: 22.5 },
  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────────────
  { name: 'India',                  label: 'India',         iso: 'IN', pop: 1451, tfr: 1.96, lifeExp: 72.2, u15: 0.245, o65: 0.073, med: 29.8 },
  { name: 'Pakistan',               label: 'Pakistan',      iso: 'PK', pop: 251.3, tfr: 3.55, lifeExp: 67.8, u15: 0.348, o65: 0.045, med: 21.5 },
  { name: 'Bangladesh',             label: 'Bangladesh',    iso: 'BD', pop: 173.6, tfr: 2.14, lifeExp: 74.9, u15: 0.265, o65: 0.060, med: 28.5 },
  { name: 'Afghanistan',            label: 'Afghanistan',   iso: 'AF', pop: 42.6, tfr: 4.76, lifeExp: 66.3, u15: 0.425, o65: 0.030, med: 18.0 },
  { name: 'Nepal',                  label: 'Nepal',         iso: 'NP', pop: 29.7, tfr: 1.96, lifeExp: 70.6, u15: 0.265, o65: 0.068, med: 27.0 },
  { name: 'Sri Lanka',              label: 'Sri Lanka',     iso: 'LK', pop: 23.1, tfr: 1.95, lifeExp: 77.7, u15: 0.212, o65: 0.128, med: 34.5 },
  // ── CENTRAL ASIA ───────────────────────────────────────────────────────────────────
  { name: 'Kazakhstan',             label: 'Kazakhstan',    iso: 'KZ', pop: 20.6, tfr: 2.98, lifeExp: 74.5, u15: 0.285, o65: 0.078, med: 30.5 },
  { name: 'Uzbekistan',             label: 'Uzbekistan',    iso: 'UZ', pop: 36.4, tfr: 3.49, lifeExp: 72.5, u15: 0.290, o65: 0.055, med: 28.5 },
  { name: 'Turkmenistan',           label: 'Turkmenistan',  iso: 'TM', pop: 7.5,  tfr: 2.66, lifeExp: 70.2, u15: 0.288, o65: 0.050, med: 28.5 },
  { name: 'Kyrgyzstan',             label: 'Kyrgyzstan',    iso: 'KG', pop: 7.2,  tfr: 2.78, lifeExp: 71.8, u15: 0.305, o65: 0.045, med: 26.5 },
  { name: 'Tajikistan',             label: 'Tajikistan',    iso: 'TJ', pop: 10.6, tfr: 3.04, lifeExp: 71.9, u15: 0.348, o65: 0.035, med: 22.5 },
  // ── MIDDLE EAST ────────────────────────────────────────────────────────────────────
  { name: 'Iran',                   label: 'Iran',          iso: 'IR', pop: 91.6, tfr: 1.68, lifeExp: 77.9, u15: 0.235, o65: 0.072, med: 33.5 },
  { name: 'Turkey',                 label: 'Türkiye',       iso: 'TR', pop: 87.5, tfr: 1.62, lifeExp: 77.4, u15: 0.218, o65: 0.098, med: 34.0 },
  { name: 'Saudi Arabia',           label: 'Saudi Arabia',  iso: 'SA', pop: 34.0, tfr: 2.31, lifeExp: 79.0, u15: 0.248, o65: 0.040, med: 30.0 },
  { name: 'Iraq',                   label: 'Iraq',          iso: 'IQ', pop: 46.0, tfr: 3.22, lifeExp: 72.4, u15: 0.370, o65: 0.036, med: 21.5 },
  { name: 'Syria',                  label: 'Syria',         iso: 'SY', pop: 24.7, tfr: 2.70, lifeExp: 72.6, u15: 0.330, o65: 0.040, med: 23.5 },
  { name: 'Yemen',                  label: 'Yemen',         iso: 'YE', pop: 40.6, tfr: 4.50, lifeExp: 69.4, u15: 0.395, o65: 0.032, med: 19.5 },
  { name: 'Jordan',                 label: 'Jordan',        iso: 'JO', pop: 11.6, tfr: 2.60, lifeExp: 78.0, u15: 0.320, o65: 0.042, med: 24.0 },
  { name: 'Israel',                 label: 'Israel',        iso: 'IL', pop: 9.4,  tfr: 2.78, lifeExp: 82.7, u15: 0.270, o65: 0.125, med: 30.5 },
  { name: 'Lebanon',                label: 'Lebanon',       iso: 'LB', pop: 5.8,  tfr: 2.23, lifeExp: 77.9, u15: 0.245, o65: 0.075, med: 31.0 },
  { name: 'United Arab Emirates',   label: 'UAE',           iso: 'AE', pop: 11.0, tfr: 1.21, lifeExp: 83.1, u15: 0.145, o65: 0.012, med: 33.5 },
  { name: 'Kuwait',                 label: 'Kuwait',        iso: 'KW', pop: 4.9,  tfr: 1.51, lifeExp: 80.6, u15: 0.218, o65: 0.028, med: 34.5 },
  { name: 'Qatar',                  label: 'Qatar',         iso: 'QA', pop: 3.0,  tfr: 1.72, lifeExp: 82.5, u15: 0.130, o65: 0.015, med: 34.0 },
  { name: 'Oman',                   label: 'Oman',          iso: 'OM', pop: 5.3,  tfr: 2.51, lifeExp: 80.2, u15: 0.225, o65: 0.040, med: 30.5 },
  // ── EUROPE ─────────────────────────────────────────────────────────────────────────
  { name: 'Germany',                label: 'Germany',       iso: 'DE', pop: 84.6, tfr: 1.45, lifeExp: 81.5, u15: 0.138, o65: 0.226, med: 45.5 },
  { name: 'France',                 label: 'France',        iso: 'FR', pop: 66.5, tfr: 1.64, lifeExp: 83.5, u15: 0.170, o65: 0.218, med: 42.8 },
  { name: 'Italy',                  label: 'Italy',         iso: 'IT', pop: 59.3, tfr: 1.21, lifeExp: 83.9, u15: 0.122, o65: 0.243, med: 48.6 },
  { name: 'Spain',                  label: 'Spain',         iso: 'ES', pop: 47.9, tfr: 1.22, lifeExp: 83.8, u15: 0.128, o65: 0.210, med: 46.8 },
  { name: 'United Kingdom',         label: 'United Kingdom', iso: 'GB', pop: 69.1, tfr: 1.55, lifeExp: 81.4, u15: 0.174, o65: 0.194, med: 40.7 },
  { name: 'Russia',                 label: 'Russia',        iso: 'RU', pop: 144.8, tfr: 1.46, lifeExp: 73.3, u15: 0.172, o65: 0.168, med: 41.4 },
  { name: 'Ukraine',                label: 'Ukraine',       iso: 'UA', pop: 37.9, tfr: 0.99, lifeExp: 74.7, u15: 0.148, o65: 0.180, med: 42.0 },
  { name: 'Poland',                 label: 'Poland',        iso: 'PL', pop: 38.5, tfr: 1.30, lifeExp: 78.8, u15: 0.152, o65: 0.192, med: 42.0 },
  { name: 'Romania',                label: 'Romania',       iso: 'RO', pop: 19.0, tfr: 1.71, lifeExp: 76.1, u15: 0.155, o65: 0.198, med: 42.5 },
  { name: 'Netherlands',            label: 'Netherlands',   iso: 'NL', pop: 18.2, tfr: 1.43, lifeExp: 82.3, u15: 0.152, o65: 0.222, med: 43.0 },
  { name: 'Belgium',                label: 'Belgium',       iso: 'BE', pop: 11.7, tfr: 1.38, lifeExp: 82.3, u15: 0.162, o65: 0.202, med: 42.0 },
  { name: 'Czechia',                label: 'Czech Republic', iso: 'CZ', pop: 10.7, tfr: 1.46, lifeExp: 80.0, u15: 0.153, o65: 0.218, med: 43.5 },
  { name: 'Sweden',                 label: 'Sweden',        iso: 'SE', pop: 10.6, tfr: 1.43, lifeExp: 83.4, u15: 0.173, o65: 0.207, med: 41.5 },
  { name: 'Portugal',               label: 'Portugal',      iso: 'PT', pop: 10.4, tfr: 1.51, lifeExp: 82.6, u15: 0.126, o65: 0.242, med: 46.5 },
  { name: 'Greece',                 label: 'Greece',        iso: 'GR', pop: 10.0, tfr: 1.34, lifeExp: 82.0, u15: 0.131, o65: 0.228, med: 46.5 },
  { name: 'Hungary',                label: 'Hungary',       iso: 'HU', pop: 9.7,  tfr: 1.49, lifeExp: 77.2, u15: 0.143, o65: 0.208, med: 43.5 },
  { name: 'Austria',                label: 'Austria',       iso: 'AT', pop: 9.1,  tfr: 1.32, lifeExp: 82.1, u15: 0.143, o65: 0.208, med: 44.5 },
  { name: 'Switzerland',            label: 'Switzerland',   iso: 'CH', pop: 8.9,  tfr: 1.44, lifeExp: 84.1, u15: 0.143, o65: 0.198, med: 43.8 },
  { name: 'Belarus',                label: 'Belarus',       iso: 'BY', pop: 9.1,  tfr: 1.22, lifeExp: 74.6, u15: 0.162, o65: 0.168, med: 41.0 },
  { name: 'Norway',                 label: 'Norway',        iso: 'NO', pop: 5.6,  tfr: 1.41, lifeExp: 83.5, u15: 0.163, o65: 0.182, med: 40.5 },
  { name: 'Denmark',                label: 'Denmark',       iso: 'DK', pop: 6.0,  tfr: 1.52, lifeExp: 82.1, u15: 0.153, o65: 0.202, med: 42.5 },
  { name: 'Finland',                label: 'Finland',       iso: 'FI', pop: 5.6,  tfr: 1.29, lifeExp: 82.1, u15: 0.150, o65: 0.228, med: 44.0 },
  { name: 'Slovakia',               label: 'Slovakia',      iso: 'SK', pop: 5.5,  tfr: 1.56, lifeExp: 78.5, u15: 0.153, o65: 0.182, med: 41.5 },
  { name: 'Bulgaria',               label: 'Bulgaria',      iso: 'BG', pop: 6.8,  tfr: 1.75, lifeExp: 75.8, u15: 0.136, o65: 0.212, med: 44.5 },
  { name: 'Croatia',                label: 'Croatia',       iso: 'HR', pop: 3.9,  tfr: 1.47, lifeExp: 78.8, u15: 0.143, o65: 0.218, med: 44.5 },
  { name: 'Serbia',                 label: 'Serbia',        iso: 'RS', pop: 6.7,  tfr: 1.50, lifeExp: 76.9, u15: 0.140, o65: 0.202, med: 43.5 },
  { name: 'Ireland',                label: 'Ireland',       iso: 'IE', pop: 5.3,  tfr: 1.60, lifeExp: 82.6, u15: 0.203, o65: 0.148, med: 38.0 },
  { name: 'Lithuania',              label: 'Lithuania',     iso: 'LT', pop: 2.9,  tfr: 1.21, lifeExp: 76.2, u15: 0.148, o65: 0.218, med: 44.5 },
  { name: 'Latvia',                 label: 'Latvia',        iso: 'LV', pop: 1.9,  tfr: 1.34, lifeExp: 76.3, u15: 0.148, o65: 0.218, med: 44.5 },
  { name: 'Estonia',                label: 'Estonia',       iso: 'EE', pop: 1.4,  tfr: 1.36, lifeExp: 79.3, u15: 0.168, o65: 0.218, med: 43.5 },
  { name: 'Albania',                label: 'Albania',       iso: 'AL', pop: 2.8,  tfr: 1.34, lifeExp: 79.8, u15: 0.175, o65: 0.158, med: 37.5 },
  { name: 'Bosnia and Herz.',       label: 'Bosnia & Herz.', iso: 'BA', pop: 3.2, tfr: 1.49, lifeExp: 78.0, u15: 0.142, o65: 0.178, med: 43.0 },
  { name: 'Slovenia',               label: 'Slovenia',      iso: 'SI', pop: 2.1,  tfr: 1.58, lifeExp: 81.8, u15: 0.143, o65: 0.218, med: 45.0 },
  { name: 'Moldova',                label: 'Moldova',       iso: 'MD', pop: 3.0,  tfr: 1.73, lifeExp: 71.3, u15: 0.168, o65: 0.168, med: 39.0 },
  { name: 'Montenegro',             label: 'Montenegro',    iso: 'ME', pop: 0.64, tfr: 1.80, lifeExp: 77.3, u15: 0.173, o65: 0.162, med: 38.5 },
  { name: 'Macedonia',              label: 'N. Macedonia',  iso: 'MK', pop: 1.8,  tfr: 1.47, lifeExp: 77.5, u15: 0.160, o65: 0.158, med: 39.5 },
  { name: 'Kosovo',                 label: 'Kosovo',        iso: 'XK', pop: 1.7,  tfr: 1.54, lifeExp: 78.2, u15: 0.232, o65: 0.090, med: 31.5 },
  { name: 'Georgia',                label: 'Georgia',       iso: 'GE', pop: 3.8,  tfr: 1.80, lifeExp: 74.7, u15: 0.193, o65: 0.158, med: 37.5 },
  { name: 'Armenia',                label: 'Armenia',       iso: 'AM', pop: 3.0,  tfr: 1.72, lifeExp: 75.8, u15: 0.188, o65: 0.133, med: 37.0 },
  { name: 'Azerbaijan',             label: 'Azerbaijan',    iso: 'AZ', pop: 10.3, tfr: 1.67, lifeExp: 74.6, u15: 0.210, o65: 0.082, med: 33.0 },
  { name: 'Iceland',                label: 'Iceland',       iso: 'IS', pop: 0.39, tfr: 1.52, lifeExp: 83.0, u15: 0.188, o65: 0.158, med: 38.0 },
  // ── AFRICA ─────────────────────────────────────────────────────────────────────────
  { name: 'Nigeria',                label: 'Nigeria',       iso: 'NG', pop: 232.7, tfr: 4.38, lifeExp: 54.6, u15: 0.420, o65: 0.030, med: 17.5 },
  { name: 'Niger',                  label: 'Niger',         iso: 'NE', pop: 27.0, tfr: 5.94, lifeExp: 61.4, u15: 0.490, o65: 0.027, med: 14.8 },
  { name: 'Ethiopia',               label: 'Ethiopia',      iso: 'ET', pop: 132.1, tfr: 3.91, lifeExp: 67.6, u15: 0.408, o65: 0.032, med: 20.0 },
  { name: 'Egypt',                  label: 'Egypt',         iso: 'EG', pop: 116.5, tfr: 2.74, lifeExp: 71.8, u15: 0.322, o65: 0.057, med: 26.0 },
  { name: 'Tanzania',               label: 'Tanzania',      iso: 'TZ', pop: 68.6, tfr: 4.54, lifeExp: 67.2, u15: 0.435, o65: 0.031, med: 18.0 },
  { name: 'Kenya',                  label: 'Kenya',         iso: 'KE', pop: 56.4, tfr: 3.17, lifeExp: 63.8, u15: 0.370, o65: 0.032, med: 20.5 },
  { name: 'South Africa',           label: 'South Africa',  iso: 'ZA', pop: 64.0, tfr: 2.21, lifeExp: 66.3, u15: 0.270, o65: 0.057, med: 28.5 },
  { name: 'Algeria',                label: 'Algeria',       iso: 'DZ', pop: 46.8, tfr: 2.72, lifeExp: 76.5, u15: 0.295, o65: 0.072, med: 29.5 },
  { name: 'Sudan',                  label: 'Sudan',         iso: 'SD', pop: 50.4, tfr: 4.26, lifeExp: 66.5, u15: 0.405, o65: 0.036, med: 19.5 },
  { name: 'Morocco',                label: 'Morocco',       iso: 'MA', pop: 38.1, tfr: 2.21, lifeExp: 75.5, u15: 0.258, o65: 0.075, med: 31.0 },
  { name: 'Uganda',                 label: 'Uganda',        iso: 'UG', pop: 50.0, tfr: 4.16, lifeExp: 68.5, u15: 0.460, o65: 0.022, med: 17.5 },
  { name: 'Mozambique',             label: 'Mozambique',    iso: 'MZ', pop: 34.6, tfr: 4.69, lifeExp: 63.8, u15: 0.448, o65: 0.028, med: 17.5 },
  { name: 'Ghana',                  label: 'Ghana',         iso: 'GH', pop: 34.4, tfr: 3.34, lifeExp: 65.7, u15: 0.378, o65: 0.037, med: 22.0 },
  { name: "Côte d'Ivoire",          label: "Côte d'Ivoire", iso: 'CI', pop: 31.9, tfr: 4.23, lifeExp: 62.1, u15: 0.422, o65: 0.027, med: 18.5 },
  { name: 'Madagascar',             label: 'Madagascar',    iso: 'MG', pop: 32.0, tfr: 3.91, lifeExp: 63.8, u15: 0.422, o65: 0.029, med: 19.0 },
  { name: 'Cameroon',               label: 'Cameroon',      iso: 'CM', pop: 29.1, tfr: 4.26, lifeExp: 64.0, u15: 0.428, o65: 0.031, med: 18.5 },
  { name: 'Angola',                 label: 'Angola',        iso: 'AO', pop: 37.9, tfr: 5.05, lifeExp: 64.8, u15: 0.462, o65: 0.026, med: 17.0 },
  { name: 'Zimbabwe',               label: 'Zimbabwe',      iso: 'ZW', pop: 16.6, tfr: 3.67, lifeExp: 63.1, u15: 0.395, o65: 0.042, med: 21.0 },
  { name: 'Zambia',                 label: 'Zambia',        iso: 'ZM', pop: 21.3, tfr: 4.04, lifeExp: 66.5, u15: 0.452, o65: 0.026, med: 17.5 },
  { name: 'Mali',                   label: 'Mali',          iso: 'ML', pop: 24.5, tfr: 5.51, lifeExp: 60.7, u15: 0.475, o65: 0.026, med: 16.5 },
  { name: 'Burkina Faso',           label: 'Burkina Faso',  iso: 'BF', pop: 23.5, tfr: 4.11, lifeExp: 61.3, u15: 0.448, o65: 0.027, med: 18.0 },
  { name: 'Senegal',                label: 'Senegal',       iso: 'SN', pop: 18.5, tfr: 3.77, lifeExp: 68.9, u15: 0.422, o65: 0.031, med: 19.5 },
  { name: 'Chad',                   label: 'Chad',          iso: 'TD', pop: 20.3, tfr: 6.03, lifeExp: 55.2, u15: 0.485, o65: 0.022, med: 16.5 },
  { name: 'Somalia',                label: 'Somalia',       iso: 'SO', pop: 19.0, tfr: 6.01, lifeExp: 59.0, u15: 0.478, o65: 0.025, med: 17.0 },
  { name: 'Guinea',                 label: 'Guinea',        iso: 'GN', pop: 14.8, tfr: 4.13, lifeExp: 60.9, u15: 0.435, o65: 0.026, med: 18.5 },
  { name: 'Rwanda',                 label: 'Rwanda',        iso: 'RW', pop: 14.3, tfr: 3.64, lifeExp: 68.0, u15: 0.372, o65: 0.030, med: 22.0 },
  { name: 'Benin',                  label: 'Benin',         iso: 'BJ', pop: 14.5, tfr: 4.48, lifeExp: 61.0, u15: 0.445, o65: 0.026, med: 18.0 },
  { name: 'S. Sudan',               label: 'South Sudan',   iso: 'SS', pop: 11.9, tfr: 3.79, lifeExp: 57.7, u15: 0.430, o65: 0.026, med: 18.5 },
  { name: 'Burundi',                label: 'Burundi',       iso: 'BI', pop: 14.0, tfr: 4.79, lifeExp: 63.8, u15: 0.455, o65: 0.026, med: 17.5 },
  { name: 'Togo',                   label: 'Togo',          iso: 'TG', pop: 9.5,  tfr: 4.12, lifeExp: 62.9, u15: 0.422, o65: 0.030, med: 20.0 },
  { name: 'Sierra Leone',           label: 'Sierra Leone',  iso: 'SL', pop: 8.6,  tfr: 3.70, lifeExp: 62.0, u15: 0.418, o65: 0.031, med: 20.0 },
  { name: 'Malawi',                 label: 'Malawi',        iso: 'MW', pop: 21.7, tfr: 3.59, lifeExp: 67.6, u15: 0.428, o65: 0.028, med: 18.5 },
  { name: 'Eritrea',                label: 'Eritrea',       iso: 'ER', pop: 3.5,  tfr: 3.68, lifeExp: 68.9, u15: 0.385, o65: 0.031, med: 21.0 },
  { name: 'Namibia',                label: 'Namibia',       iso: 'NA', pop: 3.0,  tfr: 3.21, lifeExp: 67.5, u15: 0.352, o65: 0.040, med: 22.5 },
  { name: 'Botswana',               label: 'Botswana',      iso: 'BW', pop: 2.5,  tfr: 2.70, lifeExp: 69.3, u15: 0.320, o65: 0.045, med: 24.5 },
  { name: 'Gabon',                  label: 'Gabon',         iso: 'GA', pop: 2.5,  tfr: 3.59, lifeExp: 68.5, u15: 0.365, o65: 0.043, med: 22.5 },
  { name: 'Lesotho',                label: 'Lesotho',       iso: 'LS', pop: 2.3,  tfr: 2.66, lifeExp: 57.8, u15: 0.340, o65: 0.058, med: 23.0 },
  { name: 'Liberia',                label: 'Liberia',       iso: 'LR', pop: 5.6,  tfr: 3.86, lifeExp: 62.3, u15: 0.415, o65: 0.035, med: 19.5 },
  { name: 'Central African Rep.',   label: 'Centr. Afr. Rep.', iso: 'CF', pop: 5.3, tfr: 5.95, lifeExp: 57.7, u15: 0.448, o65: 0.028, med: 17.5 },
  { name: 'Dem. Rep. Congo',        label: 'DR Congo',      iso: 'CD', pop: 109.3, tfr: 5.98, lifeExp: 62.1, u15: 0.468, o65: 0.026, med: 16.5 },
  { name: 'Congo',                  label: 'Congo',         iso: 'CG', pop: 6.3,  tfr: 4.11, lifeExp: 66.0, u15: 0.428, o65: 0.029, med: 19.0 },
  { name: 'Libya',                  label: 'Libya',         iso: 'LY', pop: 7.4,  tfr: 2.30, lifeExp: 71.1, u15: 0.282, o65: 0.055, med: 29.0 },
  { name: 'Tunisia',                label: 'Tunisia',       iso: 'TN', pop: 12.3, tfr: 1.82, lifeExp: 76.7, u15: 0.232, o65: 0.095, med: 34.0 },
  { name: 'Mauritania',             label: 'Mauritania',    iso: 'MR', pop: 5.2,  tfr: 4.63, lifeExp: 68.7, u15: 0.432, o65: 0.031, med: 19.5 },
  { name: 'Guinea-Bissau',          label: 'Guinea-Bissau', iso: 'GW', pop: 2.2,  tfr: 3.76, lifeExp: 64.3, u15: 0.428, o65: 0.031, med: 19.0 },
  { name: 'Eq. Guinea',             label: 'Eq. Guinea',    iso: 'GQ', pop: 1.9,  tfr: 4.12, lifeExp: 63.9, u15: 0.415, o65: 0.031, med: 20.0 },
  { name: 'Djibouti',               label: 'Djibouti',      iso: 'DJ', pop: 1.2,  tfr: 2.62, lifeExp: 66.2, u15: 0.298, o65: 0.040, med: 25.5 },
  { name: 'eSwatini',               label: 'Eswatini',      iso: 'SZ', pop: 1.2,  tfr: 2.72, lifeExp: 64.3, u15: 0.340, o65: 0.040, med: 23.0 },
  { name: 'W. Sahara',              label: 'W. Sahara',     iso: 'EH', pop: 0.59, tfr: 2.18, lifeExp: 71.6, u15: 0.282, o65: 0.052, med: 28.5 },
  // ── AMERICAS ───────────────────────────────────────────────────────────────────────
  { name: 'United States of America', label: 'United States', iso: 'US', pop: 345.4, tfr: 1.62, lifeExp: 79.5, u15: 0.175, o65: 0.178, med: 38.8 },
  { name: 'Brazil',                 label: 'Brazil',        iso: 'BR', pop: 212.0, tfr: 1.61, lifeExp: 76.0, u15: 0.196, o65: 0.105, med: 35.5 },
  { name: 'Mexico',                 label: 'Mexico',        iso: 'MX', pop: 130.9, tfr: 1.89, lifeExp: 75.3, u15: 0.238, o65: 0.086, med: 29.8 },
  { name: 'Canada',                 label: 'Canada',        iso: 'CA', pop: 39.7, tfr: 1.34, lifeExp: 82.7, u15: 0.155, o65: 0.192, med: 42.0 },
  { name: 'Colombia',               label: 'Colombia',      iso: 'CO', pop: 52.9, tfr: 1.63, lifeExp: 77.9, u15: 0.220, o65: 0.098, med: 32.0 },
  { name: 'Argentina',              label: 'Argentina',     iso: 'AR', pop: 45.7, tfr: 1.50, lifeExp: 77.5, u15: 0.228, o65: 0.122, med: 33.0 },
  { name: 'Peru',                   label: 'Peru',          iso: 'PE', pop: 34.2, tfr: 1.96, lifeExp: 77.9, u15: 0.260, o65: 0.088, med: 30.5 },
  { name: 'Venezuela',              label: 'Venezuela',     iso: 'VE', pop: 28.4, tfr: 2.08, lifeExp: 72.7, u15: 0.248, o65: 0.090, med: 30.0 },
  { name: 'Chile',                  label: 'Chile',         iso: 'CL', pop: 19.8, tfr: 1.14, lifeExp: 81.4, u15: 0.188, o65: 0.125, med: 37.0 },
  { name: 'Ecuador',                label: 'Ecuador',       iso: 'EC', pop: 18.1, tfr: 1.81, lifeExp: 77.6, u15: 0.262, o65: 0.080, med: 29.0 },
  { name: 'Bolivia',                label: 'Bolivia',       iso: 'BO', pop: 12.4, tfr: 2.52, lifeExp: 68.7, u15: 0.292, o65: 0.075, med: 26.0 },
  { name: 'Paraguay',               label: 'Paraguay',      iso: 'PY', pop: 6.9,  tfr: 2.42, lifeExp: 74.0, u15: 0.288, o65: 0.074, med: 27.5 },
  { name: 'Uruguay',                label: 'Uruguay',       iso: 'UY', pop: 3.4,  tfr: 1.40, lifeExp: 78.3, u15: 0.192, o65: 0.168, med: 37.0 },
  { name: 'Guatemala',              label: 'Guatemala',     iso: 'GT', pop: 18.4, tfr: 2.29, lifeExp: 72.7, u15: 0.318, o65: 0.057, med: 24.0 },
  { name: 'Honduras',               label: 'Honduras',      iso: 'HN', pop: 10.8, tfr: 2.48, lifeExp: 73.0, u15: 0.288, o65: 0.056, med: 26.0 },
  { name: 'El Salvador',            label: 'El Salvador',   iso: 'SV', pop: 6.3,  tfr: 1.77, lifeExp: 72.3, u15: 0.265, o65: 0.082, med: 28.0 },
  { name: 'Nicaragua',              label: 'Nicaragua',     iso: 'NI', pop: 6.9,  tfr: 2.21, lifeExp: 75.1, u15: 0.278, o65: 0.064, med: 27.0 },
  { name: 'Costa Rica',             label: 'Costa Rica',    iso: 'CR', pop: 5.1,  tfr: 1.32, lifeExp: 81.0, u15: 0.192, o65: 0.118, med: 34.5 },
  { name: 'Panama',                 label: 'Panama',        iso: 'PA', pop: 4.5,  tfr: 2.11, lifeExp: 79.8, u15: 0.248, o65: 0.092, med: 30.0 },
  { name: 'Cuba',                   label: 'Cuba',          iso: 'CU', pop: 11.0, tfr: 1.45, lifeExp: 78.3, u15: 0.150, o65: 0.190, med: 43.0 },
  { name: 'Dominican Rep.',         label: 'Dominican Rep.', iso: 'DO', pop: 11.4, tfr: 2.22, lifeExp: 73.9, u15: 0.258, o65: 0.085, med: 28.0 },
  { name: 'Haiti',                  label: 'Haiti',         iso: 'HT', pop: 11.8, tfr: 2.63, lifeExp: 65.1, u15: 0.322, o65: 0.057, med: 24.0 },
  { name: 'Guyana',                 label: 'Guyana',        iso: 'GY', pop: 0.83, tfr: 2.39, lifeExp: 70.3, u15: 0.265, o65: 0.067, med: 28.0 },
  { name: 'Suriname',               label: 'Suriname',      iso: 'SR', pop: 0.63, tfr: 2.23, lifeExp: 73.8, u15: 0.258, o65: 0.065, med: 30.0 },
  { name: 'Belize',                 label: 'Belize',        iso: 'BZ', pop: 0.42, tfr: 2.02, lifeExp: 73.7, u15: 0.278, o65: 0.057, med: 24.5 },
  { name: 'Jamaica',                label: 'Jamaica',       iso: 'JM', pop: 2.8,  tfr: 1.35, lifeExp: 71.6, u15: 0.208, o65: 0.112, med: 32.0 },
  { name: 'Trinidad and Tobago',    label: 'Trinidad & Tobago', iso: 'TT', pop: 1.5, tfr: 1.54, lifeExp: 73.6, u15: 0.182, o65: 0.122, med: 37.0 },
  // ── OCEANIA ────────────────────────────────────────────────────────────────────────
  { name: 'Australia',              label: 'Australia',     iso: 'AU', pop: 26.7, tfr: 1.64, lifeExp: 84.1, u15: 0.182, o65: 0.174, med: 38.2 },
  { name: 'New Zealand',            label: 'New Zealand',   iso: 'NZ', pop: 5.2,  tfr: 1.66, lifeExp: 82.2, u15: 0.188, o65: 0.168, med: 38.5 },
  { name: 'Solomon Is.',            label: 'Solomon Islands', iso: 'SB', pop: 0.82, tfr: 3.51, lifeExp: 70.7, u15: 0.382, o65: 0.032, med: 22.5 },
  { name: 'Vanuatu',                label: 'Vanuatu',       iso: 'VU', pop: 0.33, tfr: 3.57, lifeExp: 71.7, u15: 0.375, o65: 0.036, med: 23.0 },
  { name: 'Fiji',                   label: 'Fiji',          iso: 'FJ', pop: 0.93, tfr: 2.27, lifeExp: 67.5, u15: 0.282, o65: 0.062, med: 29.0 },
];

const COUNTRY_BY_NAME = Object.fromEntries(COUNTRIES.map(c => [c.name, c]));

const MAX_AGE = 100;

const FEMALE_FRAC = 0.487;

const ASFR = (() => {
  const w = new Float64Array(MAX_AGE + 1);
  let sum = 0;
  for (let a = 15; a <= 49; a++) {
    const v = Math.exp(-((a - 28) * (a - 28)) / (2 * 7 * 7));
    w[a] = v; sum += v;
  }
  for (let a = 15; a <= 49; a++) w[a] /= sum;
  return w;
})();

function baseMortality(age) {
  if (age < 1)  return 0.0045;
  if (age < 5)  return 0.0006;
  if (age < 15) return 0.00025;
  if (age < 40) return 0.0009;
  return Math.min(0.6, 0.0009 * Math.exp((age - 40) * 0.0915));
}

function _medianOfShares(dist) {
  let total = 0; for (let a = 0; a <= MAX_AGE; a++) total += dist[a];
  let cum = 0;
  for (let a = 0; a <= MAX_AGE; a++) { cum += dist[a]; if (cum >= total / 2) return a; }
  return MAX_AGE;
}

function _buildShares(c, k) {
  const dist = new Float64Array(MAX_AGE + 1);
  const fChild = c.u15;
  const fSenior = c.o65;
  const fWork = Math.max(0.05, 1 - fChild - fSenior);

  const childSlope = Math.max(-0.45, Math.min(0.55, (c.tfr - 2.1) * 0.18));
  let sChild = 0;
  for (let a = 0; a <= 14; a++) {
    const w = 1 + childSlope * (7 - a) / 7;
    dist[a] = Math.max(0.02, w); sChild += dist[a];
  }
  for (let a = 0; a <= 14; a++) dist[a] = dist[a] / sChild * fChild;

  let sWork = 0;
  for (let a = 15; a <= 64; a++) {
    const w = Math.exp(k * (a - 40) / 25) * (1 + 0.08 * Math.cos((a - 15) / 49 * Math.PI * 2));
    dist[a] = Math.max(0.02, w); sWork += dist[a];
  }
  for (let a = 15; a <= 64; a++) dist[a] = dist[a] / sWork * fWork;

  let sSen = 0;
  for (let a = 65; a <= MAX_AGE; a++) { const w = Math.exp(-(a - 65) / 8.5); dist[a] = w; sSen += w; }
  for (let a = 65; a <= MAX_AGE; a++) dist[a] = dist[a] / sSen * fSenior;
  return dist;
}

function buildInitialAges(c) {
  let lo = -3, hi = 3, dist = _buildShares(c, 0);
  for (let it = 0; it < 22; it++) {
    const k = (lo + hi) / 2;
    dist = _buildShares(c, k);
    const m = _medianOfShares(dist);
    if (m < c.med) lo = k; else hi = k;
  }
  for (let a = 0; a <= MAX_AGE; a++) dist[a] *= c.pop;
  return dist;
}
