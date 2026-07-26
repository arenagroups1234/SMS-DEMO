/**
 * Central API Service Layer
 * Connects Frontend to FastAPI Backend (SQLite)
 * Base URL: http://localhost:5000/api
 */

const BASE_URL = "http://localhost:5000/api";



// ─── Core Fetch Wrapper ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  return mockApiResolver(endpoint, options);
}

// ─── FormData Fetch Wrapper for Generic CRUD Routers ──────────
async function apiFetchForm(endpoint, options = {}) {
  const headers = { ...options.headers };
  delete headers["Content-Type"]; // Allow browser to set boundary

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    const formData = new FormData();
    for (const key in body) {
      if (body[key] !== undefined && body[key] !== null) {
        formData.append(key, body[key]);
      }
    }
    body = formData;
  }

  return apiFetch(endpoint, {
    ...options,
    headers,
    body,
  });
}

// ─── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  me: () => apiFetch("/auth/me"),

  changePassword: (currentPassword, newPassword) =>
    apiFetch("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── SCHOOLS ──────────────────────────────────────────────────
export const schoolsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/schools${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => apiFetch(`/schools/${id}`),

  create: (data) =>
    apiFetch("/schools", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiFetch(`/schools/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/schools/${id}`, { method: "DELETE" }),

  updateSubscription: (id, planData) =>
    apiFetch(`/schools/${id}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(planData),
    }),
};

// ─── USERS ────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/users${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => apiFetch(`/users/${id}`),

  create: (data) =>
    apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id, isActive) =>
    apiFetch(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),

  delete: (id) =>
    apiFetch(`/users/${id}`, { method: "DELETE" }),
};

// ─── PLANS ────────────────────────────────────────────────────
export const plansApi = {
  getAll: () => apiFetch("/plans"),
  getById: (id) => apiFetch(`/plans/${id}`),
  create: (data) =>
    apiFetch("/plans", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) =>
    apiFetch(`/plans/${id}`, { method: "DELETE" }),
};

// ─── DASHBOARD ────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => apiFetch("/dashboard/stats"),
  getRecentActivity: (limit = 5) =>
    apiFetch(`/dashboard/recent-activity?limit=${limit}`),
};

// ─── NOTICES ──────────────────────────────────────────────────
export const noticesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/notices${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/notices/${id}`),
  create: (data) =>
    apiFetchForm("/notices", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/notices/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/notices/${id}`, { method: "DELETE" }),
};

// ─── EVENTS ───────────────────────────────────────────────────
export const eventsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/events${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/events/${id}`),
  create: (data) =>
    apiFetchForm("/events", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/events/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/events/${id}`, { method: "DELETE" }),
};

// ─── GALLERY ──────────────────────────────────────────────────
export const galleryApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/gallery${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/gallery", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/gallery/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/gallery/${id}`, { method: "DELETE" }),
};

// ─── ADMISSIONS ───────────────────────────────────────────────
export const admissionsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/admissions${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/admissions/${id}`),
  create: (data) =>
    apiFetchForm("/admissions", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/admissions/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/admissions/${id}`, { method: "DELETE" }),
};

// ─── CONTACTS ─────────────────────────────────────────────────
export const contactsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/contacts${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/contacts", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/contacts/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/contacts/${id}`, { method: "DELETE" }),
};

// ─── FACULTY ──────────────────────────────────────────────────
export const facultyApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/faculty${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/faculty", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/faculty/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/faculty/${id}`, { method: "DELETE" }),
};

// ─── NEWS ─────────────────────────────────────────────────────
export const newsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/news${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/news", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/news/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/news/${id}`, { method: "DELETE" }),
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
export const achievementsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/achievements${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/achievements", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/achievements/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/achievements/${id}`, { method: "DELETE" }),
};

// ─── ALUMNI ───────────────────────────────────────────────────
export const alumniApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/alumni${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/alumni", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/alumni/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/alumni/${id}`, { method: "DELETE" }),
};

// ─── CAREERS ──────────────────────────────────────────────────
export const careersApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/careers${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/careers", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/careers/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/careers/${id}`, { method: "DELETE" }),
};

// ─── TESTIMONIALS ─────────────────────────────────────────────
export const testimonialsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/testimonials${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/testimonials", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/testimonials/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/testimonials/${id}`, { method: "DELETE" }),
};

// ─── DOWNLOADS ────────────────────────────────────────────────
export const downloadsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/downloads${qs ? `?${qs}` : ""}`);
  },
  create: (data) =>
    apiFetchForm("/downloads", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/downloads/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/downloads/${id}`, { method: "DELETE" }),
};

// ─── CLASSES ──────────────────────────────────────────────────
export const classesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/classes${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/classes/${id}`),
  create: (data) =>
    apiFetchForm("/classes", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/classes/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/classes/${id}`, { method: "DELETE" }),
};

// ─── SUBJECTS ─────────────────────────────────────────────────
export const subjectsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/subjects${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/subjects/${id}`),
  create: (data) =>
    apiFetchForm("/subjects", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/subjects/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/subjects/${id}`, { method: "DELETE" }),
};

// ─── EXAMS ────────────────────────────────────────────────────
export const examsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/exams${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/exams/${id}`),
  create: (data) =>
    apiFetchForm("/exams", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/exams/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/exams/${id}`, { method: "DELETE" }),
};

// ─── FEES ─────────────────────────────────────────────────────
export const feesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/fees${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/fees/${id}`),
  create: (data) =>
    apiFetchForm("/fees", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/fees/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/fees/${id}`, { method: "DELETE" }),
  checkNotifications: () =>
    apiFetch("/fees/check-notifications", { method: "POST" }),
};

// ─── ATTENDANCES ──────────────────────────────────────────────
export const attendanceApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/attendances${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/attendances/${id}`),
  create: (data) =>
    apiFetchForm("/attendances", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/attendances/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/attendances/${id}`, { method: "DELETE" }),
};

// ─── HOMEWORKS ────────────────────────────────────────────────
export const homeworkApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/homeworks${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/homeworks/${id}`),
  create: (data) =>
    apiFetchForm("/homeworks", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/homeworks/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/homeworks/${id}`, { method: "DELETE" }),
};

// ─── ASSIGNMENTS ──────────────────────────────────────────────
export const assignmentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/assignments${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/assignments/${id}`),
  create: (data) =>
    apiFetchForm("/assignments", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/assignments/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/assignments/${id}`, { method: "DELETE" }),
};

// ─── EXAM MARKS ───────────────────────────────────────────────
export const examMarksApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/exam_marks${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/exam_marks/${id}`),
  create: (data) =>
    apiFetchForm("/exam_marks", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/exam_marks/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/exam_marks/${id}`, { method: "DELETE" }),
};

// ─── TIMETABLES ───────────────────────────────────────────────
export const timetableApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/timetables${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/timetables/${id}`),
  create: (data) =>
    apiFetchForm("/timetables", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/timetables/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/timetables/${id}`, { method: "DELETE" }),
};

// ─── BOOK CATEGORIES ──────────────────────────────────────────
export const bookCategoriesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/book_categories${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/book_categories/${id}`),
  create: (data) =>
    apiFetchForm("/book_categories", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/book_categories/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/book_categories/${id}`, { method: "DELETE" }),
};

// ─── BOOKS ────────────────────────────────────────────────────
export const booksApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/books${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/books/${id}`),
  create: (data) =>
    apiFetchForm("/books", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/books/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/books/${id}`, { method: "DELETE" }),
};



// ─── ISSUED BOOKS ─────────────────────────────────────────────
export const issuedBooksApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/issued-books${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/issued-books/${id}`),
  create: (data) =>
    apiFetch("/issued-books", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/issued-books/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/issued-books/${id}`, { method: "DELETE" }),
};

// ─── BUSES & LIVE SYSTEM ──────────────────────────────────────
export const busesApi = {
  getAll: () => apiFetch("/buses"),
  create: (data) => apiFetch("/buses", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/buses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/buses/${id}`, { method: "DELETE" }),
  
  getDrivers: () => apiFetch("/buses/drivers"),
  createDriver: (data) => apiFetch("/buses/drivers", { method: "POST", body: JSON.stringify(data) }),
  updateDriver: (id, data) => apiFetch(`/buses/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDriver: (id) => apiFetch(`/buses/drivers/${id}`, { method: "DELETE" }),
  
  getStudents: () => apiFetch("/buses/students"),
  assignStudent: (studentId, busId) => apiFetch("/buses/students/assign", { method: "POST", body: JSON.stringify({ studentId, busId }) }),
  
  getLive: () => apiFetch("/buses/live"),
  startTrip: () => apiFetch("/buses/trip/start", { method: "POST" }),
  endTrip: () => apiFetch("/buses/trip/end", { method: "POST" }),
  updateLocation: (latitude, longitude, speed) => apiFetch("/buses/trip/location", { method: "POST", body: JSON.stringify({ latitude, longitude, speed }) }),

  // ── Bus Stops ──
  getStops: (busId) => apiFetch(`/buses/${busId}/stops`),
  createStop: (busId, data) => apiFetch(`/buses/${busId}/stops`, { method: "POST", body: JSON.stringify(data) }),
  updateStop: (stopId, data) => apiFetch(`/buses/stops/${stopId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStop: (stopId) => apiFetch(`/buses/stops/${stopId}`, { method: "DELETE" }),

  // ── Bus Leave ──
  markLeave: (data) => apiFetch("/buses/leave", { method: "POST", body: JSON.stringify(data) }),
  cancelLeave: (leaveId) => apiFetch(`/buses/leave/${leaveId}`, { method: "DELETE" }),
  getTodayLeaves: () => apiFetch("/buses/leave/today"),
  getStudentLeaves: (studentId) => apiFetch(`/buses/leave/student/${studentId}`),
  emulateDriver: (driverId) => apiFetch(`/auth/emulate-driver/${driverId}`, { method: "POST" })
};

export const biometricsApi = {
  getDevices: () => apiFetch("/biometrics/devices"),
  createDevice: (data) => apiFetch("/biometrics/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDevice: (id, data) => apiFetch(`/biometrics/devices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDevice: (id) => apiFetch(`/biometrics/devices/${id}`, { method: "DELETE" }),
  enroll: (data) => apiFetch("/biometrics/enroll", { method: "POST", body: JSON.stringify(data) }),
  logEvent: (params) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/biometrics/log-event?${qs}`, { method: "POST" });
  }
};

// ─── Utility: Map backend school → frontend school format ─────
export function mapSchoolFromBackend(s) {
  const formatIsoDate = (val) => {
    if (!val) return "";
    return String(val).trim().split("T")[0].split(" ")[0];
  };
  const planStorageDefaults = {
    "chek limit": "1 GB",
    "basic": "100 GB",
    "premium": "100 GB"
  };
  const planNameLower = (s.planName || "").toLowerCase();
  const defaultStorageLimit = planStorageDefaults[planNameLower] || "100 GB";
  let finalStorageLimit = s.storageLimit || defaultStorageLimit;
  if (finalStorageLimit === "1" || finalStorageLimit === 1) {
    finalStorageLimit = "1 GB";
  } else if (finalStorageLimit === "100" || finalStorageLimit === 100) {
    finalStorageLimit = "100 GB";
  }

  return {
    id: s.id,
    schoolId: s.schoolId,
    name: s.name,
    email: s.email,
    phone: s.phone || "",
    address: s.address || "",
    location: s.city || "",
    city: s.city || "",
    state: s.state || "",
    zipCode: s.zipCode || "",
    principalName: s.principalName || "",
    ownerName: s.ownerName || "",
    teachers: s.totalTeachers || s.teachers || 0,
    students: s.totalStudents || s.students || 0,
    planName: s.planName || "",
    status: s.subscriptionStatus || s.status || "Unpaid",
    amount: s.subscriptionAmount || s.amount || 0,
    startDate: formatIsoDate(s.startDate || s.subscriptionStart),
    endDate: formatIsoDate(s.endDate || s.subscriptionEnd),
    storageUsage: s.storageUsage || 0,
    storageLimit: finalStorageLimit,
    isActive: s.isActive,
  };
}

export function mapSchoolToBackend(s) {
  return {
    name: s.name,
    email: s.email,
    phone: s.phone || null,
    address: s.address || null,
    city: s.location || s.city || null,
    state: s.state || null,
    zipCode: s.zipCode || null,
    principalName: s.principalName || null,
    ownerName: s.ownerName || null,
    totalStudents: s.students || 0,
    totalTeachers: s.teachers || 0,
    planName: s.planName || null,
    subscriptionStatus: s.status || "Unpaid",
    subscriptionAmount: s.amount || 0,
    subscriptionStart: s.startDate || null,
    subscriptionEnd: s.endDate || null,
    startDate: s.startDate || null,
    endDate: s.endDate || null,
  };
}

export const hostelsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostels${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostels/${id}`),
  create: (data) =>
    apiFetch("/hostels", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostels/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/hostels/${id}`, { method: "DELETE" }),
};

export const hostelRoomsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-rooms${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-rooms/${id}`),
  create: (data) =>
    apiFetch("/hostel-rooms", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-rooms/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-rooms/${id}`, { method: "DELETE" }),
};

export const hostelAllotmentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-allotments${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-allotments/${id}`),
  create: (data) =>
    apiFetch("/hostel-allotments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-allotments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-allotments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-allotments/${id}`, { method: "DELETE" }),
};

export const hostelStudentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-students${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-students/${id}`),
  create: (data) =>
    apiFetchForm("/hostel-students", { method: "POST", body: data }),
  update: (id, data) =>
    apiFetchForm(`/hostel-students/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiFetch(`/hostel-students/${id}`, { method: "DELETE" }),
};

export const hostelOutingsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-outings${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-outings/${id}`),
  create: (data) =>
    apiFetch("/hostel-outings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-outings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-outings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-outings/${id}`, { method: "DELETE" }),
};

export const hostelLeavesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-leaves${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-leaves/${id}`),
  create: (data) =>
    apiFetch("/hostel-leaves", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-leaves/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-leaves/${id}`, { method: "DELETE" }),
};

export const hostelAssetsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-assets${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-assets/${id}`),
  create: (data) =>
    apiFetch("/hostel-assets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/hostel-assets/${id}`, { method: "DELETE" }),
};

export const hostelDamagesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-damages${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-damages/${id}`),
  create: (data) =>
    apiFetch("/hostel-damages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-damages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-damages/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-damages/${id}`, { method: "DELETE" }),
};

export const hostelMaintenanceApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-maintenance${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-maintenance/${id}`),
  create: (data) =>
    apiFetch("/hostel-maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-maintenance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-maintenance/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-maintenance/${id}`, { method: "DELETE" }),
};

export const hostelVisitorsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-visitors${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-visitors/${id}`),
  create: (data) =>
    apiFetch("/hostel-visitors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-visitors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-visitors/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-visitors/${id}`, { method: "DELETE" }),
};

export const hostelPaymentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-payments${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-payments/${id}`),
  create: (data) =>
    apiFetch("/hostel-payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-payments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-payments/${id}`, { method: "DELETE" }),
};

export const hostelAttendanceApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-attendance${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-attendance/${id}`),
  create: (data) =>
    apiFetch("/hostel-attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/hostel-attendance/${id}`, { method: "DELETE" }),
};

export const hostelDefaultersApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-defaulters${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-defaulters/${id}`),
  create: (data) =>
    apiFetch("/hostel-defaulters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-defaulters/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/hostel-defaulters/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id) => apiFetch(`/hostel-defaulters/${id}`, { method: "DELETE" }),
};

export const hostelInventoryApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-assets${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-assets/${id}`),
  create: (data) =>
    apiFetch("/hostel-assets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/hostel-assets/${id}`, { method: "DELETE" }),
};


export const hostelAccountsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/hostel-accounts${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/hostel-accounts/${id}`),
  create: (data) =>
    apiFetch("/hostel-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/hostel-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/hostel-accounts/${id}`, { method: "DELETE" }),
};


export default apiFetch;


// ─────────────────────────────────────────────────────────────
// RICH 5x5 COMPLETE MODULE DATASETS FOR ALL PAGES
// ─────────────────────────────────────────────────────────────

const DUMMY_SCHOOLS = [
  { id: "school-1", schoolId: "school-1", name: "St. Xavier's International School", email: "info@stxaviers.edu", phone: "+91 98290 12345", address: "101 Knowledge Park, Subhash Nagar", city: "Udaipur", state: "Rajasthan", zipCode: "313001", principalName: "Dr. R. K. Varma", ownerName: "St. Xavier Educational Trust", teachers: 5, students: 5, planName: "Enterprise Plan", status: "Paid", amount: 49999, startDate: "2026-01-01", endDate: "2027-01-01", storageLimit: "500 GB", storageUsage: 12.5, isActive: true },
  { id: "school-2", schoolId: "school-2", name: "Delhi Public School", email: "admin@dpsjaipur.edu", phone: "+91 98290 54321", address: "Sector 5, Malviya Nagar", city: "Jaipur", state: "Rajasthan", zipCode: "302017", principalName: "Mrs. Sunita Kapoor", ownerName: "DPS Society", teachers: 5, students: 5, planName: "Premium Plan", status: "Paid", amount: 24999, startDate: "2026-02-01", endDate: "2027-02-01", storageLimit: "250 GB", storageUsage: 8.2, isActive: true },
  { id: "school-3", schoolId: "school-3", name: "Greenwood High World School", email: "contact@greenwood.edu", phone: "+91 98800 11223", address: "88 Sarjapur Road", city: "Bengaluru", state: "Karnataka", zipCode: "560035", principalName: "Prof. S. Natesan", ownerName: "Greenwood Trust", teachers: 5, students: 5, planName: "Standard Plan", status: "Paid", amount: 14999, startDate: "2026-03-01", endDate: "2027-03-01", storageLimit: "100 GB", storageUsage: 5.1, isActive: true },
  { id: "school-4", schoolId: "school-4", name: "Apex International Academy", email: "admissions@apexacademy.edu", phone: "+91 97555 44332", address: "45 Vijay Nagar Square", city: "Indore", state: "Madhya Pradesh", zipCode: "452010", principalName: "Dr. Meenakshi Joshi", ownerName: "Apex Educational Group", teachers: 5, students: 5, planName: "Basic Plan", status: "Paid", amount: 9999, startDate: "2026-04-01", endDate: "2027-04-01", storageLimit: "50 GB", storageUsage: 3.4, isActive: true },
  { id: "school-5", schoolId: "school-5", name: "Heritage Global School", email: "office@heritageglobal.edu", phone: "+91 98140 99887", address: "12 Sector 17-C", city: "Chandigarh", state: "Punjab", zipCode: "160017", principalName: "Mr. Gurmeet Singh", ownerName: "Heritage Foundation", teachers: 5, students: 5, planName: "Starter Plan", status: "Paid", amount: 4999, startDate: "2026-05-01", endDate: "2027-05-01", storageLimit: "20 GB", storageUsage: 1.9, isActive: true }
];

const DUMMY_PLANS = [
  { id: "plan-1", name: "Starter Plan", price: 4999, billingCycle: "Annual", maxStudents: 5, maxTeachers: 5, storageLimit: "20 GB", features: ["Core ERP Suite", "Student Attendance", "Notice Board", "Basic Support"], status: "Active" },
  { id: "plan-2", name: "Basic Plan", price: 9999, billingCycle: "Annual", maxStudents: 5, maxTeachers: 10, storageLimit: "50 GB", features: ["Core ERP Suite", "Exams & Marks", "Fee Management", "Standard Reports"], status: "Active" },
  { id: "plan-3", name: "Standard Plan", price: 14999, billingCycle: "Annual", maxStudents: 5, maxTeachers: 15, storageLimit: "100 GB", features: ["Core ERP", "Digital Library", "Homework Portal", "Parent App Access"], status: "Active" },
  { id: "plan-4", name: "Premium Plan", price: 24999, billingCycle: "Annual", maxStudents: 5, maxTeachers: 25, storageLimit: "250 GB", features: ["All Modules", "Live Bus GPS Tracking", "Custom Branding", "Priority Support"], status: "Active" },
  { id: "plan-5", name: "Enterprise Plan", price: 49999, billingCycle: "Annual", maxStudents: 5, maxTeachers: 50, storageLimit: "500 GB", features: ["All Modules", "Hostel Suite", "Multi-Branch Analytics", "Dedicated Account Manager"], status: "Active" }
];

const DUMMY_USERS = [
  { id: "super-admin-1", name: "Super Admin", email: "admin@school.com", role: "super_admin", schoolId: "", isActive: true },
  { id: "admin-1", name: "St. Xavier Admin", email: "admin@stxaviers.edu", role: "admin", schoolId: "school-1", isActive: true },
  { id: "admin-2", name: "DPS Jaipur Admin", email: "admin@dpsjaipur.edu", role: "admin", schoolId: "school-2", isActive: true },
  { id: "admin-3", name: "Greenwood Admin", email: "contact@greenwood.edu", role: "admin", schoolId: "school-3", isActive: true },
  { id: "admin-4", name: "Apex Admin", email: "admissions@apexacademy.edu", role: "admin", schoolId: "school-4", isActive: true },
  { id: "admin-5", name: "Heritage Admin", email: "office@heritageglobal.edu", role: "admin", schoolId: "school-5", isActive: true },
  
  // 5 Teachers
  { id: "teacher-1", name: "Dr. Vikramaditya Sharma", email: "vikram@school.com", phone: "9876543210", role: "teacher", schoolId: "school-1", className: "9th A, 9th B, 10th A, 10th B, 11th Science", classes: ["9th A", "9th B", "10th A", "10th B", "11th Science"], department: "Mathematics", subject: "Mathematics", designation: "HOD Mathematics", isActive: true },
  { id: "teacher-2", name: "Prof. Ananya Deshmukh", email: "ananya@school.com", phone: "9876543211", role: "teacher", schoolId: "school-1", className: "9th A, 9th B, 10th A, 10th B, 11th Science", classes: ["9th A", "9th B", "10th A", "10th B", "11th Science"], department: "Physics", subject: "Physics", designation: "Senior Lecturer", isActive: true },
  { id: "teacher-3", name: "Dr. Rajeshwar Verma", email: "rajeshwar@school.com", phone: "9876543212", role: "teacher", schoolId: "school-1", className: "9th A, 9th B, 10th A, 10th B, 11th Science", classes: ["9th A", "9th B", "10th A", "10th B", "11th Science"], department: "Chemistry", subject: "Chemistry", designation: "Department Head", isActive: true },
  { id: "teacher-4", name: "Mrs. Sunita Choudhary", email: "sunita@school.com", phone: "9876543213", role: "teacher", schoolId: "school-1", className: "9th A, 9th B, 10th A, 10th B, 11th Science", classes: ["9th A", "9th B", "10th A", "10th B", "11th Science"], department: "English", subject: "English Literature", designation: "Lecturer", isActive: true },
  { id: "teacher-5", name: "Er. Dharmendra Singh", email: "dharmendra@school.com", phone: "9876543214", role: "teacher", schoolId: "school-1", className: "9th A, 9th B, 10th A, 10th B, 11th Science", classes: ["9th A", "9th B", "10th A", "10th B", "11th Science"], department: "Computer Science", subject: "Computer Science", designation: "IT Lead", isActive: true },
  
  // 5 Students
  { id: "student-1", name: "Aarav Sharma", email: "aarav@student.com", phone: "9829011111", role: "student", schoolId: "school-1", className: "9th A", rollNo: "101", fatherName: "Rajesh Sharma", motherName: "Sushma Sharma", address: "12 Elm St, Udaipur", admissionNo: "ADM-9001", busId: "bus-1", busNumber: "BUS-01", isActive: true },
  { id: "student-2", name: "Diya Patel", email: "diya@student.com", phone: "9829022222", role: "student", schoolId: "school-1", className: "9th A", rollNo: "102", fatherName: "Ketan Patel", motherName: "Meena Patel", address: "45 Pine Ave, Udaipur", admissionNo: "ADM-9002", busId: "bus-2", busNumber: "BUS-02", isActive: true },
  { id: "student-3", name: "Rohan Gupta", email: "rohan@student.com", phone: "9829033333", role: "student", schoolId: "school-1", className: "10th B", rollNo: "103", fatherName: "Sanjay Gupta", motherName: "Rita Gupta", address: "88 Maple St, Udaipur", admissionNo: "ADM-9003", busId: "bus-1", busNumber: "BUS-01", isActive: true },
  { id: "student-4", name: "Ishaan Verma", email: "ishaan@student.com", phone: "9829044444", role: "student", schoolId: "school-1", className: "10th A", rollNo: "104", fatherName: "Vikram Verma", motherName: "Pooja Verma", address: "14 Lake View Road, Udaipur", admissionNo: "ADM-9004", busId: "bus-3", busNumber: "BUS-03", isActive: true },
  { id: "student-5", name: "Ananya Roy", email: "ananya.roy@student.com", phone: "9829055555", role: "student", schoolId: "school-1", className: "9th B", rollNo: "105", fatherName: "Debabrata Roy", motherName: "Kakoli Roy", address: "99 Civil Lines, Udaipur", admissionNo: "ADM-9005", busId: null, busNumber: null, isActive: true },

  // 5 Drivers
  { id: "driver-1", name: "Ramesh Kumar", phone: "9988776655", role: "driver", schoolId: "school-1", busNumber: "BUS-01", busId: "bus-1", isActive: true },
  { id: "driver-2", name: "Suresh Yadav", phone: "9988776644", role: "driver", schoolId: "school-1", busNumber: "BUS-02", busId: "bus-2", isActive: true },
  { id: "driver-3", name: "Mahendra Singh", phone: "9988776633", role: "driver", schoolId: "school-1", busNumber: "BUS-03", busId: "bus-3", isActive: true },
  { id: "driver-4", name: "Vikram Rathore", phone: "9988776622", role: "driver", schoolId: "school-1", busNumber: "BUS-04", busId: "bus-4", isActive: true },
  { id: "driver-5", name: "Gurpreet Singh", phone: "9988776611", role: "driver", schoolId: "school-1", busNumber: "BUS-05", busId: "bus-5", isActive: true }
];

const DUMMY_CLASSES = [
  { id: "cls-1", name: "9th A", schoolId: "school-1", classTeacher: "Dr. Vikramaditya Sharma", activeStudents: 2, isDeleted: false },
  { id: "cls-2", name: "9th B", schoolId: "school-1", classTeacher: "Prof. Ananya Deshmukh", activeStudents: 1, isDeleted: false },
  { id: "cls-3", name: "10th A", schoolId: "school-1", classTeacher: "Er. Dharmendra Singh", activeStudents: 1, isDeleted: false },
  { id: "cls-4", name: "10th B", schoolId: "school-1", classTeacher: "Mrs. Sunita Choudhary", activeStudents: 1, isDeleted: false },
  { id: "cls-5", name: "11th Science", schoolId: "school-1", classTeacher: "Dr. Rajeshwar Verma", activeStudents: 0, isDeleted: false }
];

const DUMMY_SUBJECTS = [
  { id: "sub-1", name: "Mathematics", code: "MTH-09", type: "Core", className: "9th A, 9th B, 10th A, 10th B", schoolId: "school-1", isDeleted: false },
  { id: "sub-2", name: "Physics", code: "PHY-10", type: "Core", className: "9th A, 10th A, 11th Science", schoolId: "school-1", isDeleted: false },
  { id: "sub-3", name: "Chemistry", code: "CHM-10", type: "Core", className: "9th B, 10th B, 11th Science", schoolId: "school-1", isDeleted: false },
  { id: "sub-4", name: "English Literature", code: "ENG-09", type: "Core", className: "9th A, 9th B, 10th A, 10th B, 11th Science", schoolId: "school-1", isDeleted: false },
  { id: "sub-5", name: "Computer Science", code: "CS-11", type: "Elective", className: "10th A, 10th B, 11th Science", schoolId: "school-1", isDeleted: false }
];

const DUMMY_EXAMS = [
  { id: "ex-1", name: "Mid-Term Examination 2026", classes: "9th A, 10th A", date: "2026-09-15", status: "Scheduled", schoolId: "school-1" },
  { id: "ex-2", name: "Quarterly Assessment Test", classes: "9th B, 10th B", date: "2026-10-01", status: "Scheduled", schoolId: "school-1" },
  { id: "ex-3", name: "Science Practical Evaluation", classes: "11th Science", date: "2026-10-20", status: "Scheduled", schoolId: "school-1" },
  { id: "ex-4", name: "Annual Pre-Board Examination", classes: "10th A, 10th B", date: "2026-12-10", status: "Scheduled", schoolId: "school-1" },
  { id: "ex-5", name: "Olympiad & Skill Assessment", classes: "9th A, 9th B, 10th A, 10th B, 11th Science", date: "2026-11-05", status: "Scheduled", schoolId: "school-1" }
];

const DUMMY_NOTICES = [
  { id: "not-1", title: "Independence Day Parade Guidelines", description: "All students assemble at 7:30 AM in full school uniform.", category: "General", publishDate: "2026-08-10", status: "published", schoolId: "school-1" },
  { id: "not-2", title: "Mid-Term Examination Datesheet", description: "Official datesheet for Mid-Term Exams posted on portal.", category: "Academic", publishDate: "2026-08-20", status: "published", schoolId: "school-1" },
  { id: "not-3", title: "Annual Sports & Cultural Meet 2026", description: "Registrations for track, field, and swimming events open.", category: "Activity", publishDate: "2026-09-01", status: "published", schoolId: "school-1" },
  { id: "not-4", title: "Parents-Teacher Meeting (PTM)", description: "PTM scheduled for Saturday, Sep 26th from 9:00 AM.", category: "Notice", publishDate: "2026-09-10", status: "published", schoolId: "school-1" },
  { id: "not-5", title: "Live Bus Tracking App Update", description: "Parents can track real-time bus locations with instant ETA.", category: "Transport", publishDate: "2026-09-18", status: "published", schoolId: "school-1" }
];

const DUMMY_BOOKS = [
  { id: "bk-1", title: "Higher Algebra", author: "Hall & Knight", isbn: "ISBN-978-01", category: "Mathematics", quantity: 20, available: 18, schoolId: "school-1" },
  { id: "bk-2", title: "Fundamentals of Physics", author: "Resnick Halliday Walker", isbn: "ISBN-978-02", category: "Physics", quantity: 15, available: 12, schoolId: "school-1" },
  { id: "bk-3", title: "Organic Chemistry", author: "Morrison & Boyd", isbn: "ISBN-978-03", category: "Chemistry", quantity: 25, available: 20, schoolId: "school-1" },
  { id: "bk-4", title: "Oxford Modern English Grammar", author: "Bas Aarts", isbn: "ISBN-978-04", category: "English Literature", quantity: 30, available: 27, schoolId: "school-1" },
  { id: "bk-5", title: "Computer Science with Python", author: "Sumita Arora", isbn: "ISBN-978-05", category: "Computer Science", quantity: 40, available: 35, schoolId: "school-1" }
];

const DUMMY_BOOK_CATEGORIES = [
  { id: "cat-1", name: "Mathematics", color: "#3B82F6", schoolId: "school-1" },
  { id: "cat-2", name: "Physics", color: "#8B5CF6", schoolId: "school-1" },
  { id: "cat-3", name: "Chemistry", color: "#EF4444", schoolId: "school-1" },
  { id: "cat-4", name: "English Literature", color: "#10B981", schoolId: "school-1" },
  { id: "cat-5", name: "Computer Science", color: "#F59E0B", schoolId: "school-1" }
];

const DUMMY_ISSUED_BOOKS = [
  { id: "iss-1", studentId: "student-1", studentName: "Aarav Sharma", bookTitle: "Higher Algebra", issueDate: "2026-07-01", dueDate: "2026-07-15", returnDate: null, status: "Issued", schoolId: "school-1" },
  { id: "iss-2", studentId: "student-2", studentName: "Diya Patel", bookTitle: "Fundamentals of Physics", issueDate: "2026-07-05", dueDate: "2026-07-19", returnDate: null, status: "Issued", schoolId: "school-1" },
  { id: "iss-3", studentId: "student-3", studentName: "Rohan Gupta", bookTitle: "Organic Chemistry", issueDate: "2026-06-10", dueDate: "2026-06-24", returnDate: "2026-06-22", status: "Returned", schoolId: "school-1" },
  { id: "iss-4", studentId: "student-4", studentName: "Ishaan Verma", bookTitle: "Oxford Modern English Grammar", issueDate: "2026-07-10", dueDate: "2026-07-24", returnDate: null, status: "Issued", schoolId: "school-1" },
  { id: "iss-5", studentId: "student-5", studentName: "Ananya Roy", bookTitle: "Computer Science with Python", issueDate: "2026-07-12", dueDate: "2026-07-26", returnDate: null, status: "Issued", schoolId: "school-1" }
];

const DUMMY_HOMEWORKS = [
  { id: "hw-1", teacherId: "teacher-5", createdBy: "teacher-5", subject: "Mathematics", className: "9th A", content: "Solve Exercise 4.2 Problems 1 to 15 on Quadratic Equations.", date: "2026-07-26", teacherName: "Dr. Vikramaditya Sharma", schoolId: "school-1" },
  { id: "hw-2", subject: "Physics", className: "9th A", content: "Numerical practice questions on Newton's Laws of Motion.", date: "2026-07-26", teacherName: "Prof. Ananya Deshmukh", schoolId: "school-1" },
  { id: "hw-3", subject: "Chemistry", className: "9th B", content: "Draw Lewis Electron Dot Structures for given 10 compounds.", date: "2026-07-25", teacherName: "Dr. Rajeshwar Verma", schoolId: "school-1" },
  { id: "hw-4", subject: "English Literature", className: "9th A", content: "Write a 300-word critical essay on Shakespeare's Sonnet 18.", date: "2026-07-24", teacherName: "Mrs. Sunita Choudhary", schoolId: "school-1" },
  { id: "hw-5", subject: "Computer Science", className: "10th A", content: "Implement Binary Search and Bubble Sort algorithms in Python.", date: "2026-07-26", teacherName: "Er. Dharmendra Singh", schoolId: "school-1" }
];

const DUMMY_ASSIGNMENTS = [
  { id: "as-1", teacherId: "teacher-5", createdBy: "teacher-5", title: "Calculus Application Portfolio", className: "9th A", subject: "Mathematics", maxMarks: 50, dueDate: "2026-08-05", assignmentType: "Individual Project", schoolId: "school-1" },
  { id: "as-2", title: "Physics Optics Working Model", className: "9th A", subject: "Physics", maxMarks: 100, dueDate: "2026-08-10", assignmentType: "Group Activity", schoolId: "school-1" },
  { id: "as-3", title: "Periodic Table Organic Chart", className: "9th B", subject: "Chemistry", maxMarks: 50, dueDate: "2026-08-12", assignmentType: "Chart Presentation", schoolId: "school-1" },
  { id: "as-4", title: "English Drama Roleplay Script", className: "9th A", subject: "English Literature", maxMarks: 30, dueDate: "2026-08-01", assignmentType: "Creative Writing", schoolId: "school-1" },
  { id: "as-5", title: "AI Python Chatbot Mini Project", className: "10th A", subject: "Computer Science", maxMarks: 100, dueDate: "2026-08-15", assignmentType: "Practical Lab", schoolId: "school-1" }
];

const DUMMY_HOSTEL_INVENTORY = [
  { id: "inv-1", name: "Ergonomic Wooden Study Tables", category: "Furniture", totalStock: 50, utilized: 45, damaged: 2, available: 3, schoolId: "school-1" },
  { id: "inv-2", name: "High-Back Adjustable Chairs", category: "Furniture", totalStock: 60, utilized: 55, damaged: 3, available: 2, schoolId: "school-1" },
  { id: "inv-3", name: "Heavy Duty Steel Almirahs", category: "Storage", totalStock: 40, utilized: 38, damaged: 0, available: 2, schoolId: "school-1" },
  { id: "inv-4", name: "Single Cot Orthopedic Beds", category: "Bedding", totalStock: 70, utilized: 65, damaged: 1, available: 4, schoolId: "school-1" },
  { id: "inv-5", name: "High Speed Ceiling Fans 1200mm", category: "Electricals", totalStock: 80, utilized: 76, damaged: 2, available: 2, schoolId: "school-1" }
];

const DUMMY_HOSTELS = [
  { id: "1", name: "Block A - Boys Hostel", type: "Boys", capacity: 50, occupied: 45, wardenName: "Mr. Rajesh Sharma", phone: "9829011111", status: "Active", schoolId: "school-1" },
  { id: "2", name: "Block B - Girls Hostel", type: "Girls", capacity: 40, occupied: 35, wardenName: "Mrs. Sunita Kapoor", phone: "9829022222", status: "Active", schoolId: "school-1" },
  { id: "3", name: "Block C - Junior Hostel", type: "Junior", capacity: 30, occupied: 25, wardenName: "Mr. Vikram Singh", phone: "9829033333", status: "Active", schoolId: "school-1" }
];

const DUMMY_HOSTEL_ROOMS = [
  { id: "room-1", hostelId: "1", roomNumber: "101", block: "Block A", type: "Deluxe Twin (AC)", capacity: 2, occupied: 2, rentAmount: 65000, rent: 65000, floor: "1st Floor", status: "Occupied", schoolId: "school-1" },
  { id: "room-2", hostelId: "1", roomNumber: "102", block: "Block A", type: "Standard Triple (Non-AC)", capacity: 3, occupied: 2, rentAmount: 45000, rent: 45000, floor: "1st Floor", status: "Available", schoolId: "school-1" },
  { id: "room-3", hostelId: "2", roomNumber: "201", block: "Block B", type: "Single Executive (AC)", capacity: 1, occupied: 1, rentAmount: 90000, rent: 90000, floor: "2nd Floor", status: "Occupied", schoolId: "school-1" },
  { id: "room-4", hostelId: "2", roomNumber: "202", block: "Block B", type: "Quad Studio", capacity: 4, occupied: 3, rentAmount: 40000, rent: 40000, floor: "2nd Floor", status: "Available", schoolId: "school-1" },
  { id: "room-5", hostelId: "3", roomNumber: "301", block: "Block C", type: "Premium Suite (AC)", capacity: 2, occupied: 1, rentAmount: 75000, rent: 75000, floor: "3rd Floor", status: "Available", schoolId: "school-1" }
];

const DUMMY_BUSES = [
  { id: "bus-1", busNumber: "BUS-01", vehicleNumber: "MH-12-AB-1001", driverName: "Ramesh Kumar", driverPhone: "9988776655", gpsDeviceId: "IMEI-880011", lat: 28.6139, lng: 77.2090, latitude: 28.6139, longitude: 77.2090, speed: 35, isTripActive: true, tripStatus: "Moving", routeName: "Central Route A", schoolId: "school-1" },
  { id: "bus-2", busNumber: "BUS-02", vehicleNumber: "RJ-27-PA-2002", driverName: "Suresh Yadav", driverPhone: "9988776644", gpsDeviceId: "IMEI-880022", lat: 28.6250, lng: 77.2200, latitude: 28.6250, longitude: 77.2200, speed: 40, isTripActive: true, tripStatus: "Moving", routeName: "North Route B", schoolId: "school-1" },
  { id: "bus-3", busNumber: "BUS-03", vehicleNumber: "MP-09-CA-3003", driverName: "Mahendra Singh", driverPhone: "9988776633", gpsDeviceId: "IMEI-880033", lat: 28.6010, lng: 77.1890, latitude: 28.6010, longitude: 77.1890, speed: 0, isTripActive: true, tripStatus: "Idle", routeName: "South Express C", schoolId: "school-1" },
  { id: "bus-4", busNumber: "BUS-04", vehicleNumber: "DL-01-GA-4004", driverName: "Vikram Rathore", driverPhone: "9988776622", gpsDeviceId: "IMEI-880044", lat: 28.6300, lng: 77.1500, latitude: 28.6300, longitude: 77.1500, speed: 28, isTripActive: true, tripStatus: "Moving", routeName: "West Ring Route D", schoolId: "school-1" },
  { id: "bus-5", busNumber: "BUS-05", vehicleNumber: "PB-65-BA-5005", driverName: "Gurpreet Singh", driverPhone: "9988776611", gpsDeviceId: "IMEI-880055", lat: 28.5800, lng: 77.2500, latitude: 28.5800, longitude: 77.2500, speed: 0, isTripActive: false, tripStatus: "Stopped", routeName: "East Campus Link E", schoolId: "school-1" }
];

const DUMMY_CONTACTS = [
  { id: "cnt-1", name: "St. Xavier Admin", email: "admin@stxaviers.edu", subject: "Biometric Device Integration Sync Issue", message: "Category: Technical\nSeverity: High\n\nMain Gate Biometric Scanner #01 is intermittent during morning peak hours (8:00 AM). Need firmware verification.", status: "responded", createdAt: "2026-07-25T10:30:00Z", reply: "Technical team inspected hardware. Firmware upgraded to v4.2. Connection restored." },
  { id: "cnt-2", name: "St. Xavier Admin", email: "admin@stxaviers.edu", subject: "Fee Receipt Custom Header Request", message: "Category: Billing\nSeverity: Medium\n\nWe need to add our school registration number and affiliation code to the PDF fee receipt header.", status: "responded", createdAt: "2026-07-24T14:15:00Z", reply: "Header template updated in School Profile settings. Please verify generated PDF." },
  { id: "cnt-3", name: "St. Xavier Admin", email: "admin@stxaviers.edu", subject: "GPS Live Tracking Refresh Rate", message: "Category: Transport\nSeverity: Low\n\nCan we change the GPS tracking position refresh frequency from 10 seconds to 5 seconds during active trips?", status: "new", createdAt: "2026-07-26T09:00:00Z", reply: "" },
  { id: "cnt-4", name: "St. Xavier Admin", email: "admin@stxaviers.edu", subject: "Bulk Student Photo Upload Support", message: "Category: General\nSeverity: Low\n\nRequesting zip file bulk upload for student profile photographs.", status: "new", createdAt: "2026-07-26T16:45:00Z", reply: "" }
];

const DUMMY_BIOMETRIC_DEVICES = [
  { id: "bio-dev-1", deviceName: "Main Gate Biometric Scanner 01", location: "Main Entrance", ipAddress: "192.168.1.150", status: "Online", lastSync: "2026-07-26 23:40", totalLogsToday: 342, schoolId: "school-1" },
  { id: "bio-dev-2", deviceName: "Academic Block Facial Terminal", location: "Block A Lobby", ipAddress: "192.168.1.151", status: "Online", lastSync: "2026-07-26 23:42", totalLogsToday: 512, schoolId: "school-1" },
  { id: "bio-dev-3", deviceName: "Hostel Entry RFID & Fingerprint", location: "Hostel Gate 1", ipAddress: "192.168.1.152", status: "Online", lastSync: "2026-07-26 23:38", totalLogsToday: 189, schoolId: "school-1" },
  { id: "bio-dev-4", deviceName: "Sports Complex Gate Scanner", location: "Stadium West", ipAddress: "192.168.1.153", status: "Offline", lastSync: "2026-07-26 20:15", totalLogsToday: 95, schoolId: "school-1" },
  { id: "bio-dev-5", deviceName: "Staff Room Attendance Terminal", location: "Staff Wing", ipAddress: "192.168.1.154", status: "Online", lastSync: "2026-07-26 23:44", totalLogsToday: 48, schoolId: "school-1" }
];

const DUMMY_BIOMETRIC_LOGS = [
  { id: "log-1", userId: "student-1", userName: "Aarav Sharma", userRole: "Student", className: "9th A", deviceName: "Main Gate Scanner 01", timestamp: "2026-07-26 08:15:22", time: "08:15 AM", date: "2026-07-26", status: "Present", mode: "Fingerprint", schoolId: "school-1" },
  { id: "log-2", userId: "student-2", userName: "Diya Patel", userRole: "Student", className: "9th A", deviceName: "Academic Block Lobby", timestamp: "2026-07-26 08:20:10", time: "08:20 AM", date: "2026-07-26", status: "Present", mode: "Facial Recognition", schoolId: "school-1" },
  { id: "log-3", userId: "teacher-1", userName: "Dr. Vikramaditya Sharma", userRole: "Teacher", className: "Staff Wing", deviceName: "Staff Room Terminal", timestamp: "2026-07-26 08:05:45", time: "08:05 AM", date: "2026-07-26", status: "Present", mode: "RFID Card", schoolId: "school-1" },
  { id: "log-4", userId: "student-3", userName: "Rohan Gupta", userRole: "Student", className: "10th B", deviceName: "Main Gate Scanner 01", timestamp: "2026-07-26 08:35:12", time: "08:35 AM", date: "2026-07-26", status: "Late", mode: "Fingerprint", schoolId: "school-1" },
  { id: "log-5", userId: "student-4", userName: "Ishaan Verma", userRole: "Student", className: "10th A", deviceName: "Hostel Gate 1", timestamp: "2026-07-26 08:12:00", time: "08:12 AM", date: "2026-07-26", status: "Present", mode: "Facial Recognition", schoolId: "school-1" }
];

const DUMMY_TIMETABLES = [
  { id: "tt-1", className: "9th A", day: "Monday", period: "1st Period (09:00 - 09:45 AM)", subject: "Mathematics", teacherName: "Dr. Vikramaditya Sharma", roomNo: "Room 101", schoolId: "school-1" },
  { id: "tt-2", className: "9th A", day: "Monday", period: "2nd Period (09:45 - 10:30 AM)", subject: "Physics", teacherName: "Prof. Ananya Deshmukh", roomNo: "Lab 02", schoolId: "school-1" },
  { id: "tt-3", className: "9th A", day: "Monday", period: "3rd Period (10:45 - 11:30 AM)", subject: "Chemistry", teacherName: "Dr. Rajeshwar Verma", roomNo: "Lab 01", schoolId: "school-1" },
  { id: "tt-4", className: "9th A", day: "Monday", period: "4th Period (11:30 - 12:15 PM)", subject: "English Literature", teacherName: "Mrs. Sunita Choudhary", roomNo: "Room 101", schoolId: "school-1" },
  { id: "tt-5", className: "9th A", day: "Monday", period: "5th Period (01:00 - 01:45 PM)", subject: "Computer Science", teacherName: "Er. Dharmendra Singh", roomNo: "IT Lab 1", schoolId: "school-1" }
];

const DUMMY_ATTENDANCES = [
  { id: "att-1", studentId: "student-1", studentName: "Aarav Sharma", className: "9th A", date: "2026-07-26", status: "Present", teacherName: "Dr. Vikramaditya Sharma", schoolId: "school-1" },
  { id: "att-2", studentId: "student-2", studentName: "Diya Patel", className: "9th A", date: "2026-07-26", status: "Present", teacherName: "Dr. Vikramaditya Sharma", schoolId: "school-1" },
  { id: "att-3", studentId: "student-3", studentName: "Rohan Gupta", className: "10th B", date: "2026-07-26", status: "Late", teacherName: "Mrs. Sunita Choudhary", schoolId: "school-1" },
  { id: "att-4", studentId: "student-4", studentName: "Ishaan Verma", className: "10th A", date: "2026-07-26", status: "Present", teacherName: "Er. Dharmendra Singh", schoolId: "school-1" },
  { id: "att-5", studentId: "student-5", studentName: "Ananya Roy", className: "9th B", date: "2026-07-26", status: "Absent", teacherName: "Prof. Ananya Deshmukh", schoolId: "school-1" }
];

function getStored(key, defaultData) {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    let parsed = JSON.parse(item);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    if (key === "sms_users_demo" && Array.isArray(defaultData)) {
      const hasTeachers = parsed.some(u => u.role === "teacher");
      const hasDrivers = parsed.some(u => u.role === "driver");
      const hasStudents = parsed.some(u => u.role === "student");
      if (!hasTeachers || !hasDrivers || !hasStudents) {
        parsed = defaultData;
        try { localStorage.setItem(key, JSON.stringify(defaultData)); } catch (e) {}
      }
    }
    return parsed;
  } catch (e) {
    try { localStorage.setItem(key, JSON.stringify(defaultData)); } catch (err) {}
    return defaultData;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

export function seedLocalStorageDb() {
  try {
    getStored("sms_schools_demo", DUMMY_SCHOOLS);
    getStored("sms_users_demo", DUMMY_USERS);
    getStored("sms_plans_demo", DUMMY_PLANS);
    getStored("sms_classes_demo", DUMMY_CLASSES);
    getStored("sms_subjects_demo", DUMMY_SUBJECTS);
    getStored("sms_exams_demo", DUMMY_EXAMS);
    getStored("sms_notices_demo", DUMMY_NOTICES);
    getStored("sms_books_demo", DUMMY_BOOKS);
    getStored("sms_book_categories_demo", DUMMY_BOOK_CATEGORIES);
    getStored("sms_issued_books_demo", DUMMY_ISSUED_BOOKS);
    getStored("sms_homeworks_demo", DUMMY_HOMEWORKS);
    getStored("sms_assignments_demo", DUMMY_ASSIGNMENTS);
    getStored("sms_attendances_demo", DUMMY_ATTENDANCES);
    getStored("sms_timetables_demo", DUMMY_TIMETABLES);
    getStored("sms_hostels_demo", DUMMY_HOSTELS);
    getStored("sms_hostel_rooms_demo", DUMMY_HOSTEL_ROOMS);
    getStored("sms_hostel_inventory_demo", DUMMY_HOSTEL_INVENTORY);
    getStored("sms_hostel_damages_demo", DUMMY_HOSTEL_DAMAGES);
    getStored("sms_hostel_payments_demo", DUMMY_HOSTEL_PAYMENTS);
    getStored("sms_hostel_maintenance_demo", DUMMY_HOSTEL_MAINTENANCE);
    getStored("sms_hostel_visitors_demo", DUMMY_HOSTEL_VISITORS);
    getStored("sms_biometric_devices_demo", DUMMY_BIOMETRIC_DEVICES);
    getStored("sms_biometric_logs_demo", DUMMY_BIOMETRIC_LOGS);
    getStored("sms_events_demo", DUMMY_EVENTS);
    getStored("sms_buses_demo", DUMMY_BUSES);
  } catch (e) {}
}

try {
  seedLocalStorageDb();
} catch (e) {}

async function mockApiResolver(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const urlObj = new URL(endpoint, "http://dummy.local");
  const path = urlObj.pathname.replace("/api", "");
  const params = Object.fromEntries(urlObj.searchParams.entries());

  await new Promise(r => setTimeout(r, 20));

  if (path === "/hostels") {
    const data = getStored("sms_hostels_demo", DUMMY_HOSTELS);
    return { success: true, data };
  }

  if (path === "/hostel-rooms" || path === "/hostel_rooms") {
    const data = getStored("sms_hostel_rooms_demo", DUMMY_HOSTEL_ROOMS);
    return { success: true, data };
  }

  if (path === "/hostel-students" || path === "/hostel_students") {
    const defaultHostelStudents = [
      { id: "hs-1", name: "Aarav Sharma", studentId: "student-1", hostelName: "Block A - Boys Hostel", roomNumber: "101", block: "Block A", parentName: "Rajesh Sharma", phone: "9829011111", bloodGroup: "O+", lockerNo: "LK-101", status: "Active", schoolId: "school-1" },
      { id: "hs-2", name: "Diya Patel", studentId: "student-2", hostelName: "Block B - Girls Hostel", roomNumber: "102", block: "Block A", parentName: "Ketan Patel", phone: "9829022222", bloodGroup: "A+", lockerNo: "LK-102", status: "Active", schoolId: "school-1" },
      { id: "hs-3", name: "Rohan Gupta", studentId: "student-3", hostelName: "Block A - Boys Hostel", roomNumber: "201", block: "Block B", parentName: "Sanjay Gupta", phone: "9829033333", bloodGroup: "B+", lockerNo: "LK-201", status: "Active", schoolId: "school-1" },
      { id: "hs-4", name: "Ishaan Verma", studentId: "student-4", hostelName: "Block C - Junior Hostel", roomNumber: "202", block: "Block B", parentName: "Vikram Verma", phone: "9829044444", bloodGroup: "AB+", lockerNo: "LK-202", status: "Active", schoolId: "school-1" },
      { id: "hs-5", name: "Ananya Roy", studentId: "student-5", hostelName: "Block B - Girls Hostel", roomNumber: "301", block: "Block C", parentName: "Debabrata Roy", phone: "9829055555", bloodGroup: "O-", lockerNo: "LK-301", status: "Active", schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_students_demo", defaultHostelStudents);
    return { success: true, data };
  }

  if (path === "/hostel-inventory" || path === "/hostel_inventory" || path === "/hostel-assets" || path === "/hostel_assets") {
    const defaultInv = [
      { id: "inv-1", name: "Ergonomic Wooden Study Tables", category: "Furniture", categoryName: "Furniture", totalStock: 50, utilized: 45, damaged: 2, available: 3, unitPrice: 3500, schoolId: "school-1" },
      { id: "inv-2", name: "High-Back Adjustable Chairs", category: "Furniture", categoryName: "Furniture", totalStock: 60, utilized: 55, damaged: 3, available: 2, unitPrice: 1800, schoolId: "school-1" },
      { id: "inv-3", name: "Heavy Duty Steel Almirahs", category: "Storage", categoryName: "Storage", totalStock: 40, utilized: 38, damaged: 0, available: 2, unitPrice: 7500, schoolId: "school-1" },
      { id: "inv-4", name: "Single Cot Orthopedic Beds", category: "Bedding", categoryName: "Bedding", totalStock: 70, utilized: 65, damaged: 1, available: 4, unitPrice: 5000, schoolId: "school-1" },
      { id: "inv-5", name: "High Speed Ceiling Fans 1200mm", category: "Electricals", categoryName: "Electricals", totalStock: 80, utilized: 76, damaged: 2, available: 2, unitPrice: 2200, schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_inventory_demo", defaultInv);
    return { success: true, data };
  }

  if (path === "/hostel-damages" || path === "/hostel_damages") {
    const defaultDamages = [
      { id: "dmg-1", studentName: "Aarav Sharma", brokenItemName: "Study Table Leg Scratched", fine: 500, status: "Paid", schoolId: "school-1" },
      { id: "dmg-2", studentName: "Diya Patel", brokenItemName: "Chair Armrest Damaged", fine: 350, status: "Pending", schoolId: "school-1" },
      { id: "dmg-3", studentName: "Rohan Gupta", brokenItemName: "Locker Key Replacement", fine: 200, status: "Paid", schoolId: "school-1" },
      { id: "dmg-4", studentName: "Ishaan Verma", brokenItemName: "Window Glass Crack", fine: 800, status: "Pending", schoolId: "school-1" },
      { id: "dmg-5", studentName: "Ananya Roy", brokenItemName: "Electrical Switch Box Handle", fine: 150, status: "Paid", schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_damages_demo", defaultDamages);
    return { success: true, data };
  }

  if (path === "/hostel-allotments" || path === "/hostel_allotments") {
    const defaultAllot = [
      { id: "alt-1", studentName: "Aarav Sharma", studentId: "student-1", roomNumber: "101", hostelName: "Block A - Boys Hostel", allotmentDate: "2026-06-01", checkInDate: "2026-06-01", status: "Active", rent: 65000, schoolId: "school-1" },
      { id: "alt-2", studentName: "Diya Patel", studentId: "student-2", roomNumber: "102", hostelName: "Block B - Girls Hostel", allotmentDate: "2026-06-01", checkInDate: "2026-06-01", status: "Active", rent: 45000, schoolId: "school-1" },
      { id: "alt-3", studentName: "Rohan Gupta", studentId: "student-3", roomNumber: "201", hostelName: "Block A - Boys Hostel", allotmentDate: "2026-06-05", checkInDate: "2026-06-05", status: "Active", rent: 90000, schoolId: "school-1" },
      { id: "alt-4", studentName: "Ishaan Verma", studentId: "student-4", roomNumber: "202", hostelName: "Block C - Junior Hostel", allotmentDate: "2026-06-10", checkInDate: "2026-06-10", status: "Active", rent: 40000, schoolId: "school-1" },
      { id: "alt-5", studentName: "Ananya Roy", studentId: "student-5", roomNumber: "301", hostelName: "Block B - Girls Hostel", allotmentDate: "2026-06-15", checkInDate: "2026-06-15", status: "Active", rent: 75000, schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_allotments_demo", defaultAllot);
    return { success: true, data };
  }

  if (path === "/hostel-payments" || path === "/hostel_payments") {
    const defaultPay = [
      { id: "pay-1", studentName: "Aarav Sharma", roomNumber: "101", amount: 65000, paymentDate: "2026-06-01", receiptNo: "REC-HOST-101", status: "Paid", schoolId: "school-1" },
      { id: "pay-2", studentName: "Diya Patel", roomNumber: "102", amount: 45000, paymentDate: "2026-06-02", receiptNo: "REC-HOST-102", status: "Paid", schoolId: "school-1" },
      { id: "pay-3", studentName: "Rohan Gupta", roomNumber: "201", amount: 90000, paymentDate: "2026-06-05", receiptNo: "REC-HOST-103", status: "Paid", schoolId: "school-1" },
      { id: "pay-4", studentName: "Ishaan Verma", roomNumber: "202", amount: 40000, paymentDate: "2026-06-10", receiptNo: "REC-HOST-104", status: "Pending", schoolId: "school-1" },
      { id: "pay-5", studentName: "Ananya Roy", roomNumber: "301", amount: 75000, paymentDate: "2026-06-15", receiptNo: "REC-HOST-105", status: "Paid", schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_payments_demo", defaultPay);
    return { success: true, data };
  }

  if (path === "/hostel-maintenance" || path === "/hostel_maintenance") {
    const defaultMaint = [
      { id: "mnt-1", title: "Plumbing Washroom Leakage", roomNumber: "101", priority: "High", status: "Resolved", reportedDate: "2026-07-10", schoolId: "school-1" },
      { id: "mnt-2", title: "Geyser Heating Element Repair", roomNumber: "102", priority: "Medium", status: "In Progress", reportedDate: "2026-07-15", schoolId: "school-1" },
      { id: "mnt-3", title: "WIFI Router Access Point Reset", roomNumber: "201", priority: "Low", status: "Resolved", reportedDate: "2026-07-18", schoolId: "school-1" },
      { id: "mnt-4", title: "Electrical Socket Replacement", roomNumber: "202", priority: "High", status: "Pending", reportedDate: "2026-07-22", schoolId: "school-1" },
      { id: "mnt-5", title: "Split AC Filter Cleaning & Gas Check", roomNumber: "301", priority: "Medium", status: "Resolved", reportedDate: "2026-07-25", schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_maintenance_demo", defaultMaint);
    return { success: true, data };
  }

  if (path === "/hostel-visitors" || path === "/hostel_visitors") {
    const defaultVis = [
      { id: "vis-1", visitorName: "Rajesh Sharma", studentName: "Aarav Sharma", relation: "Father", checkIn: "2026-07-20 10:00 AM", checkOut: "2026-07-20 01:00 PM", status: "Checked Out", schoolId: "school-1" },
      { id: "vis-2", visitorName: "Ketan Patel", studentName: "Diya Patel", relation: "Father", checkIn: "2026-07-22 11:30 AM", checkOut: "2026-07-22 02:30 PM", status: "Checked Out", schoolId: "school-1" },
      { id: "vis-3", visitorName: "Sanjay Gupta", studentName: "Rohan Gupta", relation: "Father", checkIn: "2026-07-24 09:00 AM", checkOut: "2026-07-24 12:00 PM", status: "Checked Out", schoolId: "school-1" },
      { id: "vis-4", visitorName: "Vikram Verma", studentName: "Ishaan Verma", relation: "Father", checkIn: "2026-07-25 02:00 PM", checkOut: "2026-07-25 05:00 PM", status: "Checked Out", schoolId: "school-1" },
      { id: "vis-5", visitorName: "Debabrata Roy", studentName: "Ananya Roy", relation: "Father", checkIn: "2026-07-26 10:30 AM", checkOut: "2026-07-26 01:30 PM", status: "Checked Out", schoolId: "school-1" }
    ];
    const data = getStored("sms_hostel_visitors_demo", defaultVis);
    return { success: true, data };
  }

  if (path === "/biometrics/devices" || path === "/biometrics/device") {
    const data = getStored("sms_biometric_devices_demo", DUMMY_BIOMETRIC_DEVICES);
    return { success: true, data };
  }

  if (path.startsWith("/biometrics/log") || path.startsWith("/biometrics/logs")) {
    const data = getStored("sms_biometric_logs_demo", DUMMY_BIOMETRIC_LOGS);
    return { success: true, data };
  }

const DUMMY_EVENTS = [
  { id: "ev-1", title: "Annual Science & Innovation Expo 2026", description: "Inter-school robotics, AI, and green energy model exhibition.", date: "2026-08-15", startDate: "2026-08-15", endDate: "2026-08-15", time: "09:00 AM - 04:00 PM", startTime: "09:00 AM", endTime: "04:00 PM", location: "Auditorium Main Hall", venue: "Auditorium Main Hall", category: "Academic", organizer: "Science Department", targetAudience: "All Students & Parents", status: "upcoming", schoolId: "school-1" },
  { id: "ev-2", title: "Inter-House Athletics & Football Tournament", description: "Track & field sprints, high jump, and inter-house football championship.", date: "2026-08-25", startDate: "2026-08-25", endDate: "2026-08-26", time: "08:00 AM - 05:00 PM", startTime: "08:00 AM", endTime: "05:00 PM", location: "School Sports Ground", venue: "School Sports Ground", category: "Sports", organizer: "Physical Education Dept", targetAudience: "Classes 6th to 12th", status: "upcoming", schoolId: "school-1" },
  { id: "ev-3", title: "Independence Day Cultural Celebration", description: "Flag hoisting, patriotic songs, classical dance, and drama performances.", date: "2026-08-15", startDate: "2026-08-15", endDate: "2026-08-15", time: "07:30 AM - 11:30 AM", startTime: "07:30 AM", endTime: "11:30 AM", location: "Central Quadrangle", venue: "Central Quadrangle", category: "Cultural", organizer: "Cultural Committee", targetAudience: "Entire School Community", status: "upcoming", schoolId: "school-1" },
  { id: "ev-4", title: "Teachers' Day Felicitation & Award Ceremony", description: "Special student-led program honoring faculty achievements.", date: "2026-09-05", startDate: "2026-09-05", endDate: "2026-09-05", time: "10:00 AM - 01:00 PM", startTime: "10:00 AM", endTime: "01:00 PM", location: "Subhash Auditorium", venue: "Subhash Auditorium", category: "Celebration", organizer: "Student Council", targetAudience: "Staff & High School Students", status: "upcoming", schoolId: "school-1" },
  { id: "ev-5", title: "Parent-Teacher Interactive Symposium", description: "Comprehensive discussion on holistic student growth and academic feedback.", date: "2026-09-20", startDate: "2026-09-20", endDate: "2026-09-20", time: "09:00 AM - 02:00 PM", startTime: "09:00 AM", endTime: "02:00 PM", location: "Main Academic Block", venue: "Main Academic Block", category: "Meeting", organizer: "School Administration", targetAudience: "Parents & Faculty", status: "upcoming", schoolId: "school-1" }
];

  if (path === "/events") {
    let events = getStored("sms_events_demo", DUMMY_EVENTS);
    if (!events || events.length === 0 || !events[0].venue) {
      events = DUMMY_EVENTS;
      try { localStorage.setItem("sms_events_demo", JSON.stringify(DUMMY_EVENTS)); } catch(e){}
    }
    return { success: true, data: events };
  }

  if (path === "/dashboard/stats" || path === "/health") {
    const schools = getStored("sms_schools_demo", DUMMY_SCHOOLS);
    const users = getStored("sms_users_demo", DUMMY_USERS);
    const plans = getStored("sms_plans_demo", DUMMY_PLANS);
    return {
      success: true,
      data: {
        totalSchools: schools.length,
        totalUsers: users.length,
        totalTeachers: users.filter(u => u.role === "teacher").length,
        totalStudents: users.filter(u => u.role === "student").length,
        totalActiveSchools: schools.filter(s => s.isActive !== false).length,
        activeSubscriptions: schools.length,
        totalRevenue: schools.reduce((acc, s) => acc + (s.amount || 0), 0)
      }
    };
  }

  if (path === "/auth/login" && method === "POST") {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
    const email = (body.email || "").toLowerCase().trim();
    const users = getStored("sms_users_demo", DUMMY_USERS);
    const found = users.find(u => (u.email || "").toLowerCase() === email || (u.phone || "") === email) || users[0];
    const token = "mock_jwt_token_" + found.id;
    localStorage.setItem("sms_token", token);
    localStorage.setItem("sms_user", JSON.stringify(found));
    return { success: true, token, user: found, role: found.role };
  }

  if (path === "/auth/me" && method === "GET") {
    const storedUser = JSON.parse(localStorage.getItem("sms_user") || "{}");
    return { success: true, data: storedUser };
  }

  if (path === "/schools") {
    let schools = getStored("sms_schools_demo", DUMMY_SCHOOLS);
    if (method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const newSchool = { id: "school-" + Date.now(), schoolId: "school-" + Date.now(), ...body, teachers: 5, students: 5, status: "Paid", isActive: true };
      schools.push(newSchool);
      setStored("sms_schools_demo", schools);
      return { success: true, message: "School created", data: newSchool };
    }
    return { success: true, data: schools, meta: { total: schools.length } };
  }

  if (path.startsWith("/schools/")) {
    const id = path.replace("/schools/", "");
    let schools = getStored("sms_schools_demo", DUMMY_SCHOOLS);
    const found = schools.find(s => s.id === id || s.schoolId === id) || schools[0];
    if (method === "PUT") {
      const body = JSON.parse(options.body || "{}");
      Object.assign(found, body);
      setStored("sms_schools_demo", schools);
      return { success: true, data: found };
    }
    return { success: true, data: found };
  }

  if (path === "/users" || path === "/teachers" || path === "/staff") {
    let users = getStored("sms_users_demo", DUMMY_USERS);
    const targetRole = params.role || (path === "/teachers" ? "teacher" : null);
    if (targetRole) {
      users = users.filter(u => u.role === targetRole);
    }
    if (method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const newUser = { id: "usr-" + Date.now(), ...body, isActive: true };
      const allUsers = getStored("sms_users_demo", DUMMY_USERS);
      allUsers.push(newUser);
      setStored("sms_users_demo", allUsers);
      return { success: true, message: "User created", data: newUser };
    }
    return { success: true, data: users, meta: { total: users.length } };
  }

  if (path.startsWith("/users/")) {
    const id = path.replace("/users/", "");
    let users = getStored("sms_users_demo", DUMMY_USERS);
    const found = users.find(u => u.id === id) || users[0];
    if (method === "PUT") {
      const body = JSON.parse(options.body || "{}");
      Object.assign(found, body);
      setStored("sms_users_demo", users);
    }
    return { success: true, data: found };
  }

  if (path === "/plans") {
    const plans = getStored("sms_plans_demo", DUMMY_PLANS);
    return { success: true, data: plans };
  }

  if (path === "/classes") {
    const classes = getStored("sms_classes_demo", DUMMY_CLASSES);
    return { success: true, data: classes };
  }

  if (path === "/subjects") {
    const subjects = getStored("sms_subjects_demo", DUMMY_SUBJECTS);
    return { success: true, data: subjects };
  }

  if (path === "/exams") {
    const exams = getStored("sms_exams_demo", DUMMY_EXAMS);
    return { success: true, data: exams };
  }

  if (path === "/notices" || path === "/announcements") {
    const notices = getStored("sms_notices_demo", DUMMY_NOTICES);
    return { success: true, data: notices };
  }

  if (path === "/books") {
    const books = getStored("sms_books_demo", DUMMY_BOOKS);
    return { success: true, data: books };
  }

  if (path === "/book_categories" || path === "/book-categories") {
    const cats = getStored("sms_book_categories_demo", DUMMY_BOOK_CATEGORIES);
    return { success: true, data: cats };
  }

  if (path === "/issued_books" || path === "/issued-books") {
    const issued = getStored("sms_issued_books_demo", DUMMY_ISSUED_BOOKS);
    return { success: true, data: issued };
  }

  if (path === "/homework" || path === "/homeworks") {
    const hw = getStored("sms_homeworks_demo", DUMMY_HOMEWORKS);
    return { success: true, data: hw };
  }

  if (path === "/assignments") {
    const as = getStored("sms_assignments_demo", DUMMY_ASSIGNMENTS);
    return { success: true, data: as };
  }

  if (path === "/attendances" || path === "/attendance") {
    const att = getStored("sms_attendances_demo", DUMMY_ATTENDANCES);
    return { success: true, data: att };
  }

  if (path === "/timetables" || path === "/timetable") {
    const tt = getStored("sms_timetables_demo", DUMMY_TIMETABLES);
    return { success: true, data: tt };
  }

  if (path === "/contacts") {
    let contacts = getStored("sms_contacts_demo", DUMMY_CONTACTS);
    if (method === "POST") {
      const body = typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
      const newTicket = { id: "cnt-" + Date.now(), ...body, status: "new", createdAt: new Date().toISOString() };
      contacts.push(newTicket);
      setStored("sms_contacts_demo", contacts);
      return { success: true, message: "Ticket created", data: newTicket };
    }
    return { success: true, data: contacts, meta: { total: contacts.length } };
  }

  if (path === "/buses/drivers") {
    let users = getStored("sms_users_demo", DUMMY_USERS);
    let drivers = users.filter(u => u.role === "driver");
    if (!drivers || drivers.length === 0) {
      drivers = DUMMY_USERS.filter(u => u.role === "driver");
    }
    return { success: true, data: drivers };
  }

  if (path === "/buses/students/assign" && method === "POST") {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
    const { studentId, busId } = body;
    const users = getStored("sms_users_demo", DUMMY_USERS);
    const buses = getStored("sms_buses_demo", DUMMY_BUSES);
    const busObj = buses.find(b => b.id === busId);
    const targetStudent = users.find(u => u.id === studentId);
    if (targetStudent) {
      targetStudent.busId = busId || null;
      targetStudent.busNumber = busObj ? busObj.busNumber : null;
      setStored("sms_users_demo", users);
    }
    return { success: true, message: "Bus assigned to student", data: targetStudent };
  }

  if (path === "/buses/students") {
    let users = getStored("sms_users_demo", DUMMY_USERS);
    let students = users.filter(u => u.role === "student");
    if (!students || students.length === 0) {
      students = DUMMY_USERS.filter(u => u.role === "student");
    }
    return { success: true, data: students };
  }

  if (path === "/buses/live" || path.startsWith("/buses/trip")) {
    let buses = getStored("sms_buses_demo", DUMMY_BUSES);
    if (!buses || buses.length === 0) {
      buses = DUMMY_BUSES;
    }
    return { success: true, data: buses };
  }

  if (path.startsWith("/buses")) {
    let buses = getStored("sms_buses_demo", DUMMY_BUSES);
    if (!buses || buses.length === 0) {
      buses = DUMMY_BUSES;
    }
    return { success: true, data: buses };
  }

  return { success: true, data: [], meta: { total: 0 } };
}
