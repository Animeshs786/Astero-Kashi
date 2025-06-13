const axios = require("axios");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

const ASTROLOGY_API_BASE_URL = "https://json.astrologyapi.com/v1";

exports.getDailyHoroscope = catchAsync(async (req, res, next) => {
  const { zodiacNames } = req.body;

  if (!Array.isArray(zodiacNames) || zodiacNames.length === 0) {
    return next(new AppError("zodiacNames must be a non-empty array", 400));
  }

  const validZodiacNames = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];

  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID_HORO}:${process.env.ASTROLOGY_API_KEY_HORO}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  const requestData = { timezone: 5.5 };

  const results = [];

  for (const zodiacName of zodiacNames) {
    const normalizedZodiacName = zodiacName.toLowerCase();

    if (!validZodiacNames.includes(normalizedZodiacName)) {
      results.push({
        zodiacName,
        error: "Invalid zodiac name",
      });
      continue;
    }

    try {
      const response = await axios.post(
        `${ASTROLOGY_API_BASE_URL}/sun_sign_prediction/daily/${normalizedZodiacName}`,
        requestData,
        { headers }
      );

      if (response.status === 200) {
        results.push({
          zodiacName: normalizedZodiacName,
          prediction: response.data,
        });
      } else {
        results.push({
          zodiacName: normalizedZodiacName,
          error: `API error: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        zodiacName: normalizedZodiacName,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: true,
    message: "Daily horoscopes fetched",
    data: results,
  });
});

exports.getTomorrowHoroscope = catchAsync(async (req, res, next) => {
  const { zodiacNames } = req.body;

  if (!Array.isArray(zodiacNames) || zodiacNames.length === 0) {
    return next(new AppError("zodiacNames must be a non-empty array", 400));
  }

  const validZodiacNames = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];

  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID_HORO}:${process.env.ASTROLOGY_API_KEY_HORO}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  const requestData = { timezone: 5.5 };

  const results = [];

  for (const zodiacName of zodiacNames) {
    const normalizedZodiacName = zodiacName.toLowerCase();

    if (!validZodiacNames.includes(normalizedZodiacName)) {
      results.push({
        zodiacName,
        error: "Invalid zodiac name",
      });
      continue;
    }

    try {
      const response = await axios.post(
        `${ASTROLOGY_API_BASE_URL}/sun_sign_prediction/daily/next/${normalizedZodiacName}`,
        requestData,
        { headers }
      );

      if (response.status === 200) {
        results.push({
          zodiacName: normalizedZodiacName,
          prediction: response.data,
        });
      } else {
        results.push({
          zodiacName: normalizedZodiacName,
          error: `API error: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        zodiacName: normalizedZodiacName,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: true,
    message: "Daily horoscopes fetched",
    data: results,
  });
});

exports.getYesterdayHoroscope = catchAsync(async (req, res, next) => {
  const { zodiacNames } = req.body;

  if (!Array.isArray(zodiacNames) || zodiacNames.length === 0) {
    return next(new AppError("zodiacNames must be a non-empty array", 400));
  }

  const validZodiacNames = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];

  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID_HORO}:${process.env.ASTROLOGY_API_KEY_HORO}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  const requestData = { timezone: 5.5 };

  const results = [];

  for (const zodiacName of zodiacNames) {
    const normalizedZodiacName = zodiacName.toLowerCase();

    if (!validZodiacNames.includes(normalizedZodiacName)) {
      results.push({
        zodiacName,
        error: "Invalid zodiac name",
      });
      continue;
    }

    try {
      const response = await axios.post(
        `${ASTROLOGY_API_BASE_URL}/sun_sign_prediction/daily/previous/${normalizedZodiacName}`,
        requestData,
        { headers }
      );

      if (response.status === 200) {
        results.push({
          zodiacName: normalizedZodiacName,
          prediction: response.data,
        });
      } else {
        results.push({
          zodiacName: normalizedZodiacName,
          error: `API error: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        zodiacName: normalizedZodiacName,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: true,
    message: "Daily horoscopes fetched",
    data: results,
  });
});

exports.getMonthlyHoroscope = catchAsync(async (req, res, next) => {
  const { zodiacNames } = req.body;

  if (!Array.isArray(zodiacNames) || zodiacNames.length === 0) {
    return next(new AppError("zodiacNames must be a non-empty array", 400));
  }

  const validZodiacNames = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];

  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID_HORO}:${process.env.ASTROLOGY_API_KEY_HORO}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  const requestData = { timezone: 5.5 };

  const results = [];

  for (const zodiacName of zodiacNames) {
    const normalizedZodiacName = zodiacName.toLowerCase();

    if (!validZodiacNames.includes(normalizedZodiacName)) {
      results.push({
        zodiacName,
        error: "Invalid zodiac name",
      });
      continue;
    }

    try {
      const response = await axios.post(
        `${ASTROLOGY_API_BASE_URL}/horoscope_prediction/monthly/${normalizedZodiacName}`,
        requestData,
        { headers }
      );

      if (response.status === 200) {
        results.push({
          zodiacName: normalizedZodiacName,
          prediction: response.data,
        });
      } else {
        results.push({
          zodiacName: normalizedZodiacName,
          error: `API error: ${response.status}`,
        });
      }
    } catch (error) {
      results.push({
        zodiacName: normalizedZodiacName,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: true,
    message: "Daily horoscopes fetched",
    data: results,
  });
});

exports.getKundliDetails = catchAsync(async (req, res, next) => {
  const {
    name,
    dob, // Format: YYYY-MM-DD
    tob, // Format: HH:MM (24-hour)
    place,
    latitude,
    longitude,
    timezone = 5.5, // Default to IST
    gender,
    language = "en", // Default to English
    varshaphal_year = new Date().getFullYear(), // Default to current year
    sections = [], // Optional: specify sections to fetch
    chartTypes = ["D1", "D9"], // Default to D1 and D9 charts
  } = req.body;

  console.log(req.body, "body");

  // Validate inputs
  if (!name || !dob || !tob || !place || !latitude || !longitude || !gender) {
    return next(
      new AppError(
        "Name, date of birth, time of birth, place, latitude, longitude, and gender are required",
        400
      ),
      { status: false }
    );
  }

  // Validate DOB format (YYYY-MM-DD)
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(dob)) {
    return next(new AppError("Invalid DOB format. Use YYYY-MM-DD", 400), {
      status: false,
    });
  }

  // Validate TOB format (HH:MM)
  const tobRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!tobRegex.test(tob)) {
    return next(new AppError("Invalid TOB format. Use HH:MM (24-hour)", 400), {
      status: false,
    });
  }

  // Validate gender
  const validGenders = ["male", "female", "other"];
  if (!validGenders.includes(gender.toLowerCase())) {
    return next(
      new AppError("Invalid gender. Use male, female, or other", 400),
      { status: false }
    );
  }

  // Validate latitude (-90 to 90)
  const lat = parseFloat(latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return next(
      new AppError("Invalid latitude. Must be between -90 and 90", 400),
      { status: false }
    );
  }

  // Validate longitude (-180 to 180)
  const lon = parseFloat(longitude);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    return next(
      new AppError("Invalid longitude. Must be between -180 and 180", 400),
      { status: false }
    );
  }

  // Validate timezone
  const tz = parseFloat(timezone);
  if (isNaN(tz) || tz < -12 || tz > 14) {
    return next(
      new AppError("Invalid timezone. Must be between -12 and 14", 400),
      { status: false }
    );
  }

  // Validate language
  const validLanguages = ["en", "hi"];
  if (!validLanguages.includes(language.toLowerCase())) {
    return next(new AppError("Invalid language. Use en or hi", 400), {
      status: false,
    });
  }

  // Validate varshaphal_year
  const year = parseInt(varshaphal_year);
  if (isNaN(year) || year < 1900 || year > 2100) {
    return next(new AppError("Invalid varshaphal year.", 400), {
      status: false,
    });
  }

  // Validate chartTypes
  const validChartTypes = [
    "chalit",
    "SUN",
    "MOON",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D7",
    "D8",
    "D9",
    "D10",
    "D12",
    "D16",
    "D20",
    "D24",
    "D27",
    "D30",
    "D40",
    "D45",
    "D60",
  ];
  if (chartTypes.some((chart) => !validChartTypes.includes(chart))) {
    return next(new AppError("Invalid chart type specified.", 400), {
      status: false,
    });
  }

  // Extract DOB components
  const [dobYear, month, day] = dob.split("-").map(Number);
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(dobYear) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return next(
      new AppError(
        "Invalid date of birth components. Ensure YYYY-MM-DD format.",
        400
      ),
      { status: false }
    );
  }

  // Extract TOB components
  const [hour, minute] = tob.split(":").map(Number);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return next(
      new AppError(
        "Invalid time of birth components. Ensure HH:MM format.",
        400
      ),
      { status: false }
    );
  }

  // Prepare API request data
  const requestData = {
    day,
    month,
    year: dobYear,
    hour,
    min: minute,
    lat,
    lon,
    tzone: tz,
    language: language.toLowerCase(),
    planetColor: "#ff0000", // Required for horo_chart_image
    signColor: "#00ff00", // Required for horo_chart_image
    lineColor: "#0000ff", // Required for horo_chart_image
    chartType: "north", // Required for horo_chart_image
  };

  // Validate requestData
  if (
    isNaN(requestData.day) ||
    isNaN(requestData.month) ||
    isNaN(requestData.year) ||
    isNaN(requestData.hour) ||
    isNaN(requestData.min) ||
    isNaN(requestData.lat) ||
    isNaN(requestData.lon) ||
    isNaN(requestData.tzone)
  ) {
    return next(
      new AppError(
        "Invalid request data: day, month, year, hour, minute, lat, lon, or tzone is not a number",
        400
      ),
      { status: false }
    );
  }

  // Prepare Varshphal request data
  const varshaphalRequestData = {
    ...requestData,
    varshaphal_year: year,
  };

  // Prepare authorization header
  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID}:${process.env.ASTROLOGY_API_KEY}`
  ).toString("base64");
  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  // List of planets for planet-specific endpoints
  const planets = [
    "sun",
    "moon",
    "mars",
    "mercury",
    "jupiter",
    "venus",
    "saturn",
  ];

  // Define sections to fetch
  const allSections = [
    "basicDetails",
    "astroDetails",
    "planetaryPositions",
    "lalkitab",
    "varshaphal",
    "kpSystem",
    "panchang",
    "ashtakvarga",
    "dosha",
    "remedies",
    "suggestions",
    "numero",
    "nakshatra",
    "dasha",
    "reports",
    "charts",
    "ghatChakra",
  ];
  const sectionsToFetch = sections.length > 0 ? sections : allSections;

  try {
    // Initialize response data
    const kundliDetails = {
      basicDetails: {},
      astroDetails: {},
      planetaryPositions: [],
      lalkitab: {
        horoscope: {},
        debts: {},
        houses: {},
        planets: {},
        remedies: {},
      },
      varshaphal: {},
      kpSystem: {},
      panchang: {},
      ashtakvarga: { planetAshtak: {}, sarvashtak: {} },
      dosha: { kalsarpa: {}, manglik: {}, sadhesati: {}, pitraDosha: {} },
      remedies: { lalkitab: {} },
      suggestions: { gem: {}, rudraksha: {} },
      numero: {},
      nakshatra: {},
      dasha: { vimshottari: {}, char: {}, yogini: {} },
      reports: {
        ascendant: {},
        house: {},
        planet: {},
        natalChartInterpretation: {},
      },
      charts: {},
      ghatChakra: {},
    };

    // Define API requests based on sections
    const requests = [];

    if (sectionsToFetch.includes("basicDetails")) {
      requests.push({
        name: "birth_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/birth_details`,
        data: requestData,
      });
      requests.push({
        name: "ayanamsha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/ayanamsha`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("astroDetails")) {
      requests.push({
        name: "astro_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/astro_details`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("planetaryPositions")) {
      requests.push({
        name: "planets",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/planets`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("lalkitab")) {
      requests.push({
        name: "lalkitab_horoscope",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/lalkitab_horoscope`,
        data: requestData,
      });
      requests.push({
        name: "lalkitab_debts",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/lalkitab_debts`,
        data: requestData,
      });
      requests.push({
        name: "lalkitab_houses",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/lalkitab_houses`,
        data: requestData,
      });
      requests.push({
        name: "lalkitab_planets",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/lalkitab_planets`,
        data: requestData,
      });
      planets.forEach((planet) => {
        requests.push({
          name: `lalkitab_remedies_${planet}`,
          method: "post",
          url: `${ASTROLOGY_API_BASE_URL}/lalkitab_remedies/${planet}`,
          data: requestData,
        });
      });
    }

    if (sectionsToFetch.includes("varshaphal")) {
      requests.push({
        name: "varshaphal_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_details`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_planets",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_planets`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_muntha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_muntha`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_mudda_dasha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_mudda_dasha`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_panchavargeeya_bala",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_panchavargeeya_bala`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_harsha_bala",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_harsha_bala`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_saham_points",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_saham_points`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_yoga",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_yoga`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_year_chart",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_year_chart`,
        data: varshaphalRequestData,
      });
      requests.push({
        name: "varshaphal_month_chart",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/varshaphal_month_chart`,
        data: varshaphalRequestData,
      });
    }

    if (sectionsToFetch.includes("kpSystem")) {
      requests.push({
        name: "kp_planets",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kp_planets`,
        data: requestData,
      });
      requests.push({
        name: "kp_house_cusps",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kp_house_cusps`,
        data: requestData,
      });
      requests.push({
        name: "kp_birth_chart",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kp_birth_chart`,
        data: requestData,
      });
      requests.push({
        name: "kp_house_significator",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kp_house_significator`,
        data: requestData,
      });
      requests.push({
        name: "kp_planet_significator",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kp_planet_significator`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("panchang")) {
      requests.push({
        name: "basic_panchang",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/basic_panchang`,
        data: requestData,
      });
      requests.push({
        name: "advanced_panchang",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/advanced_panchang`,
        data: requestData,
      });
      requests.push({
        name: "hora_muhurta",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/hora_muhurta`,
        data: requestData,
      });
      requests.push({
        name: "chaughadiya_muhurta",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/chaughadiya_muhurta`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("ashtakvarga")) {
      planets.forEach((planet) => {
        requests.push({
          name: `planet_ashtak_${planet}`,
          method: "post",
          url: `${ASTROLOGY_API_BASE_URL}/planet_ashtak/${planet}`,
          data: requestData,
        });
      });
      requests.push({
        name: "sarvashtak",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/sarvashtak`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("dosha")) {
      requests.push({
        name: "kalsarpa_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/kalsarpa_details`,
        data: requestData,
      });
      requests.push({
        name: "manglik",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/manglik`,
        data: requestData,
      });
      requests.push({
        name: "sadhesati_current_status",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/sadhesati_current_status`,
        data: requestData,
      });
      requests.push({
        name: "sadhesati_life_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/sadhesati_life_details`,
        data: requestData,
      });
      requests.push({
        name: "pitra_dosha_report",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/pitra_dosha_report`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("remedies")) {
      planets.forEach((planet) => {
        requests.push({
          name: `lalkitab_remedies_${planet}`,
          method: "post",
          url: `${ASTROLOGY_API_BASE_URL}/lalkitab_remedies/${planet}`,
          data: requestData,
        });
      });
    }

    if (sectionsToFetch.includes("suggestions")) {
      requests.push({
        name: "basic_gem_suggestion",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/basic_gem_suggestion`,
        data: requestData,
      });
      requests.push({
        name: "rudraksha_suggestion",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/rudraksha_suggestion`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("numero")) {
      requests.push({
        name: "numero_table",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/numero_table`,
        data: requestData,
      });
      requests.push({
        name: "numero_report",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/numero_report`,
        data: requestData,
      });
      requests.push({
        name: "numero_prediction_daily",
        method: "post", // Changed to POST for consistency
        url: `${ASTROLOGY_API_BASE_URL}/numero_prediction/daily`,
        data: requestData, // Use data instead of params
      });
    }

    if (sectionsToFetch.includes("nakshatra")) {
      requests.push({
        name: "daily_nakshatra_prediction",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/daily_nakshatra_prediction`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("dasha")) {
      requests.push({
        name: "current_vdasha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/current_vdasha`,
        data: requestData,
      });
      requests.push({
        name: "current_chardasha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/current_chardasha`,
        data: requestData,
      });
      requests.push({
        name: "current_yogini_dasha",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/current_yogini_dasha`,
        data: requestData,
      });
    }

    if (sectionsToFetch.includes("reports")) {
      requests.push({
        name: "general_ascendant_report",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/general_ascendant_report`,
        data: requestData,
      });
      planets.forEach((planet) => {
        requests.push({
          name: `general_house_${planet}`,
          method: "post",
          url: `${ASTROLOGY_API_BASE_URL}/general_house_report/${planet}`,
          data: requestData,
        });
      });
    }

    if (sectionsToFetch.includes("charts")) {
      chartTypes.forEach((chartId) => {
        requests.push({
          name: `horo_chart_${chartId.toLowerCase()}`,
          method: "post",
          url: `${ASTROLOGY_API_BASE_URL}/horo_chart/${chartId}`,
          data: requestData,
        });
        requests.push({
          name: `horo_chart_image_${chartId.toLowerCase()}`,
          method: "post", // Changed to POST per API documentation
          url: `${ASTROLOGY_API_BASE_URL}/horo_chart_image/${chartId}`,
          data: requestData, // Use data instead of params
        });
      });
    }

    if (sectionsToFetch.includes("ghatChakra")) {
      requests.push({
        name: "ghat_chakra",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/ghat_chakra`,
        data: requestData,
      });
    }

    // Execute API requests
    const responses = await Promise.all(
      requests.map(async ({ name, method, url, data, params }) => {
        try {
          console.log(
            `Sending ${method.toUpperCase()} request to ${url} with ${
              method === "get" ? "params" : "data"
            }:`,
            JSON.stringify(method === "get" ? params : data, null, 2)
          );
          const response =
            method === "get"
              ? await axios.get(url, { headers, params })
              : await axios.post(url, data, { headers });
          console.log(`Success for ${name} (${url}):`, response.status);
          return { name, data: response.data };
        } catch (error) {
          console.error(
            `Error for ${name} (${url}):`,
            error.response?.status,
            error.response?.data?.msg || error.message,
            error.response?.data
          );
          return {
            name,
            data: null,
            error: error.response?.data || error.message,
          };
        }
      })
    );

    // Log failed requests
    const failedResponses = responses.filter((r) => r.error);
    if (failedResponses.length > 0) {
      console.warn(
        "Failed requests:",
        failedResponses.map((r) => `${r.name}: ${JSON.stringify(r.error)}`)
      );
    }

    // Map responses to kundliDetails
    responses.forEach(({ name, data }) => {
      if (!data) return; // Skip failed requests
      if (name === "birth_details")
        kundliDetails.basicDetails = { ...kundliDetails.basicDetails, ...data };
      if (name === "ayanamsha")
        kundliDetails.basicDetails.ayanamsha = data.ayanamsha || "Unknown";
      if (name === "astro_details") kundliDetails.astroDetails = data;
      if (name === "planets") {
        kundliDetails.planetaryPositions = data.map((planet) => ({
          name: planet.name,
          sign: planet.sign,
          degree: planet.fullDegree || "",
          house: planet.house || "",
          nakshatra: planet.nakshatra || "N/A",
          nakshatraLord: planet.nakshatra_lord || "N/A",
          isRetro: planet.isRetro || "false",
        }));
      }
      if (name === "lalkitab_horoscope")
        kundliDetails.lalkitab.horoscope = data;
      if (name === "lalkitab_debts") kundliDetails.lalkitab.debts = data;
      if (name === "lalkitab_houses") kundliDetails.lalkitab.houses = data;
      if (name === "lalkitab_planets") kundliDetails.lalkitab.planets = data;
      if (name.startsWith("lalkitab_remedies_")) {
        const planet = name.replace("lalkitab_remedies_", "");
        kundliDetails.lalkitab.remedies[planet] = data;
        kundliDetails.remedies.lalkitab[planet] = data;
      }
      if (name === "varshaphal_details")
        kundliDetails.varshaphal.details = data;
      if (name === "varshaphal_planets")
        kundliDetails.varshaphal.planets = data;
      if (name === "varshaphal_muntha") kundliDetails.varshaphal.muntha = data;
      if (name === "varshaphal_mudda_dasha")
        kundliDetails.varshaphal.muddaDasha = data;
      if (name === "varshaphal_panchavargeeya_bala")
        kundliDetails.varshaphal.panchavargeeya = data;
      if (name === "varshaphal_harsha_bala")
        kundliDetails.varshaphal.harshaBala = data;
      if (name === "varshaphal_saham_points")
        kundliDetails.varshaphal.sahamPoints = data;
      if (name === "varshaphal_yoga") kundliDetails.varshaphal.yoga = data;
      if (name === "varshaphal_year_chart")
        kundliDetails.varshaphal.yearChart = data;
      if (name === "varshaphal_month_chart")
        kundliDetails.varshaphal.monthChart = data;
      if (name === "kp_planets") kundliDetails.kpSystem.planets = data;
      if (name === "kp_house_cusps") kundliDetails.kpSystem.houseCusps = data;
      if (name === "kp_birth_chart") kundliDetails.kpSystem.birthChart = data;
      if (name === "kp_house_significator")
        kundliDetails.kpSystem.houseSignificator = data;
      if (name === "kp_planet_significator")
        kundliDetails.kpSystem.planetSignificator = data;
      if (name === "basic_panchang") kundliDetails.panchang.basic = data;
      if (name === "advanced_panchang") kundliDetails.panchang.advanced = data;
      if (name === "hora_muhurta") kundliDetails.panchang.horaMuhurta = data;
      if (name === "chaughadiya_muhurta")
        kundliDetails.panchang.chaughadiya = data;
      if (name.startsWith("planet_ashtak_")) {
        const planet = name.replace("planet_ashtak_", "");
        kundliDetails.ashtakvarga.planetAshtak[planet] = data;
      }
      if (name === "sarvashtak") kundliDetails.ashtakvarga.sarvashtak = data;
      if (name === "kalsarpa_details") kundliDetails.dosha.kalsarpa = data;
      if (name === "manglik") kundliDetails.dosha.manglik = data;
      if (name === "sadhesati_current_status")
        kundliDetails.dosha.sadhesati.currentStatus = data;
      if (name === "sadhesati_life_details")
        kundliDetails.dosha.sadhesati.lifeDetails = data;
      if (name === "pitra_dosha_report") kundliDetails.dosha.pitraDosha = data;
      if (name === "basic_gem_suggestion") kundliDetails.suggestions.gem = data;
      if (name === "rudraksha_suggestion")
        kundliDetails.suggestions.rudraksha = data;
      if (name === "numero_table") kundliDetails.numero.table = data;
      if (name === "numero_report") kundliDetails.numero.report = data;
      if (name === "numero_prediction_daily")
        kundliDetails.numero.dailyPrediction = data;
      if (name === "daily_nakshatra_prediction")
        kundliDetails.nakshatra.dailyPrediction = data;
      if (name === "current_vdasha")
        kundliDetails.dasha.vimshottari = { current: data };
      if (name === "current_chardasha")
        kundliDetails.dasha.char = { current: data };
      if (name === "current_yogini_dasha")
        kundliDetails.dasha.yogini = { current: data };
      if (name === "general_ascendant_report") {
        kundliDetails.reports.ascendant = {
          sign:
            data.asc_report?.ascendant ||
            kundliDetails.planetaryPositions?.find(
              (p) => p.name === "Ascendant"
            )?.sign ||
            "Unknown",
          characteristics: data.asc_report?.report || "No report available",
        };
      }
      if (name.startsWith("general_house_")) {
        const planet = name.replace("general_house_", "");
        kundliDetails.reports.house[planet] = data;
      }
      if (name.startsWith("horo_chart_")) {
        const chartId = name.replace("horo_chart_", "").toUpperCase();
        kundliDetails.charts[chartId.toLowerCase()] = data;
      }
      if (name.startsWith("horo_chart_image_")) {
        const chartId = name.replace("horo_chart_image_", "").toUpperCase();
        kundliDetails.charts[`${chartId.toLowerCase()}Image`] = data;
      }
      if (name === "ghat_chakra") kundliDetails.ghatChakra = data;
    });

    // Finalize basicDetails
    kundliDetails.basicDetails = {
      name,
      dob,
      tob,
      place,
      latitude: lat,
      longitude: lon,
      timezone: tz,
      gender: gender.toLowerCase(),
      ascendant:
        kundliDetails.basicDetails.ascendant ||
        kundliDetails.planetaryPositions?.find((p) => p.name === "Ascendant")
          ?.sign ||
        "Unknown",
      moonSign:
        kundliDetails.basicDetails.moon_sign ||
        kundliDetails.planetaryPositions?.find((p) => p.name === "Moon")
          ?.sign ||
        "Unknown",
      sunSign:
        kundliDetails.basicDetails.sun_sign ||
        kundliDetails.planetaryPositions?.find((p) => p.name === "Sun")?.sign ||
        "Unknown",
      sunrise: kundliDetails.basicDetails.sunrise || "Unknown",
      sunset: kundliDetails.basicDetails.sunset || "Unknown",
      ayanamsha: kundliDetails.basicDetails.ayanamsha || "Unknown",
    };

    // If there were failed requests, include a warning in the response
    if (failedResponses.length > 0) {
      res.status(200).json({
        status: true,
        message: "Kundli details fetched with some errors",
        errors: failedResponses.map((r) => ({
          endpoint: r.name,
          error: r.error,
        })),
        data: kundliDetails,
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Kundli details fetched successfully",
        data: kundliDetails,
      });
    }
  } catch (error) {
    console.error("AstrologyAPI error:", error.message, error.stack);
    return next(
      new AppError(
        `Failed to fetch Kundli details: ${error.message}`,
        error.response?.status || 500
      ),
      { status: false }
    );
  }
});

exports.matchKundli = catchAsync(async (req, res, next) => {
  const {
    maleDetails,
    femaleDetails,
    language = "en", // Default to English
  } = req.body;

  // Validate input structure
  if (!maleDetails || !femaleDetails) {
    return next(
      new AppError("Male and female birth details are required", 400),
      { status: false }
    );
  }

  // Validate individual details
  const requiredFields = [
    "name",
    "dob",
    "tob",
    "place",
    "latitude",
    "longitude",
    "gender",
  ];
  for (const details of [maleDetails, femaleDetails]) {
    for (const field of requiredFields) {
      if (!details[field]) {
        return next(
          new AppError(
            `Missing ${field} in ${
              details === maleDetails ? "male" : "female"
            } details`,
            400
          ),
          { status: false }
        );
      }
    }
  }

  // Validate gender
  if (
    maleDetails.gender.toLowerCase() !== "male" ||
    femaleDetails.gender.toLowerCase() !== "female"
  ) {
    return next(
      new AppError(
        'Male gender must be "male" and female gender must be "female"',
        400
      ),
      { status: false }
    );
  }

  // Validate DOB format (YYYY-MM-DD)
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const details of [maleDetails, femaleDetails]) {
    if (!dobRegex.test(details.dob)) {
      return next(
        new AppError(
          `Invalid DOB format for ${details.name}. Use YYYY-MM-DD`,
          400
        ),
        { status: false }
      );
    }
  }

  // Validate TOB format (HH:MM)
  const tobRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const details of [maleDetails, femaleDetails]) {
    if (!tobRegex.test(details.tob)) {
      return next(
        new AppError(
          `Invalid TOB format for ${details.name}. Use HH:MM (24-hour)`,
          400
        ),
        { status: false }
      );
    }
  }

  // Validate latitude (-90 to 90) and longitude (-180 to 180)
  for (const details of [maleDetails, femaleDetails]) {
    const lat = parseFloat(details.latitude);
    const lon = parseFloat(details.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return next(
        new AppError(
          `Invalid latitude for ${details.name}. Must be between -90 and 90`,
          400
        ),
        { status: false }
      );
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return next(
        new AppError(
          `Invalid longitude for ${details.name}. Must be between -180 and 180`,
          400
        ),
        { status: false }
      );
    }
  }

  // Validate language
  const validLanguages = ["en", "hi"];
  if (!validLanguages.includes(language.toLowerCase())) {
    return next(new AppError("Invalid language. Use en or hi", 400), {
      status: false,
    });
  }

  // Extract and validate birth details
  const prepareBirthData = (details) => {
    const [year, month, day] = details.dob.split("-").map(Number);
    const [hour, minute] = details.tob.split(":").map(Number);
    const latitude = parseFloat(details.latitude);
    const longitude = parseFloat(details.longitude);
    const timezone = parseFloat(details.timezone || 5.5); // Default to IST

    // Validate numeric values
    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2100 ||
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59 ||
      isNaN(timezone) ||
      timezone < -12 ||
      timezone > 14
    ) {
      return next(
        new AppError(`Invalid birth details for ${details.name}`, 400),
        { status: false }
      );
    }

    return {
      day,
      month,
      year,
      hour,
      min: minute,
      lat: latitude,
      lon: longitude,
      tzone: timezone,
      language: language.toLowerCase(),
    };
  };

  const maleData = prepareBirthData(maleDetails);
  const femaleData = prepareBirthData(femaleDetails);

  // Prepare authorization header
  const authString = Buffer.from(
    `${process.env.ASTROLOGY_API_USER_ID}:${process.env.ASTROLOGY_API_KEY}`
  ).toString("base64");
  const headers = {
    Authorization: `Basic ${authString}`,
    "Content-Type": "application/json",
  };

  try {
    // Initialize match result
    const matchResult = {
      gunaMilan: {
        score: 0,
        maxScore: 36,
        minimumRequired: 18,
        details: {
          varna: {
            points: 0,
            max: 1,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          vashya: {
            points: 0,
            max: 2,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          tara: {
            points: 0,
            max: 3,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          yoni: {
            points: 0,
            max: 4,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          maitri: {
            points: 0,
            max: 5,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          gan: {
            points: 0,
            max: 6,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          bhakut: {
            points: 0,
            max: 7,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
          nadi: {
            points: 0,
            max: 8,
            description: "",
            maleAttribute: "",
            femaleAttribute: "",
          },
        },
        conclusion: "",
      },
      doshaAnalysis: {
        manglik: { malePercentage: 0, femalePercentage: 0, compatibility: "" },
        nadi: { present: false, impact: "", remedy: "" },
        bhakut: { present: false, impact: "", remedy: "" },
        rajju: { present: false, impact: "", remedy: "" },
        vedha: { present: false, impact: "", remedy: "" },
      },
      compatibility: {
        mental: "",
        emotional: "",
        financial: "",
        physical: "",
        overall: "",
      },
      remedies: [],
      charts: {
        male: { d1: null, d1Image: null },
        female: { d1: null, d1Image: null },
      },
      overallConclusion: "",
    };

    // Define API requests
    const requests = [
      {
        name: "match_making_detailed",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/match_making_detailed_report`,
        data: {
          m_day: maleData.day,
          m_month: maleData.month,
          m_year: maleData.year,
          m_hour: maleData.hour,
          m_min: maleData.min,
          m_lat: maleData.lat,
          m_lon: maleData.lon,
          m_tzone: maleData.tzone,
          f_day: femaleData.day,
          f_month: femaleData.month,
          f_year: femaleData.year,
          f_hour: femaleData.hour,
          f_min: femaleData.min,
          f_lat: femaleData.lat,
          f_lon: femaleData.lon,
          f_tzone: femaleData.tzone,
          language: maleData.language,
        },
      },
      {
        name: "male_astro_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/astro_details`,
        data: maleData,
      },
      {
        name: "female_astro_details",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/astro_details`,
        data: femaleData,
      },
      {
        name: "male_chart_d1",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/horo_chart/D1`,
        data: maleData,
      },
      {
        name: "male_chart_image_d1",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/horo_chart_image/D1`,
        data: {
          ...maleData,
          planetColor: "#ff0000",
          signColor: "#00ff00",
          lineColor: "#0000ff",
          chartType: "north",
        },
      },
      {
        name: "female_chart_d1",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/horo_chart/D1`,
        data: femaleData,
      },
      {
        name: "female_chart_image_d1",
        method: "post",
        url: `${ASTROLOGY_API_BASE_URL}/horo_chart_image/D1`,
        data: {
          ...femaleData,
          planetColor: "#ff0000",
          signColor: "#00ff00",
          lineColor: "#0000ff",
          chartType: "north",
        },
      },
    ];

    // Execute API requests
    const responses = await Promise.all(
      requests.map(async ({ name, method, url, data }) => {
        try {
          console.log(
            `Sending POST request to ${url} with data:`,
            JSON.stringify(data, null, 2)
          );
          const response = await axios.post(url, data, { headers });
          console.log(`Success for ${name} (${url}):`, response.status);
          console.log(
            `Response for ${name}:`,
            JSON.stringify(response.data, null, 2)
          ); // Log response for debugging
          return { name, data: response.data };
        } catch (error) {
          console.error(
            `Error for ${name} (${url}):`,
            error.response?.status,
            error.response?.data?.msg || error.message,
            error.response?.data
          );
          return {
            name,
            data: null,
            error: error.response?.data || error.message,
          };
        }
      })
    );

    // Log failed requests
    const failedResponses = responses.filter((r) => r.error);
    if (failedResponses.length > 0) {
      console.warn(
        "Failed requests:",
        failedResponses.map((r) => `${r.name}: ${JSON.stringify(r.error)}`)
      );
    }

    // Initialize Rashi variables
    let maleRashi = "Unknown";
    let femaleRashi = "Unknown";

    // Map responses to matchResult and extract Rashi
    responses.forEach(({ name, data }) => {
      if (!data) return; // Skip failed requests
      if (name === "match_making_detailed") {
        // Ashtakoota Guna Milan
        const ashtakoota = data.ashtakoota || {};
        matchResult.gunaMilan.score = ashtakoota.total?.received_points || 0;
        matchResult.gunaMilan.details = {
          varna: {
            points: ashtakoota.varna?.received_points || 0,
            max: ashtakoota.varna?.total_points || 1,
            description: ashtakoota.varna?.description || "",
            maleAttribute: ashtakoota.varna?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.varna?.female_koot_attribute || "",
          },
          vashya: {
            points: ashtakoota.vashya?.received_points || 0,
            max: ashtakoota.vashya?.total_points || 2,
            description: ashtakoota.vashya?.description || "",
            maleAttribute: ashtakoota.vashya?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.vashya?.female_koot_attribute || "",
          },
          tara: {
            points: ashtakoota.tara?.received_points || 0,
            max: ashtakoota.tara?.total_points || 3,
            description: ashtakoota.tara?.description || "",
            maleAttribute: ashtakoota.tara?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.tara?.female_koot_attribute || "",
          },
          yoni: {
            points: ashtakoota.yoni?.received_points || 0,
            max: ashtakoota.yoni?.total_points || 4,
            description: ashtakoota.yoni?.description || "",
            maleAttribute: ashtakoota.yoni?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.yoni?.female_koot_attribute || "",
          },
          maitri: {
            points: ashtakoota.maitri?.received_points || 0,
            max: ashtakoota.maitri?.total_points || 5,
            description: ashtakoota.maitri?.description || "",
            maleAttribute: ashtakoota.maitri?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.maitri?.female_koot_attribute || "",
          },
          gan: {
            points: ashtakoota.gan?.received_points || 0,
            max: ashtakoota.gan?.total_points || 6,
            description: ashtakoota.gan?.description || "",
            maleAttribute: ashtakoota.gan?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.gan?.female_koot_attribute || "",
          },
          bhakut: {
            points: ashtakoota.bhakut?.received_points || 0,
            max: ashtakoota.bhakut?.total_points || 7,
            description: ashtakoota.bhakut?.description || "",
            maleAttribute: ashtakoota.bhakut?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.bhakut?.female_koot_attribute || "",
          },
          nadi: {
            points: ashtakoota.nadi?.received_points || 0,
            max: ashtakoota.nadi?.total_points || 8,
            description: ashtakoota.nadi?.description || "",
            maleAttribute: ashtakoota.nadi?.male_koot_attribute || "",
            femaleAttribute: ashtakoota.nadi?.female_koot_attribute || "",
          },
        };
        matchResult.gunaMilan.conclusion = ashtakoota.conclusion?.report || "";

        // Dosha Analysis
        matchResult.doshaAnalysis.manglik = {
          malePercentage: data.manglik?.male_percentage || 0,
          femalePercentage: data.manglik?.female_percentage || 0,
          compatibility: data.manglik?.status
            ? "Manglik influence present; compatibility depends on remedies."
            : "No significant Manglik influence.",
        };
        matchResult.doshaAnalysis.nadi = {
          present: ashtakoota.nadi?.received_points === 0,
          impact:
            ashtakoota.nadi?.received_points === 0
              ? "Potential health or fertility issues"
              : "No significant impact",
          remedy:
            ashtakoota.nadi?.received_points === 0
              ? "Perform Nadi Nivarana Puja or consult an astrologer."
              : "",
        };
        matchResult.doshaAnalysis.bhakut = {
          present: ashtakoota.bhakut?.received_points === 0,
          impact:
            ashtakoota.bhakut?.received_points === 0
              ? "Possible emotional or financial discord"
              : "No significant impact",
          remedy:
            ashtakoota.bhakut?.received_points === 0
              ? "Perform Bhakoot Shanti Puja or seek astrological guidance."
              : "",
        };
        matchResult.doshaAnalysis.rajju = {
          present: data.rajju_dosha?.status || false,
          impact: data.rajju_dosha?.status
            ? "May affect longevity or marital stability"
            : "No significant impact",
          remedy: data.rajju_dosha?.status
            ? "Consult an astrologer for Rajju Dosha remedies."
            : "",
        };
        matchResult.doshaAnalysis.vedha = {
          present: data.vedha_dosha?.status || false,
          impact: data.vedha_dosha?.status
            ? "Possible obstacles in relationship"
            : "No significant impact",
          remedy: data.vedha_dosha?.status
            ? "Perform Vedha Dosha remedies or seek astrological guidance."
            : "",
        };

        // Compatibility Insights
        matchResult.compatibility = {
          mental:
            ashtakoota.maitri?.received_points >= 4
              ? "High mental compatibility"
              : "Moderate to low mental compatibility",
          emotional:
            ashtakoota.bhakut?.received_points >= 5
              ? "Strong emotional bond"
              : "Potential emotional challenges",
          financial:
            ashtakoota.bhakut?.received_points >= 5
              ? "Good financial harmony"
              : "Possible financial disagreements",
          physical:
            ashtakoota.yoni?.received_points >= 3
              ? "Good physical compatibility"
              : "Moderate physical compatibility",
          overall:
            ashtakoota.total?.received_points >= 18
              ? "Favorable match"
              : "Consult astrologer for remedies",
        };

        // Remedies
        if (
          ashtakoota.total?.received_points < 18 ||
          ashtakoota.nadi?.received_points === 0 ||
          ashtakoota.bhakut?.received_points === 0 ||
          data.rajju_dosha?.status ||
          data.vedha_dosha?.status ||
          data.manglik?.status
        ) {
          matchResult.remedies.push(
            "Consult an astrologer for detailed remedies, such as puja, gemstone recommendations, or specific rituals."
          );
        }
        if (data.manglik?.status) {
          matchResult.remedies.push(
            "Perform Manglik Dosha remedies (e.g., Kumbh Vivah or Mars puja) for affected partner(s)."
          );
        }

        // Overall Conclusion
        matchResult.overallConclusion = data.conclusion?.match_report || "";
      }
      if (name === "male_astro_details") {
        maleRashi = data.moon_sign || data.sign || "Unknown";
      }
      if (name === "female_astro_details") {
        femaleRashi = data.moon_sign || data.sign || "Unknown";
      }
      if (name === "male_chart_d1") {
        matchResult.charts.male.d1 = data;
      }
      if (name === "male_chart_image_d1") {
        matchResult.charts.male.d1Image = data;
      }
      if (name === "female_chart_d1") {
        matchResult.charts.female.d1 = data;
      }
      if (name === "female_chart_image_d1") {
        matchResult.charts.female.d1Image = data;
      }
    });

    // Send response
    if (failedResponses.length > 0) {
      res.status(200).json({
        status: true,
        message: "Kundli matching completed with some errors",
        errors: failedResponses.map((r) => ({
          endpoint: r.name,
          error: r.error,
        })),
        data: {
          maleDetails: {
            name: maleDetails.name,
            ...maleData,
            rashi: maleRashi,
          },
          femaleDetails: {
            name: femaleDetails.name,
            ...femaleData,
            rashi: femaleRashi,
          },
          matchResult,
        },
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Kundli matching completed successfully",
        data: {
          maleDetails: {
            name: maleDetails.name,
            ...maleData,
            rashi: maleRashi,
          },
          femaleDetails: {
            name: femaleDetails.name,
            ...femaleData,
            rashi: femaleRashi,
          },
          matchResult,
        },
      });
    }
  } catch (error) {
    console.error("Kundli Matching API error:", error.message, error.stack);
    return next(
      new AppError(
        `Failed to perform Kundli matching: ${error.message}`,
        error.response?.status || 500
      ),
      { status: false }
    );
  }
});
