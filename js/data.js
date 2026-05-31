/* ============================================================================
   data.js — Country dataset + age-structure construction
   Figures are approximate, drawn from UN World Population Prospects 2024 /
   World Bank ranges (2023-2024). Intended to be illustrative-but-grounded.
   ============================================================================ */

// Display age brackets used for coloring the little people.
const BRACKETS = [
  { key: 'child',  label: '0–14',  lo: 0,  hi: 14,  color: '#14B8A6' },
  { key: 'young',  label: '15–39', lo: 15, hi: 39,  color: '#0EA5E9' },
  { key: 'adult',  label: '40–64', lo: 40, hi: 64,  color: '#6366F1' },
  { key: 'senior', label: '65+',   lo: 65, hi: 100, color: '#64748B' },
];

const REPLACEMENT_TFR = 2.1;
const PERSONS_PER_FIGURE = 1; // millions per little person

// name MUST match world-atlas country `name` property (Natural Earth convention).
// pop=millions(2024) tfr=fertility u15/o65=age-share lifeExp/med=years
const COUNTRIES = [
  // ── EAST ASIA ──────────────────────────────────────────────────────────────
  { name: 'South Korea',              label: 'South Korea',     iso: 'KR', pop: 51.7,   tfr: 0.72, lifeExp: 83.5, u15: 0.115, o65: 0.184, med: 45.5 },
  { name: 'Japan',                    label: 'Japan',           iso: 'JP', pop: 123.8,  tfr: 1.20, lifeExp: 84.0, u15: 0.113, o65: 0.298, med: 49.5 },
  { name: 'China',                    label: 'China',           iso: 'CN', pop: 1410,   tfr: 1.00, lifeExp: 78.6, u15: 0.168, o65: 0.143, med: 39.8 },
  { name: 'North Korea',              label: 'North Korea',     iso: 'KP', pop: 26.1,   tfr: 1.91, lifeExp: 73.0, u15: 0.196, o65: 0.112, med: 36.0 },
  { name: 'Mongolia',                 label: 'Mongolia',        iso: 'MN', pop: 3.4,    tfr: 2.72, lifeExp: 72.0, u15: 0.280, o65: 0.048, med: 29.0 },
  { name: 'Taiwan',                   label: 'Taiwan',          iso: 'TW', pop: 23.4,   tfr: 0.87, lifeExp: 80.6, u15: 0.120, o65: 0.195, med: 43.0 },
  // ── SOUTHEAST ASIA ─────────────────────────────────────────────────────────
  { name: 'Indonesia',                label: 'Indonesia',       iso: 'ID', pop: 281,    tfr: 2.10, lifeExp: 71.3, u15: 0.250, o65: 0.070, med: 30.2 },
  { name: 'Vietnam',                  label: 'Vietnam',         iso: 'VN', pop: 98.9,   tfr: 1.96, lifeExp: 74.5, u15: 0.235, o65: 0.079, med: 32.0 },
  { name: 'Philippines',              label: 'Philippines',     iso: 'PH', pop: 117.3,  tfr: 2.78, lifeExp: 70.8, u15: 0.305, o65: 0.055, med: 24.5 },
  { name: 'Thailand',                 label: 'Thailand',        iso: 'TH', pop: 71.8,   tfr: 1.33, lifeExp: 77.5, u15: 0.160, o65: 0.140, med: 40.5 },
  { name: 'Myanmar',                  label: 'Myanmar',         iso: 'MM', pop: 54.6,   tfr: 2.09, lifeExp: 67.0, u15: 0.254, o65: 0.059, med: 29.5 },
  { name: 'Malaysia',                 label: 'Malaysia',        iso: 'MY', pop: 33.6,   tfr: 1.78, lifeExp: 76.5, u15: 0.242, o65: 0.075, med: 30.5 },
  { name: 'Cambodia',                 label: 'Cambodia',        iso: 'KH', pop: 17.4,   tfr: 2.48, lifeExp: 71.0, u15: 0.286, o65: 0.049, med: 26.5 },
  { name: 'Laos',                     label: 'Laos',            iso: 'LA', pop: 7.5,    tfr: 2.70, lifeExp: 68.5, u15: 0.310, o65: 0.043, med: 24.0 },
  { name: 'Papua New Guinea',         label: 'Papua New Guinea',iso: 'PG', pop: 10.3,   tfr: 3.84, lifeExp: 63.8, u15: 0.370, o65: 0.034, med: 21.5 },
  { name: 'Timor-Leste',              label: 'Timor-Leste',     iso: 'TL', pop: 1.4,    tfr: 3.93, lifeExp: 69.5, u15: 0.390, o65: 0.035, med: 20.5 },
  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────
  { name: 'India',                    label: 'India',           iso: 'IN', pop: 1441,   tfr: 2.00, lifeExp: 70.0, u15: 0.249, o65: 0.071, med: 28.4 },
  { name: 'Pakistan',                 label: 'Pakistan',        iso: 'PK', pop: 245.2,  tfr: 3.35, lifeExp: 68.0, u15: 0.345, o65: 0.044, med: 21.5 },
  { name: 'Bangladesh',               label: 'Bangladesh',      iso: 'BD', pop: 174.7,  tfr: 2.07, lifeExp: 73.0, u15: 0.268, o65: 0.059, med: 28.5 },
  { name: 'Afghanistan',              label: 'Afghanistan',     iso: 'AF', pop: 43.0,   tfr: 4.55, lifeExp: 63.5, u15: 0.420, o65: 0.030, med: 18.5 },
  { name: 'Nepal',                    label: 'Nepal',           iso: 'NP', pop: 30.9,   tfr: 1.92, lifeExp: 72.0, u15: 0.270, o65: 0.066, med: 26.5 },
  { name: 'Sri Lanka',                label: 'Sri Lanka',       iso: 'LK', pop: 22.2,   tfr: 1.96, lifeExp: 77.5, u15: 0.213, o65: 0.126, med: 34.5 },
  // ── CENTRAL ASIA ───────────────────────────────────────────────────────────
  { name: 'Kazakhstan',               label: 'Kazakhstan',      iso: 'KZ', pop: 20.0,   tfr: 2.70, lifeExp: 73.5, u15: 0.280, o65: 0.076, med: 31.0 },
  { name: 'Uzbekistan',               label: 'Uzbekistan',      iso: 'UZ', pop: 37.7,   tfr: 2.90, lifeExp: 72.0, u15: 0.282, o65: 0.053, med: 29.0 },
  { name: 'Turkmenistan',             label: 'Turkmenistan',    iso: 'TM', pop: 6.3,    tfr: 2.58, lifeExp: 69.5, u15: 0.290, o65: 0.050, med: 28.5 },
  { name: 'Kyrgyzstan',               label: 'Kyrgyzstan',      iso: 'KG', pop: 7.1,    tfr: 2.82, lifeExp: 72.0, u15: 0.305, o65: 0.043, med: 26.5 },
  { name: 'Tajikistan',               label: 'Tajikistan',      iso: 'TJ', pop: 10.6,   tfr: 3.42, lifeExp: 72.0, u15: 0.360, o65: 0.033, med: 21.5 },
  // ── MIDDLE EAST ────────────────────────────────────────────────────────────
  { name: 'Iran',                     label: 'Iran',            iso: 'IR', pop: 89,     tfr: 1.70, lifeExp: 74.0, u15: 0.240, o65: 0.070, med: 33.0 },
  { name: 'Turkey',                   label: 'Türkiye',         iso: 'TR', pop: 85.3,   tfr: 1.62, lifeExp: 78.0, u15: 0.220, o65: 0.096, med: 33.5 },
  { name: 'Saudi Arabia',             label: 'Saudi Arabia',    iso: 'SA', pop: 36.5,   tfr: 2.27, lifeExp: 77.5, u15: 0.252, o65: 0.039, med: 29.5 },
  { name: 'Iraq',                     label: 'Iraq',            iso: 'IQ', pop: 43.5,   tfr: 3.55, lifeExp: 71.5, u15: 0.382, o65: 0.034, med: 20.5 },
  { name: 'Syria',                    label: 'Syria',           iso: 'SY', pop: 21.3,   tfr: 2.82, lifeExp: 71.5, u15: 0.340, o65: 0.038, med: 22.5 },
  { name: 'Yemen',                    label: 'Yemen',           iso: 'YE', pop: 34.4,   tfr: 3.72, lifeExp: 66.5, u15: 0.390, o65: 0.030, med: 20.0 },
  { name: 'Jordan',                   label: 'Jordan',          iso: 'JO', pop: 10.5,   tfr: 2.52, lifeExp: 75.0, u15: 0.325, o65: 0.040, med: 23.5 },
  { name: 'Israel',                   label: 'Israel',          iso: 'IL', pop: 9.4,    tfr: 2.89, lifeExp: 83.0, u15: 0.272, o65: 0.123, med: 30.0 },
  { name: 'Lebanon',                  label: 'Lebanon',         iso: 'LB', pop: 5.4,    tfr: 1.66, lifeExp: 75.5, u15: 0.238, o65: 0.072, med: 31.5 },
  { name: 'United Arab Emirates',     label: 'UAE',             iso: 'AE', pop: 9.9,    tfr: 1.40, lifeExp: 79.5, u15: 0.148, o65: 0.010, med: 33.0 },
  { name: 'Kuwait',                   label: 'Kuwait',          iso: 'KW', pop: 4.9,    tfr: 2.04, lifeExp: 78.5, u15: 0.225, o65: 0.025, med: 34.0 },
  { name: 'Qatar',                    label: 'Qatar',           iso: 'QA', pop: 2.9,    tfr: 1.83, lifeExp: 80.5, u15: 0.132, o65: 0.014, med: 33.5 },
  { name: 'Oman',                     label: 'Oman',            iso: 'OM', pop: 4.9,    tfr: 2.47, lifeExp: 78.5, u15: 0.225, o65: 0.040, med: 30.5 },
  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { name: 'Germany',                  label: 'Germany',         iso: 'DE', pop: 84.5,   tfr: 1.46, lifeExp: 81.4, u15: 0.140, o65: 0.224, med: 45.2 },
  { name: 'France',                   label: 'France',          iso: 'FR', pop: 66.5,   tfr: 1.79, lifeExp: 82.5, u15: 0.172, o65: 0.215, med: 42.6 },
  { name: 'Italy',                    label: 'Italy',           iso: 'IT', pop: 58.9,   tfr: 1.24, lifeExp: 83.7, u15: 0.124, o65: 0.241, med: 48.4 },
  { name: 'Spain',                    label: 'Spain',           iso: 'ES', pop: 47.9,   tfr: 1.19, lifeExp: 83.9, u15: 0.130, o65: 0.207, med: 46.8 },
  { name: 'United Kingdom',           label: 'United Kingdom',  iso: 'GB', pop: 68.3,   tfr: 1.56, lifeExp: 81.3, u15: 0.176, o65: 0.192, med: 40.5 },
  { name: 'Russia',                   label: 'Russia',          iso: 'RU', pop: 144,    tfr: 1.42, lifeExp: 73.0, u15: 0.174, o65: 0.165, med: 39.6 },
  { name: 'Ukraine',                  label: 'Ukraine',         iso: 'UA', pop: 43.8,   tfr: 1.22, lifeExp: 73.5, u15: 0.155, o65: 0.175, med: 40.5 },
  { name: 'Poland',                   label: 'Poland',          iso: 'PL', pop: 38.0,   tfr: 1.32, lifeExp: 77.5, u15: 0.155, o65: 0.190, med: 41.5 },
  { name: 'Romania',                  label: 'Romania',         iso: 'RO', pop: 19.3,   tfr: 1.69, lifeExp: 76.0, u15: 0.155, o65: 0.195, med: 42.5 },
  { name: 'Netherlands',              label: 'Netherlands',     iso: 'NL', pop: 17.8,   tfr: 1.49, lifeExp: 82.5, u15: 0.155, o65: 0.220, med: 42.5 },
  { name: 'Belgium',                  label: 'Belgium',         iso: 'BE', pop: 11.7,   tfr: 1.46, lifeExp: 82.0, u15: 0.165, o65: 0.200, med: 41.5 },
  { name: 'Czechia',                  label: 'Czech Republic',  iso: 'CZ', pop: 10.9,   tfr: 1.63, lifeExp: 79.5, u15: 0.155, o65: 0.215, med: 43.0 },
  { name: 'Sweden',                   label: 'Sweden',          iso: 'SE', pop: 10.5,   tfr: 1.66, lifeExp: 83.5, u15: 0.175, o65: 0.205, med: 41.0 },
  { name: 'Portugal',                 label: 'Portugal',        iso: 'PT', pop: 10.2,   tfr: 1.37, lifeExp: 82.0, u15: 0.128, o65: 0.240, med: 46.0 },
  { name: 'Greece',                   label: 'Greece',          iso: 'GR', pop: 10.7,   tfr: 1.38, lifeExp: 82.0, u15: 0.133, o65: 0.225, med: 46.5 },
  { name: 'Hungary',                  label: 'Hungary',         iso: 'HU', pop: 9.7,    tfr: 1.57, lifeExp: 77.0, u15: 0.145, o65: 0.205, med: 43.5 },
  { name: 'Austria',                  label: 'Austria',         iso: 'AT', pop: 9.1,    tfr: 1.53, lifeExp: 82.0, u15: 0.145, o65: 0.205, med: 44.0 },
  { name: 'Switzerland',              label: 'Switzerland',     iso: 'CH', pop: 8.8,    tfr: 1.52, lifeExp: 84.0, u15: 0.145, o65: 0.195, med: 43.5 },
  { name: 'Belarus',                  label: 'Belarus',         iso: 'BY', pop: 9.4,    tfr: 1.38, lifeExp: 74.5, u15: 0.165, o65: 0.165, med: 40.5 },
  { name: 'Norway',                   label: 'Norway',          iso: 'NO', pop: 5.5,    tfr: 1.40, lifeExp: 83.5, u15: 0.165, o65: 0.180, med: 40.0 },
  { name: 'Denmark',                  label: 'Denmark',         iso: 'DK', pop: 6.0,    tfr: 1.72, lifeExp: 82.5, u15: 0.155, o65: 0.200, med: 42.0 },
  { name: 'Finland',                  label: 'Finland',         iso: 'FI', pop: 5.6,    tfr: 1.32, lifeExp: 82.0, u15: 0.152, o65: 0.225, med: 43.5 },
  { name: 'Slovakia',                 label: 'Slovakia',        iso: 'SK', pop: 5.5,    tfr: 1.61, lifeExp: 77.5, u15: 0.155, o65: 0.180, med: 41.5 },
  { name: 'Bulgaria',                 label: 'Bulgaria',        iso: 'BG', pop: 6.5,    tfr: 1.67, lifeExp: 75.0, u15: 0.138, o65: 0.210, med: 44.5 },
  { name: 'Croatia',                  label: 'Croatia',         iso: 'HR', pop: 3.9,    tfr: 1.50, lifeExp: 79.5, u15: 0.145, o65: 0.215, med: 44.0 },
  { name: 'Serbia',                   label: 'Serbia',          iso: 'RS', pop: 6.8,    tfr: 1.58, lifeExp: 77.0, u15: 0.142, o65: 0.200, med: 43.5 },
  { name: 'Ireland',                  label: 'Ireland',         iso: 'IE', pop: 5.3,    tfr: 1.71, lifeExp: 83.0, u15: 0.205, o65: 0.145, med: 37.5 },
  { name: 'Lithuania',                label: 'Lithuania',       iso: 'LT', pop: 2.8,    tfr: 1.47, lifeExp: 77.5, u15: 0.152, o65: 0.215, med: 44.5 },
  { name: 'Latvia',                   label: 'Latvia',          iso: 'LV', pop: 1.8,    tfr: 1.54, lifeExp: 76.0, u15: 0.152, o65: 0.215, med: 44.0 },
  { name: 'Estonia',                  label: 'Estonia',         iso: 'EE', pop: 1.4,    tfr: 1.59, lifeExp: 78.5, u15: 0.170, o65: 0.215, med: 43.5 },
  { name: 'Albania',                  label: 'Albania',         iso: 'AL', pop: 2.8,    tfr: 1.50, lifeExp: 80.0, u15: 0.178, o65: 0.155, med: 36.5 },
  { name: 'Bosnia and Herz.',         label: 'Bosnia & Herz.',  iso: 'BA', pop: 3.2,    tfr: 1.32, lifeExp: 77.5, u15: 0.145, o65: 0.175, med: 43.0 },
  { name: 'Slovenia',                 label: 'Slovenia',        iso: 'SI', pop: 2.1,    tfr: 1.60, lifeExp: 82.0, u15: 0.145, o65: 0.215, med: 45.0 },
  { name: 'Moldova',                  label: 'Moldova',         iso: 'MD', pop: 2.6,    tfr: 1.66, lifeExp: 72.5, u15: 0.170, o65: 0.165, med: 38.5 },
  { name: 'Montenegro',               label: 'Montenegro',      iso: 'ME', pop: 0.62,   tfr: 1.73, lifeExp: 77.5, u15: 0.175, o65: 0.160, med: 38.5 },
  { name: 'Macedonia',                label: 'N. Macedonia',    iso: 'MK', pop: 2.1,    tfr: 1.36, lifeExp: 77.5, u15: 0.162, o65: 0.155, med: 38.5 },
  { name: 'Kosovo',                   label: 'Kosovo',          iso: 'XK', pop: 1.8,    tfr: 2.50, lifeExp: 75.0, u15: 0.245, o65: 0.085, med: 29.5 },
  { name: 'Georgia',                  label: 'Georgia',         iso: 'GE', pop: 3.7,    tfr: 1.97, lifeExp: 75.5, u15: 0.195, o65: 0.155, med: 37.5 },
  { name: 'Armenia',                  label: 'Armenia',         iso: 'AM', pop: 3.0,    tfr: 1.59, lifeExp: 78.0, u15: 0.190, o65: 0.130, med: 36.5 },
  { name: 'Azerbaijan',               label: 'Azerbaijan',      iso: 'AZ', pop: 10.2,   tfr: 1.97, lifeExp: 75.5, u15: 0.215, o65: 0.080, med: 32.5 },
  { name: 'Iceland',                  label: 'Iceland',         iso: 'IS', pop: 0.38,   tfr: 1.59, lifeExp: 84.0, u15: 0.190, o65: 0.155, med: 37.5 },
  // ── AFRICA ─────────────────────────────────────────────────────────────────
  { name: 'Nigeria',                  label: 'Nigeria',         iso: 'NG', pop: 229,    tfr: 5.10, lifeExp: 54.0, u15: 0.425, o65: 0.029, med: 17.3 },
  { name: 'Niger',                    label: 'Niger',           iso: 'NE', pop: 27.2,   tfr: 6.70, lifeExp: 61.0, u15: 0.495, o65: 0.026, med: 14.5 },
  { name: 'Ethiopia',                 label: 'Ethiopia',        iso: 'ET', pop: 129.7,  tfr: 4.10, lifeExp: 67.0, u15: 0.415, o65: 0.031, med: 19.5 },
  { name: 'Egypt',                    label: 'Egypt',           iso: 'EG', pop: 107.7,  tfr: 2.83, lifeExp: 73.5, u15: 0.330, o65: 0.055, med: 25.5 },
  { name: 'Tanzania',                  label: 'Tanzania',        iso: 'TZ', pop: 67.4,   tfr: 4.80, lifeExp: 67.0, u15: 0.440, o65: 0.030, med: 18.0 },
  { name: 'Kenya',                    label: 'Kenya',           iso: 'KE', pop: 56.4,   tfr: 3.37, lifeExp: 67.5, u15: 0.380, o65: 0.030, med: 20.0 },
  { name: 'South Africa',             label: 'South Africa',    iso: 'ZA', pop: 63.0,   tfr: 2.34, lifeExp: 64.5, u15: 0.278, o65: 0.055, med: 28.5 },
  { name: 'Algeria',                  label: 'Algeria',         iso: 'DZ', pop: 46.2,   tfr: 3.02, lifeExp: 77.0, u15: 0.300, o65: 0.070, med: 29.0 },
  { name: 'Sudan',                    label: 'Sudan',           iso: 'SD', pop: 47.6,   tfr: 4.25, lifeExp: 67.5, u15: 0.410, o65: 0.035, med: 19.5 },
  { name: 'Morocco',                  label: 'Morocco',         iso: 'MA', pop: 37.8,   tfr: 2.27, lifeExp: 77.5, u15: 0.262, o65: 0.073, med: 30.5 },
  { name: 'Uganda',                   label: 'Uganda',          iso: 'UG', pop: 47.6,   tfr: 4.80, lifeExp: 64.0, u15: 0.470, o65: 0.020, med: 17.0 },
  { name: 'Mozambique',               label: 'Mozambique',      iso: 'MZ', pop: 33.9,   tfr: 4.65, lifeExp: 61.0, u15: 0.450, o65: 0.028, med: 17.5 },
  { name: 'Ghana',                    label: 'Ghana',           iso: 'GH', pop: 33.8,   tfr: 3.86, lifeExp: 65.5, u15: 0.390, o65: 0.035, med: 21.5 },
  { name: "Côte d'Ivoire",           label: "Côte d'Ivoire",  iso: 'CI', pop: 27.5,   tfr: 4.68, lifeExp: 59.0, u15: 0.430, o65: 0.025, med: 18.0 },
  { name: 'Madagascar',               label: 'Madagascar',      iso: 'MG', pop: 29.6,   tfr: 4.43, lifeExp: 66.0, u15: 0.430, o65: 0.028, med: 18.5 },
  { name: 'Cameroon',                 label: 'Cameroon',        iso: 'CM', pop: 29.1,   tfr: 4.61, lifeExp: 61.5, u15: 0.435, o65: 0.030, med: 18.0 },
  { name: 'Angola',                   label: 'Angola',          iso: 'AO', pop: 35.0,   tfr: 5.24, lifeExp: 63.0, u15: 0.470, o65: 0.025, med: 16.5 },
  { name: 'Zimbabwe',                 label: 'Zimbabwe',        iso: 'ZW', pop: 16.7,   tfr: 3.67, lifeExp: 63.5, u15: 0.400, o65: 0.040, med: 20.5 },
  { name: 'Zambia',                   label: 'Zambia',          iso: 'ZM', pop: 20.6,   tfr: 4.54, lifeExp: 64.5, u15: 0.460, o65: 0.025, med: 17.0 },
  { name: 'Mali',                     label: 'Mali',            iso: 'ML', pop: 24.4,   tfr: 5.91, lifeExp: 59.0, u15: 0.480, o65: 0.025, med: 16.0 },
  { name: 'Burkina Faso',             label: 'Burkina Faso',    iso: 'BF', pop: 23.0,   tfr: 4.90, lifeExp: 62.5, u15: 0.460, o65: 0.025, med: 17.5 },
  { name: 'Senegal',                  label: 'Senegal',         iso: 'SN', pop: 17.8,   tfr: 4.29, lifeExp: 68.5, u15: 0.430, o65: 0.030, med: 19.0 },
  { name: 'Chad',                     label: 'Chad',            iso: 'TD', pop: 18.5,   tfr: 6.02, lifeExp: 54.0, u15: 0.490, o65: 0.020, med: 16.5 },
  { name: 'Somalia',                  label: 'Somalia',         iso: 'SO', pop: 18.1,   tfr: 6.12, lifeExp: 58.0, u15: 0.480, o65: 0.024, med: 17.0 },
  { name: 'Guinea',                   label: 'Guinea',          iso: 'GN', pop: 13.5,   tfr: 4.65, lifeExp: 59.0, u15: 0.440, o65: 0.025, med: 18.0 },
  { name: 'Rwanda',                   label: 'Rwanda',          iso: 'RW', pop: 14.5,   tfr: 3.94, lifeExp: 69.5, u15: 0.380, o65: 0.028, med: 21.5 },
  { name: 'Benin',                    label: 'Benin',           iso: 'BJ', pop: 13.7,   tfr: 4.81, lifeExp: 62.0, u15: 0.450, o65: 0.025, med: 17.5 },
  { name: 'S. Sudan',                 label: 'South Sudan',     iso: 'SS', pop: 11.3,   tfr: 4.72, lifeExp: 56.5, u15: 0.440, o65: 0.025, med: 18.0 },
  { name: 'Burundi',                  label: 'Burundi',         iso: 'BI', pop: 13.2,   tfr: 5.04, lifeExp: 62.0, u15: 0.460, o65: 0.025, med: 17.5 },
  { name: 'Togo',                     label: 'Togo',            iso: 'TG', pop: 8.7,    tfr: 4.36, lifeExp: 62.0, u15: 0.430, o65: 0.029, med: 19.5 },
  { name: 'Sierra Leone',             label: 'Sierra Leone',    iso: 'SL', pop: 8.4,    tfr: 4.17, lifeExp: 57.5, u15: 0.430, o65: 0.030, med: 19.5 },
  { name: 'Malawi',                   label: 'Malawi',          iso: 'MW', pop: 21.0,   tfr: 4.15, lifeExp: 65.0, u15: 0.440, o65: 0.026, med: 18.0 },
  { name: 'Eritrea',                  label: 'Eritrea',         iso: 'ER', pop: 3.6,    tfr: 3.89, lifeExp: 68.0, u15: 0.390, o65: 0.030, med: 20.5 },
  { name: 'Namibia',                  label: 'Namibia',         iso: 'NA', pop: 2.7,    tfr: 3.43, lifeExp: 65.0, u15: 0.360, o65: 0.038, med: 22.0 },
  { name: 'Botswana',                 label: 'Botswana',        iso: 'BW', pop: 2.6,    tfr: 2.70, lifeExp: 63.5, u15: 0.325, o65: 0.043, med: 24.0 },
  { name: 'Gabon',                    label: 'Gabon',           iso: 'GA', pop: 2.5,    tfr: 3.52, lifeExp: 67.5, u15: 0.370, o65: 0.042, med: 22.0 },
  { name: 'Lesotho',                  label: 'Lesotho',         iso: 'LS', pop: 2.3,    tfr: 3.03, lifeExp: 53.5, u15: 0.348, o65: 0.058, med: 22.5 },
  { name: 'Liberia',                  label: 'Liberia',         iso: 'LR', pop: 5.4,    tfr: 4.28, lifeExp: 62.5, u15: 0.420, o65: 0.034, med: 19.0 },
  { name: 'Central African Rep.',     label: 'Centr. Afr. Rep.',iso: 'CF', pop: 5.5,    tfr: 5.92, lifeExp: 54.0, u15: 0.450, o65: 0.028, med: 17.5 },
  { name: 'Dem. Rep. Congo',          label: 'DR Congo',        iso: 'CD', pop: 102.3,  tfr: 5.70, lifeExp: 61.0, u15: 0.470, o65: 0.025, med: 16.5 },
  { name: 'Congo',                    label: 'Congo',           iso: 'CG', pop: 6.1,    tfr: 4.37, lifeExp: 65.0, u15: 0.435, o65: 0.028, med: 18.5 },
  { name: 'Libya',                    label: 'Libya',           iso: 'LY', pop: 6.8,    tfr: 2.30, lifeExp: 73.5, u15: 0.288, o65: 0.053, med: 28.5 },
  { name: 'Tunisia',                  label: 'Tunisia',         iso: 'TN', pop: 12.0,   tfr: 2.06, lifeExp: 77.0, u15: 0.238, o65: 0.092, med: 33.5 },
  { name: 'Mauritania',               label: 'Mauritania',      iso: 'MR', pop: 4.7,    tfr: 4.50, lifeExp: 66.0, u15: 0.435, o65: 0.030, med: 19.0 },
  { name: 'Guinea-Bissau',            label: 'Guinea-Bissau',   iso: 'GW', pop: 2.1,    tfr: 4.55, lifeExp: 60.5, u15: 0.440, o65: 0.030, med: 18.5 },
  { name: 'Eq. Guinea',               label: 'Eq. Guinea',      iso: 'GQ', pop: 1.5,    tfr: 4.57, lifeExp: 62.5, u15: 0.420, o65: 0.030, med: 19.5 },
  { name: 'Djibouti',                 label: 'Djibouti',        iso: 'DJ', pop: 1.1,    tfr: 2.73, lifeExp: 68.0, u15: 0.305, o65: 0.038, med: 25.0 },
  { name: 'eSwatini',                 label: 'Eswatini',        iso: 'SZ', pop: 1.2,    tfr: 2.95, lifeExp: 60.5, u15: 0.345, o65: 0.038, med: 22.5 },
  { name: 'W. Sahara',               label: 'W. Sahara',       iso: 'EH', pop: 0.60,   tfr: 2.50, lifeExp: 70.0, u15: 0.290, o65: 0.050, med: 28.0 },
  // ── AMERICAS ───────────────────────────────────────────────────────────────
  { name: 'United States of America', label: 'United States',   iso: 'US', pop: 345,    tfr: 1.62, lifeExp: 79.2, u15: 0.177, o65: 0.175, med: 38.5 },
  { name: 'Brazil',                   label: 'Brazil',          iso: 'BR', pop: 217,    tfr: 1.62, lifeExp: 75.9, u15: 0.199, o65: 0.102, med: 35.0 },
  { name: 'Mexico',                   label: 'Mexico',          iso: 'MX', pop: 130,    tfr: 1.82, lifeExp: 75.0, u15: 0.240, o65: 0.084, med: 29.3 },
  { name: 'Canada',                   label: 'Canada',          iso: 'CA', pop: 39.3,   tfr: 1.33, lifeExp: 82.6, u15: 0.157, o65: 0.190, med: 41.6 },
  { name: 'Colombia',                 label: 'Colombia',        iso: 'CO', pop: 52.2,   tfr: 1.75, lifeExp: 77.0, u15: 0.225, o65: 0.095, med: 31.5 },
  { name: 'Argentina',                label: 'Argentina',       iso: 'AR', pop: 46.7,   tfr: 2.12, lifeExp: 77.0, u15: 0.235, o65: 0.120, med: 32.5 },
  { name: 'Peru',                     label: 'Peru',            iso: 'PE', pop: 33.4,   tfr: 2.27, lifeExp: 74.5, u15: 0.265, o65: 0.085, med: 30.0 },
  { name: 'Venezuela',                label: 'Venezuela',       iso: 'VE', pop: 28.0,   tfr: 2.18, lifeExp: 72.0, u15: 0.255, o65: 0.088, med: 29.5 },
  { name: 'Chile',                    label: 'Chile',           iso: 'CL', pop: 19.4,   tfr: 1.55, lifeExp: 81.0, u15: 0.195, o65: 0.120, med: 36.0 },
  { name: 'Ecuador',                  label: 'Ecuador',         iso: 'EC', pop: 18.4,   tfr: 2.25, lifeExp: 77.0, u15: 0.270, o65: 0.078, med: 28.5 },
  { name: 'Bolivia',                  label: 'Bolivia',         iso: 'BO', pop: 12.1,   tfr: 2.70, lifeExp: 71.5, u15: 0.300, o65: 0.073, med: 25.5 },
  { name: 'Paraguay',                 label: 'Paraguay',        iso: 'PY', pop: 7.5,    tfr: 2.54, lifeExp: 74.5, u15: 0.295, o65: 0.072, med: 27.0 },
  { name: 'Uruguay',                  label: 'Uruguay',         iso: 'UY', pop: 3.4,    tfr: 1.73, lifeExp: 78.0, u15: 0.195, o65: 0.165, med: 36.5 },
  { name: 'Guatemala',                label: 'Guatemala',       iso: 'GT', pop: 18.1,   tfr: 2.70, lifeExp: 74.5, u15: 0.330, o65: 0.055, med: 23.0 },
  { name: 'Honduras',                 label: 'Honduras',        iso: 'HN', pop: 10.6,   tfr: 2.42, lifeExp: 75.5, u15: 0.295, o65: 0.054, med: 25.5 },
  { name: 'El Salvador',              label: 'El Salvador',     iso: 'SV', pop: 6.6,    tfr: 1.98, lifeExp: 73.5, u15: 0.272, o65: 0.080, med: 27.5 },
  { name: 'Nicaragua',                label: 'Nicaragua',       iso: 'NI', pop: 7.0,    tfr: 2.35, lifeExp: 75.0, u15: 0.285, o65: 0.062, med: 26.5 },
  { name: 'Costa Rica',               label: 'Costa Rica',      iso: 'CR', pop: 5.2,    tfr: 1.65, lifeExp: 81.5, u15: 0.198, o65: 0.115, med: 33.5 },
  { name: 'Panama',                   label: 'Panama',          iso: 'PA', pop: 4.4,    tfr: 2.22, lifeExp: 79.0, u15: 0.255, o65: 0.090, med: 29.5 },
  { name: 'Cuba',                     label: 'Cuba',            iso: 'CU', pop: 11.1,   tfr: 1.44, lifeExp: 78.5, u15: 0.152, o65: 0.188, med: 42.5 },
  { name: 'Dominican Rep.',           label: 'Dominican Rep.',  iso: 'DO', pop: 11.3,   tfr: 2.26, lifeExp: 75.0, u15: 0.265, o65: 0.083, med: 27.5 },
  { name: 'Haiti',                    label: 'Haiti',           iso: 'HT', pop: 11.7,   tfr: 2.78, lifeExp: 64.5, u15: 0.330, o65: 0.055, med: 23.5 },
  { name: 'Guyana',                   label: 'Guyana',          iso: 'GY', pop: 0.82,   tfr: 2.41, lifeExp: 70.5, u15: 0.270, o65: 0.065, med: 27.5 },
  { name: 'Suriname',                 label: 'Suriname',        iso: 'SR', pop: 0.63,   tfr: 2.25, lifeExp: 72.0, u15: 0.265, o65: 0.063, med: 29.5 },
  { name: 'Belize',                   label: 'Belize',          iso: 'BZ', pop: 0.41,   tfr: 2.25, lifeExp: 74.0, u15: 0.290, o65: 0.055, med: 23.5 },
  { name: 'Jamaica',                  label: 'Jamaica',         iso: 'JM', pop: 3.0,    tfr: 1.86, lifeExp: 74.0, u15: 0.215, o65: 0.110, med: 31.5 },
  { name: 'Trinidad and Tobago',      label: 'Trinidad & Tobago',iso:'TT', pop: 1.5,    tfr: 1.63, lifeExp: 74.0, u15: 0.185, o65: 0.120, med: 36.5 },
  // ── OCEANIA ────────────────────────────────────────────────────────────────
  { name: 'Australia',                label: 'Australia',       iso: 'AU', pop: 26.6,   tfr: 1.63, lifeExp: 83.2, u15: 0.184, o65: 0.172, med: 37.9 },
  { name: 'New Zealand',              label: 'New Zealand',     iso: 'NZ', pop: 5.1,    tfr: 1.60, lifeExp: 82.5, u15: 0.190, o65: 0.165, med: 38.0 },
  { name: 'Solomon Is.',              label: 'Solomon Islands', iso: 'SB', pop: 0.73,   tfr: 4.00, lifeExp: 72.5, u15: 0.390, o65: 0.030, med: 22.0 },
  { name: 'Vanuatu',                  label: 'Vanuatu',         iso: 'VU', pop: 0.34,   tfr: 3.72, lifeExp: 72.0, u15: 0.380, o65: 0.035, med: 22.5 },
  { name: 'Fiji',                     label: 'Fiji',            iso: 'FJ', pop: 0.93,   tfr: 2.56, lifeExp: 70.0, u15: 0.290, o65: 0.060, med: 28.5 },
];

const COUNTRY_BY_NAME = Object.fromEntries(COUNTRIES.map(c => [c.name, c]));

const MAX_AGE = 100; // ages 0..100, where 100 = "100+"

// Female share of population (used for births). Slightly under half.
const FEMALE_FRAC = 0.487;

// Age-specific fertility shape over ages 15..49, Gaussian peaking ~28.
// Returns normalized weights that sum to 1 (so sum a*asfr = TFR).
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

// Base annual mortality probability by single year of age (a "model" schedule
// roughly yielding ~82y life expectancy before per-country scaling).
function baseMortality(age) {
  if (age < 1)  return 0.0045;
  if (age < 5)  return 0.0006;
  if (age < 15) return 0.00025;
  if (age < 40) return 0.0009;
  // exponential (Gompertz-like) rise after 40
  return Math.min(0.6, 0.0009 * Math.exp((age - 40) * 0.0915));
}

function _medianOfShares(dist) {
  let total = 0; for (let a = 0; a <= MAX_AGE; a++) total += dist[a];
  let cum = 0;
  for (let a = 0; a <= MAX_AGE; a++) { cum += dist[a]; if (cum >= total / 2) return a; }
  return MAX_AGE;
}

// Build a single-year age distribution (ages 0..100) as shares, matching a
// country's u15 / o65, with the 15-64 band tilted (parameter k) so the overall
// median age can be calibrated to the real value.
function _buildShares(c, k) {
  const dist = new Float64Array(MAX_AGE + 1);
  const fChild = c.u15;
  const fSenior = c.o65;
  const fWork = Math.max(0.05, 1 - fChild - fSenior);

  // 0..14 : tilt by fertility (high TFR => more at the youngest ages)
  const childSlope = Math.max(-0.45, Math.min(0.55, (c.tfr - 2.1) * 0.18));
  let sChild = 0;
  for (let a = 0; a <= 14; a++) {
    const w = 1 + childSlope * (7 - a) / 7;
    dist[a] = Math.max(0.02, w); sChild += dist[a];
  }
  for (let a = 0; a <= 14; a++) dist[a] = dist[a] / sChild * fChild;

  // 15..64 : exponential tilt by k (k>0 shifts mass to older working ages)
  let sWork = 0;
  for (let a = 15; a <= 64; a++) {
    const w = Math.exp(k * (a - 40) / 25) * (1 + 0.08 * Math.cos((a - 15) / 49 * Math.PI * 2));
    dist[a] = Math.max(0.02, w); sWork += dist[a];
  }
  for (let a = 15; a <= 64; a++) dist[a] = dist[a] / sWork * fWork;

  // 65..100 : steep exponential decline
  let sSen = 0;
  for (let a = 65; a <= MAX_AGE; a++) { const w = Math.exp(-(a - 65) / 8.5); dist[a] = w; sSen += w; }
  for (let a = 65; a <= MAX_AGE; a++) dist[a] = dist[a] / sSen * fSenior;
  return dist;
}

// Build distribution in MILLIONS, calibrating the working-age tilt to hit med.
function buildInitialAges(c) {
  let lo = -3, hi = 3, dist = _buildShares(c, 0);
  // binary search k so median ≈ c.med
  for (let it = 0; it < 22; it++) {
    const k = (lo + hi) / 2;
    dist = _buildShares(c, k);
    const m = _medianOfShares(dist);
    if (m < c.med) lo = k; else hi = k;   // higher k => older => larger median
  }
  for (let a = 0; a <= MAX_AGE; a++) dist[a] *= c.pop;  // scale to millions
  return dist;
}
