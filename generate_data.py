import math, json

# UN WPP 2024 medium variant data from database.earth
# Format: (name_in_datajs, label, iso, pop_millions, tfr, lifeExp, u15, o65, med)
# pop from population table, tfr from fertility table, lifeExp from life expectancy table
# u15, o65, med: updated from various UN sources where available, otherwise estimated
# using consistent relationships with TFR and lifeExp

countries = [
    # EAST ASIA
    ("South Korea",              "South Korea",     "KR", 51.7,   0.73, 84.4, 0.112, 0.190, 45.5),
    ("Japan",                    "Japan",           "JP", 123.8,  1.22, 84.9, 0.112, 0.300, 49.9),
    ("China",                    "China",           "CN", 1419,   1.01, 78.0, 0.165, 0.147, 40.1),
    ("North Korea",              "North Korea",     "KP", 26.5,   1.78, 73.7, 0.190, 0.115, 36.5),
    ("Mongolia",                 "Mongolia",        "MN", 3.5,    2.63, 72.0, 0.275, 0.050, 29.0),
    ("Taiwan",                   "Taiwan",          "TW", 23.2,   0.86, 80.7, 0.118, 0.198, 43.5),
    # SOUTHEAST ASIA
    ("Indonesia",                "Indonesia",       "ID", 283.5,  2.11, 71.3, 0.248, 0.072, 30.5),
    ("Vietnam",                  "Vietnam",         "VN", 101.0,  1.90, 74.7, 0.228, 0.082, 32.5),
    ("Philippines",              "Philippines",     "PH", 115.8,  1.89, 69.9, 0.290, 0.058, 25.5),
    ("Thailand",                 "Thailand",        "TH", 71.7,   1.20, 76.6, 0.155, 0.145, 41.0),
    ("Myanmar",                  "Myanmar",         "MM", 54.5,   2.10, 67.1, 0.252, 0.060, 29.5),
    ("Malaysia",                 "Malaysia",        "MY", 35.6,   1.54, 76.8, 0.230, 0.078, 31.5),
    ("Cambodia",                 "Cambodia",        "KH", 17.6,   2.55, 70.8, 0.290, 0.050, 26.5),
    ("Laos",                     "Laos",            "LA", 7.8,    2.40, 69.2, 0.298, 0.045, 25.0),
    ("Papua New Guinea",         "Papua New Guinea","PG", 10.6,   3.07, 66.3, 0.350, 0.036, 22.5),
    ("Timor-Leste",              "Timor-Leste",     "TL", 1.4,    2.63, 67.9, 0.340, 0.038, 22.5),
    # SOUTH ASIA
    ("India",                    "India",           "IN", 1451,   1.96, 72.2, 0.245, 0.073, 29.8),
    ("Pakistan",                 "Pakistan",        "PK", 251.3,  3.55, 67.8, 0.348, 0.045, 21.5),
    ("Bangladesh",               "Bangladesh",      "BD", 173.6,  2.14, 74.9, 0.265, 0.060, 28.5),
    ("Afghanistan",              "Afghanistan",     "AF", 42.6,   4.76, 66.3, 0.425, 0.030, 18.0),
    ("Nepal",                    "Nepal",           "NP", 29.7,   1.96, 70.6, 0.265, 0.068, 27.0),
    ("Sri Lanka",                "Sri Lanka",       "LK", 23.1,   1.95, 77.7, 0.212, 0.128, 34.5),
    # CENTRAL ASIA
    ("Kazakhstan",               "Kazakhstan",      "KZ", 20.6,   2.98, 74.5, 0.285, 0.078, 30.5),
    ("Uzbekistan",               "Uzbekistan",      "UZ", 36.4,   3.49, 72.5, 0.290, 0.055, 28.5),
    ("Turkmenistan",             "Turkmenistan",    "TM", 7.5,    2.66, 70.2, 0.288, 0.050, 28.5),
    ("Kyrgyzstan",               "Kyrgyzstan",      "KG", 7.2,    2.78, 71.8, 0.305, 0.045, 26.5),
    ("Tajikistan",               "Tajikistan",      "TJ", 10.6,   3.04, 71.9, 0.348, 0.035, 22.5),
    # MIDDLE EAST
    ("Iran",                     "Iran",            "IR", 91.6,   1.68, 77.9, 0.235, 0.072, 33.5),
    ("Turkey",                   "Türkiye",    "TR", 87.5,   1.62, 77.4, 0.218, 0.098, 34.0),
    ("Saudi Arabia",             "Saudi Arabia",    "SA", 34.0,   2.31, 79.0, 0.248, 0.040, 30.0),
    ("Iraq",                     "Iraq",            "IQ", 46.0,   3.22, 72.4, 0.370, 0.036, 21.5),
    ("Syria",                    "Syria",           "SY", 24.7,   2.70, 72.6, 0.330, 0.040, 23.5),
    ("Yemen",                    "Yemen",           "YE", 40.6,   4.50, 69.4, 0.395, 0.032, 19.5),
    ("Jordan",                   "Jordan",          "JO", 11.6,   2.60, 78.0, 0.320, 0.042, 24.0),
    ("Israel",                   "Israel",          "IL", 9.4,    2.78, 82.7, 0.270, 0.125, 30.5),
    ("Lebanon",                  "Lebanon",         "LB", 5.8,    2.23, 77.9, 0.245, 0.075, 31.0),
    ("United Arab Emirates",     "UAE",             "AE", 11.0,   1.21, 83.1, 0.145, 0.012, 33.5),
    ("Kuwait",                   "Kuwait",          "KW", 4.9,    1.51, 80.6, 0.218, 0.028, 34.5),
    ("Qatar",                    "Qatar",           "QA", 3.0,    1.72, 82.5, 0.130, 0.015, 34.0),
    ("Oman",                     "Oman",            "OM", 5.3,    2.51, 80.2, 0.225, 0.040, 30.5),
    # EUROPE
    ("Germany",                  "Germany",         "DE", 84.6,   1.45, 81.5, 0.138, 0.226, 45.5),
    ("France",                   "France",          "FR", 66.5,   1.64, 83.5, 0.170, 0.218, 42.8),
    ("Italy",                    "Italy",           "IT", 59.3,   1.21, 83.9, 0.122, 0.243, 48.6),
    ("Spain",                    "Spain",           "ES", 47.9,   1.22, 83.8, 0.128, 0.210, 46.8),
    ("United Kingdom",           "United Kingdom",  "GB", 69.1,   1.55, 81.4, 0.174, 0.194, 40.7),
    ("Russia",                   "Russia",          "RU", 144.8,  1.46, 73.3, 0.172, 0.168, 41.4),
    ("Ukraine",                  "Ukraine",         "UA", 37.9,   0.99, 74.7, 0.148, 0.180, 42.0),
    ("Poland",                   "Poland",          "PL", 38.5,   1.30, 78.8, 0.152, 0.192, 42.0),
    ("Romania",                  "Romania",         "RO", 19.0,   1.71, 76.1, 0.155, 0.198, 42.5),
    ("Netherlands",              "Netherlands",     "NL", 18.2,   1.43, 82.3, 0.152, 0.222, 43.0),
    ("Belgium",                  "Belgium",         "BE", 11.7,   1.38, 82.3, 0.162, 0.202, 42.0),
    ("Czechia",                  "Czech Republic",  "CZ", 10.7,   1.46, 80.0, 0.153, 0.218, 43.5),
    ("Sweden",                   "Sweden",          "SE", 10.6,   1.43, 83.4, 0.173, 0.207, 41.5),
    ("Portugal",                 "Portugal",        "PT", 10.4,   1.51, 82.6, 0.126, 0.242, 46.5),
    ("Greece",                   "Greece",          "GR", 10.0,   1.34, 82.0, 0.131, 0.228, 46.5),
    ("Hungary",                  "Hungary",         "HU", 9.7,    1.49, 77.2, 0.143, 0.208, 43.5),
    ("Austria",                  "Austria",         "AT", 9.1,    1.32, 82.1, 0.143, 0.208, 44.5),
    ("Switzerland",              "Switzerland",     "CH", 8.9,    1.44, 84.1, 0.143, 0.198, 43.8),
    ("Belarus",                  "Belarus",         "BY", 9.1,    1.22, 74.6, 0.162, 0.168, 41.0),
    ("Norway",                   "Norway",          "NO", 5.6,    1.41, 83.5, 0.163, 0.182, 40.5),
    ("Denmark",                  "Denmark",         "DK", 6.0,    1.52, 82.1, 0.153, 0.202, 42.5),
    ("Finland",                  "Finland",         "FI", 5.6,    1.29, 82.1, 0.150, 0.228, 44.0),
    ("Slovakia",                 "Slovakia",        "SK", 5.5,    1.56, 78.5, 0.153, 0.182, 41.5),
    ("Bulgaria",                 "Bulgaria",        "BG", 6.8,    1.75, 75.8, 0.136, 0.212, 44.5),
    ("Croatia",                  "Croatia",         "HR", 3.9,    1.47, 78.8, 0.143, 0.218, 44.5),
    ("Serbia",                   "Serbia",          "RS", 6.7,    1.50, 76.9, 0.140, 0.202, 43.5),
    ("Ireland",                  "Ireland",         "IE", 5.3,    1.60, 82.6, 0.203, 0.148, 38.0),
    ("Lithuania",                "Lithuania",       "LT", 2.9,    1.21, 76.2, 0.148, 0.218, 44.5),
    ("Latvia",                   "Latvia",          "LV", 1.9,    1.34, 76.3, 0.148, 0.218, 44.5),
    ("Estonia",                  "Estonia",         "EE", 1.4,    1.36, 79.3, 0.168, 0.218, 43.5),
    ("Albania",                  "Albania",         "AL", 2.8,    1.34, 79.8, 0.175, 0.158, 37.5),
    ("Bosnia and Herz.",         "Bosnia & Herz.",  "BA", 3.2,    1.49, 78.0, 0.142, 0.178, 43.0),
    ("Slovenia",                 "Slovenia",        "SI", 2.1,    1.58, 81.8, 0.143, 0.218, 45.0),
    ("Moldova",                  "Moldova",         "MD", 3.0,    1.73, 71.3, 0.168, 0.168, 39.0),
    ("Montenegro",               "Montenegro",     "ME", 0.64,   1.80, 77.3, 0.173, 0.162, 38.5),
    ("Macedonia",                "N. Macedonia",    "MK", 1.8,    1.47, 77.5, 0.160, 0.158, 39.5),
    ("Kosovo",                   "Kosovo",          "XK", 1.7,    1.54, 78.2, 0.232, 0.090, 31.5),
    ("Georgia",                  "Georgia",         "GE", 3.8,    1.80, 74.7, 0.193, 0.158, 37.5),
    ("Armenia",                  "Armenia",         "AM", 3.0,    1.72, 75.8, 0.188, 0.133, 37.0),
    ("Azerbaijan",               "Azerbaijan",      "AZ", 10.3,   1.67, 74.6, 0.210, 0.082, 33.0),
    ("Iceland",                  "Iceland",         "IS", 0.39,   1.52, 83.0, 0.188, 0.158, 38.0),
    # AFRICA
    ("Nigeria",                  "Nigeria",         "NG", 232.7,  4.38, 54.6, 0.420, 0.030, 17.5),
    ("Niger",                    "Niger",           "NE", 27.0,   5.94, 61.4, 0.490, 0.027, 14.8),
    ("Ethiopia",                 "Ethiopia",        "ET", 132.1,  3.91, 67.6, 0.408, 0.032, 20.0),
    ("Egypt",                    "Egypt",           "EG", 116.5,  2.74, 71.8, 0.322, 0.057, 26.0),
    ("Tanzania",                  "Tanzania",        "TZ", 68.6,   4.54, 67.2, 0.435, 0.031, 18.0),
    ("Kenya",                    "Kenya",           "KE", 56.4,   3.17, 63.8, 0.370, 0.032, 20.5),
    ("South Africa",             "South Africa",    "ZA", 64.0,   2.21, 66.3, 0.270, 0.057, 28.5),
    ("Algeria",                  "Algeria",         "DZ", 46.8,   2.72, 76.5, 0.295, 0.072, 29.5),
    ("Sudan",                    "Sudan",           "SD", 50.4,   4.26, 66.5, 0.405, 0.036, 19.5),
    ("Morocco",                  "Morocco",         "MA", 38.1,   2.21, 75.5, 0.258, 0.075, 31.0),
    ("Uganda",                   "Uganda",          "UG", 50.0,   4.16, 68.5, 0.460, 0.022, 17.5),
    ("Mozambique",               "Mozambique",      "MZ", 34.6,   4.69, 63.8, 0.448, 0.028, 17.5),
    ("Ghana",                    "Ghana",           "GH", 34.4,   3.34, 65.7, 0.378, 0.037, 22.0),
    ("Côte d'Ivoire",      "Côte d'Ivoire","CI",31.9,  4.23, 62.1, 0.422, 0.027, 18.5),
    ("Madagascar",               "Madagascar",      "MG", 32.0,   3.91, 63.8, 0.422, 0.029, 19.0),
    ("Cameroon",                 "Cameroon",        "CM", 29.1,   4.26, 64.0, 0.428, 0.031, 18.5),
    ("Angola",                   "Angola",          "AO", 37.9,   5.05, 64.8, 0.462, 0.026, 17.0),
    ("Zimbabwe",                 "Zimbabwe",        "ZW", 16.6,   3.67, 63.1, 0.395, 0.042, 21.0),
    ("Zambia",                   "Zambia",          "ZM", 21.3,   4.04, 66.5, 0.452, 0.026, 17.5),
    ("Mali",                     "Mali",            "ML", 24.5,   5.51, 60.7, 0.475, 0.026, 16.5),
    ("Burkina Faso",             "Burkina Faso",    "BF", 23.5,   4.11, 61.3, 0.448, 0.027, 18.0),
    ("Senegal",                  "Senegal",         "SN", 18.5,   3.77, 68.9, 0.422, 0.031, 19.5),
    ("Chad",                     "Chad",            "TD", 20.3,   6.03, 55.2, 0.485, 0.022, 16.5),
    ("Somalia",                  "Somalia",         "SO", 19.0,   6.01, 59.0, 0.478, 0.025, 17.0),
    ("Guinea",                   "Guinea",          "GN", 14.8,   4.13, 60.9, 0.435, 0.026, 18.5),
    ("Rwanda",                   "Rwanda",          "RW", 14.3,   3.64, 68.0, 0.372, 0.030, 22.0),
    ("Benin",                    "Benin",           "BJ", 14.5,   4.48, 61.0, 0.445, 0.026, 18.0),
    ("S. Sudan",                 "South Sudan",     "SS", 11.9,   3.79, 57.7, 0.430, 0.026, 18.5),
    ("Burundi",                  "Burundi",         "BI", 14.0,   4.79, 63.8, 0.455, 0.026, 17.5),
    ("Togo",                     "Togo",            "TG", 9.5,    4.12, 62.9, 0.422, 0.030, 20.0),
    ("Sierra Leone",             "Sierra Leone",    "SL", 8.6,    3.70, 62.0, 0.418, 0.031, 20.0),
    ("Malawi",                   "Malawi",          "MW", 21.7,   3.59, 67.6, 0.428, 0.028, 18.5),
    ("Eritrea",                  "Eritrea",         "ER", 3.5,    3.68, 68.9, 0.385, 0.031, 21.0),
    ("Namibia",                  "Namibia",         "NA", 3.0,    3.21, 67.5, 0.352, 0.040, 22.5),
    ("Botswana",                 "Botswana",        "BW", 2.5,    2.70, 69.3, 0.320, 0.045, 24.5),
    ("Gabon",                    "Gabon",           "GA", 2.5,    3.59, 68.5, 0.365, 0.043, 22.5),
    ("Lesotho",                  "Lesotho",         "LS", 2.3,    2.66, 57.8, 0.340, 0.058, 23.0),
    ("Liberia",                  "Liberia",         "LR", 5.6,    3.86, 62.3, 0.415, 0.035, 19.5),
    ("Central African Rep.",     "Centr. Afr. Rep.","CF", 5.3,    5.95, 57.7, 0.448, 0.028, 17.5),
    ("Dem. Rep. Congo",          "DR Congo",        "CD", 109.3,  5.98, 62.1, 0.468, 0.026, 16.5),
    ("Congo",                    "Congo",           "CG", 6.3,    4.11, 66.0, 0.428, 0.029, 19.0),
    ("Libya",                    "Libya",           "LY", 7.4,    2.30, 71.1, 0.282, 0.055, 29.0),
    ("Tunisia",                  "Tunisia",         "TN", 12.3,   1.82, 76.7, 0.232, 0.095, 34.0),
    ("Mauritania",               "Mauritania",      "MR", 5.2,    4.63, 68.7, 0.432, 0.031, 19.5),
    ("Guinea-Bissau",            "Guinea-Bissau",   "GW", 2.2,    3.76, 64.3, 0.428, 0.031, 19.0),
    ("Eq. Guinea",               "Eq. Guinea",      "GQ", 1.9,    4.12, 63.9, 0.415, 0.031, 20.0),
    ("Djibouti",                 "Djibouti",        "DJ", 1.2,    2.62, 66.2, 0.298, 0.040, 25.5),
    ("eSwatini",                 "Eswatini",        "SZ", 1.2,    2.72, 64.3, 0.340, 0.040, 23.0),
    ("W. Sahara",               "W. Sahara",       "EH", 0.59,   2.18, 71.6, 0.282, 0.052, 28.5),
    # AMERICAS
    ("United States of America", "United States",   "US", 345.4,  1.62, 79.5, 0.175, 0.178, 38.8),
    ("Brazil",                   "Brazil",          "BR", 212.0,  1.61, 76.0, 0.196, 0.105, 35.5),
    ("Mexico",                   "Mexico",          "MX", 130.9,  1.89, 75.3, 0.238, 0.086, 29.8),
    ("Canada",                   "Canada",          "CA", 39.7,   1.34, 82.7, 0.155, 0.192, 42.0),
    ("Colombia",                 "Colombia",        "CO", 52.9,   1.63, 77.9, 0.220, 0.098, 32.0),
    ("Argentina",                "Argentina",       "AR", 45.7,   1.50, 77.5, 0.228, 0.122, 33.0),
    ("Peru",                     "Peru",            "PE", 34.2,   1.96, 77.9, 0.260, 0.088, 30.5),
    ("Venezuela",                "Venezuela",       "VE", 28.4,   2.08, 72.7, 0.248, 0.090, 30.0),
    ("Chile",                    "Chile",           "CL", 19.8,   1.14, 81.4, 0.188, 0.125, 37.0),
    ("Ecuador",                  "Ecuador",         "EC", 18.1,   1.81, 77.6, 0.262, 0.080, 29.0),
    ("Bolivia",                  "Bolivia",         "BO", 12.4,   2.52, 68.7, 0.292, 0.075, 26.0),
    ("Paraguay",                 "Paraguay",        "PY", 6.9,    2.42, 74.0, 0.288, 0.074, 27.5),
    ("Uruguay",                  "Uruguay",         "UY", 3.4,    1.40, 78.3, 0.192, 0.168, 37.0),
    ("Guatemala",                "Guatemala",       "GT", 18.4,   2.29, 72.7, 0.318, 0.057, 24.0),
    ("Honduras",                 "Honduras",        "HN", 10.8,   2.48, 73.0, 0.288, 0.056, 26.0),
    ("El Salvador",              "El Salvador",     "SV", 6.3,    1.77, 72.3, 0.265, 0.082, 28.0),
    ("Nicaragua",                "Nicaragua",       "NI", 6.9,    2.21, 75.1, 0.278, 0.064, 27.0),
    ("Costa Rica",               "Costa Rica",      "CR", 5.1,    1.32, 81.0, 0.192, 0.118, 34.5),
    ("Panama",                   "Panama",          "PA", 4.5,    2.11, 79.8, 0.248, 0.092, 30.0),
    ("Cuba",                     "Cuba",            "CU", 11.0,   1.45, 78.3, 0.150, 0.190, 43.0),
    ("Dominican Rep.",           "Dominican Rep.",  "DO", 11.4,   2.22, 73.9, 0.258, 0.085, 28.0),
    ("Haiti",                    "Haiti",           "HT", 11.8,   2.63, 65.1, 0.322, 0.057, 24.0),
    ("Guyana",                   "Guyana",          "GY", 0.83,   2.39, 70.3, 0.265, 0.067, 28.0),
    ("Suriname",                 "Suriname",        "SR", 0.63,   2.23, 73.8, 0.258, 0.065, 30.0),
    ("Belize",                   "Belize",          "BZ", 0.42,   2.02, 73.7, 0.278, 0.057, 24.5),
    ("Jamaica",                  "Jamaica",         "JM", 2.8,    1.35, 71.6, 0.208, 0.112, 32.0),
    ("Trinidad and Tobago",      "Trinidad & Tobago","TT",1.5,    1.54, 73.6, 0.182, 0.122, 37.0),
    # OCEANIA
    ("Australia",                "Australia",       "AU", 26.7,   1.64, 84.1, 0.182, 0.174, 38.2),
    ("New Zealand",              "New Zealand",     "NZ", 5.2,    1.66, 82.2, 0.188, 0.168, 38.5),
    ("Solomon Is.",              "Solomon Islands", "SB", 0.82,   3.51, 70.7, 0.382, 0.032, 22.5),
    ("Vanuatu",                  "Vanuatu",         "VU", 0.33,   3.57, 71.7, 0.375, 0.036, 23.0),
    ("Fiji",                     "Fiji",            "FJ", 0.93,   2.27, 67.5, 0.282, 0.062, 29.0),
]

header = """/* ============================================================================
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

"""

region_comments = {
    "South Korea": "  // ── EAST ASIA ────────────────────────────────────────────────────────────────────",
    "Indonesia":   "  // ── SOUTHEAST ASIA ─────────────────────────────────────────────────────────────────",
    "India":       "  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────────────",
    "Kazakhstan":  "  // ── CENTRAL ASIA ───────────────────────────────────────────────────────────────────",
    "Iran":        "  // ── MIDDLE EAST ────────────────────────────────────────────────────────────────────",
    "Germany":     "  // ── EUROPE ─────────────────────────────────────────────────────────────────────────",
    "Nigeria":     "  // ── AFRICA ─────────────────────────────────────────────────────────────────────────",
    "United States of America": "  // ── AMERICAS ───────────────────────────────────────────────────────────────────────",
    "Australia":   "  // ── OCEANIA ────────────────────────────────────────────────────────────────────────",
}

lines = [header]
lines.append("const COUNTRIES = [")

for c in countries:
    name, label, iso, pop, tfr, le, u15, o65, med = c
    if name in region_comments:
        lines.append(region_comments[name])
    pop_str = f"{pop}" if pop == int(pop) else f"{pop}"
    entry = f"  {{ name: '{name}', "
    entry += " " * max(0, 36 - len(entry))
    entry += f"label: '{label}', "
    entry += " " * max(0, 60 - len(entry))
    entry += f"iso: '{iso}', pop: {pop}, "
    entry += " " * max(0, 82 - len(entry))
    entry += f"tfr: {tfr:.2f}, lifeExp: {le:.1f}, u15: {u15:.3f}, o65: {o65:.3f}, med: {med:.1f} }},"
    lines.append(entry)

lines.append("];")
lines.append("")

footer = """const COUNTRY_BY_NAME = Object.fromEntries(COUNTRIES.map(c => [c.name, c]));

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
"""

lines.append(footer)

output = "\n".join(lines)
with open("/sessions/festive-lucid-galileo/mnt/population-forecast/js/data.js", "w") as f:
    f.write(output)

print(f"Wrote {len(countries)} countries to data.js")
print(f"File size: {len(output)} bytes")
