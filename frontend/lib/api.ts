function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveApiBaseUrl();

const TOKEN_KEY = "uninotes_token";
const USER_KEY = "uninotes_user";

export type AuthUser = { id: string; email: string; role: string };

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options?: RequestInit, opts?: { skipAuth?: boolean }): Promise<T> {
  const hasBody = options?.body !== undefined && options?.body !== null;
  const token = opts?.skipAuth ? null : getAuthToken();
  const baseHeaders: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};
  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401 && !opts?.skipAuth) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function downloadFile(
  path: string,
  filename: string,
  opts?: { skipAuth?: boolean }
): Promise<void> {
  const token = opts?.skipAuth ? null : getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ApiParcoursRef = { id: string; code: string; nom: string };

export type ApiNiveauRef = { id: string; code: string; nom: string };

export type ApiStudent = {
  id_etudiant: string;
  numero_matricule: string;
  nom_etudiant: string;
  prenom_etudiant: string;
  date_naissance: string | null;
  filiere: string;
  annee_academique: string;
  contact_etudiant: string | null;
  email_etudiant: string | null;
  statut: "Actif" | "Suspendu" | "Redoublant" | "Diplome" | "Abandon" | "Exclu" | "Transfere" | "Supprime";
  created_at?: string;
  parcours?: ApiParcoursRef | null;
  niveau?: ApiNiveauRef | null;
};

export type ApiStudentDetail = ApiStudent & {
  parcours: (ApiParcoursRef & { description?: string | null }) | null;
  niveau: ApiNiveauRef | null;
};

export type ApiStudentPayload = {
  numero_matricule: string;
  nom_etudiant: string;
  prenom_etudiant: string;
  date_naissance?: string | null;
  filiere: string;
  annee_academique: string;
  contact_etudiant?: string | null;
  email_etudiant?: string | null;
  parcours_id?: string | null;
  niveau_id?: string | null;
  statut?: ApiStudent["statut"];
};

export type ApiTeacher = {
  id_enseignant: string;
  nom_enseignant: string;
  prenom_enseignant: string;
  departement: string;
  contact_enseignant: string | null;
  email_enseignant: string | null;
  statut: "Actif" | "Supprime";
  modules_count?: number;
  matieres_count?: number;
};

export type ApiEnseignantRef = {
  id_enseignant: string;
  nom_enseignant: string;
  prenom_enseignant: string;
  departement: string;
};

export type ApiModule = {
  id_module: string;
  code_module: string;
  nom_module: string;
  credits_ects: number;
  coefficient_module: number;
  semestre: string;
  annee_academique: string;
  id_enseignant_responsable: string;
  statut: "Actif" | "Supprime";
  niveau_libelle?: string | null;
  enseignant?: ApiEnseignantRef;
  annee_universitaire_id?: string | null;
  niveau_id?: string | null;
  parcours_id?: string | null;
  annee_universitaire?: ApiAcademicAnnee | null;
  niveau?: ApiNiveauRef | null;
  parcours?: ApiParcoursRef | null;
};

export type ApiMatiere = {
  id: string;
  code: string;
  nom: string;
  coefficient: number;
  module_id: string;
  semestre?: string | null;
  statut: "Actif" | "Supprime";
  module?: { id_module: string; code_module: string; nom_module: string; semestre?: string } | null;
  _count?: { enseignants: number };
};

export type ApiGrade = {
  id_note: string;
  id_etudiant: string;
  id_module: string;
  note_obtenue: number;
  type_evaluation: "Examen" | "TP" | "Projet" | "Rattrapage" | "Controle Continu";
  date_saisie: string;
  statut: "Valide" | "Supprimee";
  nom_etudiant?: string;
  prenom_etudiant?: string;
  nom_module?: string;
  code_module?: string;
  semestre?: string;
  annee_academique?: string;
};

export type ApiSessionExamen = {
  id: string;
  nom: string;
  type_session: "Normale" | "Rattrapage" | "Speciale";
  date_debut: string;
  date_fin: string;
  statut: "Actif" | "Supprime";
  annee_universitaire_id: string;
  annee_universitaire?: ApiAcademicAnnee;
};

export type ApiNoteHistory = {
  id: string;
  note_id: string;
  ancienne_valeur: number;
  nouvelle_valeur: number;
  motif: string | null;
  modifie_par: string | null;
  date_modif: string;
  note?: ApiGrade & {
    etudiant?: ApiStudent;
    module?: ApiModule;
  };
};

export type ApiAuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  table_cible: string;
  record_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: string; email: string; nom: string; prenom: string; role: string } | null;
};

export type ApiNotification = {
  id: string;
  type: "Info" | "Alerte" | "Systeme";
  titre: string;
  message: string;
  lu: boolean;
  user_id: string | null;
  etudiant_id: string | null;
  enseignant_id: string | null;
  created_at: string;
  user?: { id: string; email: string; nom: string; prenom: string; role: string } | null;
  etudiant?: { id_etudiant: string; nom_etudiant: string; prenom_etudiant: string } | null;
  enseignant?: { id_enseignant: string; nom_enseignant: string; prenom_enseignant: string } | null;
};

export type ApiDeliberation = {
  id: string;
  etudiant_id: string;
  note_id: string;
  moyenne_generale: number;
  est_valide: boolean;
  date_deliberation: string;
  etudiant: { id_etudiant: string; numero_matricule: string; nom_etudiant: string; prenom_etudiant: string };
  note: { id_note: string; module: { id_module: string; code_module: string; nom_module: string; coefficient_module: number; credits_ects: number } };
  decision_jury: { id: string; decision: string; commentaire: string | null; date_decision: string } | null;
  mention: { id: string; mention: string; note_min: number | null; note_max: number | null } | null;
};

export type ApiDecisionJury = {
  id: string;
  deliberation_id: string;
  decision: string;
  commentaire: string | null;
  date_decision: string;
  deliberation: ApiDeliberation;
};

export type ApiMention = {
  id: string;
  deliberation_id: string;
  mention: string;
  note_min: number | null;
  note_max: number | null;
  deliberation: ApiDeliberation;
};

export type ApiAcademicAnnee = {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  est_active?: boolean;
};

export type ParcoursEtatMetier = "Actif" | "En_Developpement" | "Archive" | "Obsolete";

export type ApiAcademicParcours = ApiParcoursRef & {
  description?: string | null;
  statut?: string;
  etat_metier?: ParcoursEtatMetier;
  responsable_id?: string | null;
  responsable?: ApiEnseignantRef | null;
  institution_id?: string | null;
  institution?: { id: string; nom: string; sigle?: string } | null;
  created_at?: string;
  updated_at?: string;
  _count?: { niveaux: number; modules: number; etudiants: number };
};

export type ApiTeacherPayload = {
  nom_enseignant: string;
  prenom_enseignant: string;
  departement: string;
  contact_enseignant?: string | null;
  email_enseignant?: string | null;
};

export type ApiAcademicNiveau = ApiNiveauRef & {
  parcours_id: string;
  annee_universitaire_id?: string;
  parcours?: ApiParcoursRef;
  annee_universitaire?: { id: string; libelle: string };
};

export type ApiSystemUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statut: "Actif" | "Supprime";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiSystemUserPayload = {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: string;
  statut?: "Actif" | "Supprime";
};

export type ApiSystemUserUpdatePayload = Partial<
  Omit<ApiSystemUserPayload, "password"> & { password?: string; statut?: "Actif" | "Supprime" }
>;

export type ApiCursusOverview = {
  totalParcours: number;
  totalNiveaux: number;
  totalModules: number;
  totalAnnees: number;
  activeAnneeLibelle: string | null;
  activeAnneeId: string | null;
};

export type ApiInstitutionStatut = "Active" | "En_Projet" | "Archivee";

export type ApiInstitution = {
  id: string;
  nom: string;
  sigle: string;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  email_contact: string | null;
  site_web: string | null;
  description: string | null;
  statut: ApiInstitutionStatut;
  created_at: string;
  updated_at: string;
};

export type ApiInstitutionPayload = {
  nom: string;
  sigle: string;
  adresse?: string | null;
  ville?: string | null;
  pays?: string | null;
  email_contact?: string | null;
  site_web?: string | null;
  description?: string | null;
  statut?: ApiInstitutionStatut;
};

export type ApiInstitutionResponse = {
  institution: ApiInstitution;
  counts: {
    totalParcours: number;
    totalEtudiants: number;
    totalEnseignants: number;
    totalModules: number;
  };
};

export type ApiInstitutionListItem = ApiInstitution & {
  nb_parcours: number;
  nb_etudiants: number;
  nb_enseignants: number;
  nb_modules: number;
};

export type TrashPayload = {
  students: ApiStudent[];
  teachers: ApiTeacher[];
  modules: ApiModule[];
  grades: ApiGrade[];
};

export const api = {
  health: () => request<{ status: string }>("/api/health", undefined, { skipAuth: true }),
  searchStudents: (query: string) => request<ApiStudent[]>(`/api/search/students?q=${encodeURIComponent(query)}`),
  searchTeachers: (query: string) => request<ApiTeacher[]>(`/api/search/teachers?q=${encodeURIComponent(query)}`),
  searchModules: (query: string) => request<ApiModule[]>(`/api/search/modules?q=${encodeURIComponent(query)}`),

  listDeliberations: () => request<ApiDeliberation[]>("/api/deliberations"),
  generateDeliberations: () => request<{ generated: number; deliberations: ApiDeliberation[] }>("/api/deliberations/generate", { method: "POST" }),
  listDecisionsJury: () => request<ApiDecisionJury[]>("/api/decisions-jury"),
  listMentions: () => request<ApiMention[]>("/api/mentions"),

  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { skipAuth: true }
    ),
  register: (payload: { email: string; password: string; nom: string; prenom: string; role: string }) =>
    request<{ token: string; user: AuthUser & { nom: string; prenom: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
      { skipAuth: true }
    ),
  me: () => request<{ user: ApiSystemUser }>("/api/auth/me"),

  cursusOverview: () => request<ApiCursusOverview>("/api/cursus/overview"),

  getInstitution: () => request<ApiInstitutionResponse>("/api/institution"),
  getInstitutionDetail: (id: string) =>
    request<ApiInstitutionResponse>(`/api/institution/${encodeURIComponent(id)}`),
  listInstitutions: () => request<ApiInstitutionListItem[]>("/api/institutions"),
  createInstitution: (payload: ApiInstitutionPayload) =>
    request<ApiInstitution>("/api/institutions", { method: "POST", body: JSON.stringify(payload) }),
  updateInstitution: (id: string, payload: ApiInstitutionPayload) =>
    request<ApiInstitution>(`/api/institution/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listUsers: () => request<ApiSystemUser[]>("/api/users"),
  getUser: (id: string) => request<ApiSystemUser>(`/api/users/${encodeURIComponent(id)}`),
  createUser: (payload: ApiSystemUserPayload) =>
    request<ApiSystemUser>("/api/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: ApiSystemUserUpdatePayload) =>
    request<ApiSystemUser>(`/api/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) => request<void>(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  resetUserPassword: (id: string, password: string) =>
    request<ApiSystemUser>(`/api/users/${encodeURIComponent(id)}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  usersPermissionsMatrix: () => request<Record<string, string[]>>("/api/users/permissions-matrix"),

  listStudents: () => request<ApiStudent[]>("/api/students"),
  getStudent: (id: string) => request<ApiStudentDetail>(`/api/students/${encodeURIComponent(id)}`),
  createStudent: (payload: ApiStudentPayload) =>
    request<ApiStudent>("/api/students", { method: "POST", body: JSON.stringify(payload) }),
  updateStudent: (id: string, payload: ApiStudentPayload) =>
    request<ApiStudent>(`/api/students/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteStudent: (id: string) => request<void>(`/api/students/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listTeachers: () => request<ApiTeacher[]>("/api/teachers"),
  getTeacher: (id: string) => request<unknown>(`/api/teachers/${encodeURIComponent(id)}`),
  createTeacher: (payload: ApiTeacherPayload) =>
    request<ApiTeacher>("/api/teachers", { method: "POST", body: JSON.stringify(payload) }),
  updateTeacher: (id: string, payload: ApiTeacherPayload & { statut?: ApiTeacher["statut"] }) =>
    request<ApiTeacher>(`/api/teachers/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTeacher: (id: string) => request<void>(`/api/teachers/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listModules: () => request<ApiModule[]>("/api/modules"),
  createModule: (payload: Omit<ApiModule, "id_module" | "statut">) =>
    request<ApiModule>("/api/modules", { method: "POST", body: JSON.stringify(payload) }),
  updateModule: (id: string, payload: Omit<ApiModule, "id_module" | "statut">) =>
    request<ApiModule>(`/api/modules/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteModule: (id: string) => request<void>(`/api/modules/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listMatieres: () => request<ApiMatiere[]>("/api/matieres"),
  listEnseignantMatieres: () => request<Array<{ id: string; enseignant_id: string; matiere_id: string; created_at: string; enseignant: ApiEnseignantRef; matiere: ApiMatiere & { module: { id_module: string; code_module: string; nom_module: string } } }>>("/api/enseignant-matieres"),
  createEnseignantMatiere: (payload: { enseignant_id: string; matiere_id: string }) =>
    request("/api/enseignant-matieres", { method: "POST", body: JSON.stringify(payload) }),
  deleteEnseignantMatiere: (id: string) =>
    request<void>(`/api/enseignant-matieres/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createMatiere: (payload: {
    code: string;
    nom: string;
    coefficient: number;
    module_id: string;
    semestre: string;
  }) => request<ApiMatiere>("/api/matieres", { method: "POST", body: JSON.stringify(payload) }),
  updateMatiere: (
    id: string,
    payload: { code: string; nom: string; coefficient: number; module_id: string; semestre: string }
  ) => request<ApiMatiere>(`/api/matieres/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  deleteMatiere: (id: string) => request<void>(`/api/matieres/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listGrades: (query?: { studentId?: string }) => {
    const q = query?.studentId
      ? `?studentId=${encodeURIComponent(query.studentId)}`
      : "";
    return request<ApiGrade[]>(`/api/grades${q}`);
  },
  createGrade: (payload: Omit<ApiGrade, "id_note" | "statut">) =>
    request<ApiGrade>("/api/grades", { method: "POST", body: JSON.stringify(payload) }),
  deleteGrade: (id: string) => request<void>(`/api/grades/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listSessionsExamen: () => request<ApiSessionExamen[]>("/api/sessions-examen"),
  createSessionExamen: (payload: Omit<ApiSessionExamen, "id" | "statut">) =>
    request<ApiSessionExamen>("/api/sessions-examen", { method: "POST", body: JSON.stringify(payload) }),
  updateSessionExamen: (id: string, payload: Partial<Omit<ApiSessionExamen, "id">>) =>
    request<ApiSessionExamen>(`/api/sessions-examen/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteSessionExamen: (id: string) =>
    request<void>(`/api/sessions-examen/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listNoteHistory: (query?: { studentId?: string; moduleId?: string; limit?: number }) => {
    const qp = new URLSearchParams();
    if (query?.studentId) qp.set("studentId", query.studentId);
    if (query?.moduleId) qp.set("moduleId", query.moduleId);
    if (typeof query?.limit === "number") qp.set("limit", String(query.limit));
    const q = qp.toString();
    return request<ApiNoteHistory[]>(`/api/note-history${q ? `?${q}` : ""}`);
  },
  listAuditLogs: (query?: {
    action?: string;
    table?: string;
    userId?: string;
    search?: string;
    limit?: number;
  }) => {
    const qp = new URLSearchParams();
    if (query?.action) qp.set("action", query.action);
    if (query?.table) qp.set("table", query.table);
    if (query?.userId) qp.set("userId", query.userId);
    if (query?.search) qp.set("search", query.search);
    if (typeof query?.limit === "number") qp.set("limit", String(query.limit));
    const q = qp.toString();
    return request<ApiAuditLog[]>(`/api/audit-logs${q ? `?${q}` : ""}`);
  },
  purgeAuditLogs: (before?: string) =>
    request<void>(`/api/audit-logs${before ? `?before=${encodeURIComponent(before)}` : ""}`, {
      method: "DELETE",
    }),
  listNotifications: (query?: { lu?: boolean; type?: string; userId?: string; limit?: number }) => {
    const qp = new URLSearchParams();
    if (typeof query?.lu === "boolean") qp.set("lu", String(query.lu));
    if (query?.type) qp.set("type", query.type);
    if (query?.userId) qp.set("userId", query.userId);
    if (typeof query?.limit === "number") qp.set("limit", String(query.limit));
    const q = qp.toString();
    return request<ApiNotification[]>(`/api/notifications${q ? `?${q}` : ""}`);
  },
  createNotification: (payload: {
    type: "Info" | "Alerte" | "Systeme";
    titre: string;
    message: string;
    user_id?: string;
    etudiant_id?: string;
    enseignant_id?: string;
  }) =>
    request<ApiNotification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  markNotificationRead: (id: string, lu: boolean) =>
    request<ApiNotification>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "PUT",
      body: JSON.stringify({ lu }),
    }),
  deleteNotification: (id: string) =>
    request<void>(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }),

  listAcademicAnnees: () => request<ApiAcademicAnnee[]>("/api/academic/annees"),
  listAcademicParcours: () => request<ApiAcademicParcours[]>("/api/academic/parcours"),
  listAcademicNiveaux: (parcoursId?: string) => {
    const q = parcoursId ? `?parcoursId=${encodeURIComponent(parcoursId)}` : "";
    return request<ApiAcademicNiveau[]>(`/api/academic/niveaux${q}`);
  },

  listCursusAnnees: (all = false) =>
    request<ApiAcademicAnnee[]>(`/api/cursus/annees-universitaires${all ? "?all=1" : ""}`),
  createCursusAnnee: (
    payload: Pick<ApiAcademicAnnee, "libelle" | "date_debut" | "date_fin"> & {
      est_active?: boolean;
      statut?: "Actif" | "Supprime";
    }
  ) =>
    request<ApiAcademicAnnee>("/api/cursus/annees-universitaires", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCursusAnnee: (
    id: string,
    payload: Partial<Pick<ApiAcademicAnnee, "libelle" | "date_debut" | "date_fin">> & {
      est_active?: boolean;
      statut?: "Actif" | "Supprime";
    }
  ) =>
    request<ApiAcademicAnnee>(`/api/cursus/annees-universitaires/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCursusAnnee: (id: string) =>
    request<void>(`/api/cursus/annees-universitaires/${encodeURIComponent(id)}`, { method: "DELETE" }),
  activateCursusAnnee: (id: string) =>
    request<ApiAcademicAnnee>(`/api/cursus/annees-universitaires/${encodeURIComponent(id)}/activate`, {
      method: "POST",
    }),

  listCursusParcours: (all = true) =>
    request<ApiAcademicParcours[]>(`/api/cursus/parcours${all ? "?all=1" : ""}`),
  createCursusParcours: (payload: {
    code: string;
    nom: string;
    description?: string | null;
    etat_metier?: ParcoursEtatMetier;
    responsable_id?: string | null;
    institution_id?: string | null;
  }) =>
    request<ApiAcademicParcours>("/api/cursus/parcours", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCursusParcours: (
    id: string,
    payload: Partial<{
      code: string;
      nom: string;
      description: string | null;
      etat_metier: ParcoursEtatMetier;
      responsable_id: string | null;
      institution_id: string | null;
    }>
  ) =>
    request<ApiAcademicParcours>(`/api/cursus/parcours/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCursusParcours: (id: string) =>
    request<void>(`/api/cursus/parcours/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getParcoursDetail: (id: string) =>
    request<unknown>(`/api/cursus/parcours/${encodeURIComponent(id)}/detail`),

  listCursusNiveaux: (opts?: { all?: boolean; parcoursId?: string }) => {
    const p = new URLSearchParams();
    if (opts?.all) p.set("all", "1");
    if (opts?.parcoursId) p.set("parcoursId", opts.parcoursId);
    const q = p.toString();
    return request<ApiAcademicNiveau[]>(`/api/cursus/niveaux${q ? `?${q}` : ""}`);
  },
  createCursusNiveau: (payload: {
    code: string;
    nom: string;
    parcours_id: string;
    annee_universitaire_id: string;
  }) =>
    request<ApiAcademicNiveau>("/api/cursus/niveaux", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCursusNiveau: (
    id: string,
    payload: Partial<{
      code: string;
      nom: string;
      parcours_id: string;
      annee_universitaire_id: string;
    }>
  ) =>
    request<ApiAcademicNiveau>(`/api/cursus/niveaux/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCursusNiveau: (id: string) =>
    request<void>(`/api/cursus/niveaux/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getModuleDetail: (id: string) =>
    request<unknown>(`/api/cursus/modules/${encodeURIComponent(id)}/detail`),

  getTrash: () => request<TrashPayload>("/api/trash"),
  restoreTrashItem: (entity: "etudiants" | "enseignants" | "modules" | "notes", id: string) =>
    request<{ restored: boolean }>("/api/trash/restore", {
      method: "POST",
      body: JSON.stringify({ entity, id }),
    }),
  deleteTrashItem: (entity: "etudiants" | "enseignants" | "modules" | "notes", id: string) =>
    request<void>(`/api/trash/${entity}/${id}`, { method: "DELETE" }),
  emptyTrash: () => request<{ emptied: boolean }>("/api/trash", { method: "DELETE" }),

  studentStats: (studentId: string) =>
    request<Array<{ moyenne_ponderee: number | null }>>(`/api/stats/student/${encodeURIComponent(studentId)}`),
};
