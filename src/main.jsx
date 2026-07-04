import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Banknote,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Upload,
  UserCog,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { supabase, supabaseConfig } from "./lib/supabaseClient";
import "./styles.css";

const modules = [
  { id: "dashboard", label: "الصفحة الرئيسية", icon: LayoutDashboard },
  { id: "employees", label: "الموظفون", icon: Users },
  { id: "attendance", label: "الحضور والانصراف", icon: Clock3 },
  { id: "leaves", label: "الإجازات والسفر", icon: CalendarDays },
  { id: "finance", label: "المالية", icon: WalletCards },
  { id: "payroll", label: "الرواتب", icon: Banknote },
  { id: "reports", label: "التقارير", icon: ClipboardList },
  { id: "documents", label: "وثائق المنشأة", icon: FileText },
  { id: "users", label: "إدارة المستخدمين", icon: UserCog },
  { id: "settings", label: "الإعدادات", icon: Settings }
];

const employeeStatuses = {
  active: "على رأس العمل",
  leave: "في إجازة",
  travel: "مسافر",
  suspended: "متوقف",
  terminated: "منتهي الخدمات"
};

const emptyEmployee = {
  first_name: "",
  father_name: "",
  family_name: "",
  employee_no: "",
  national_id: "",
  phone: "",
  department: "",
  role_title: "",
  status: "active",
  start_date: "",
  base_salary: "",
  allowances: ""
};

function money(value) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function fullName(employee) {
  return [employee.first_name, employee.father_name, employee.family_name].filter(Boolean).join(" ") || "بدون اسم";
}

function safeFileName(name) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

function Badge({ status }) {
  return <span className={`status-badge status-${status || "active"}`}>{employeeStatuses[status] || status || "نشط"}</span>;
}

function SetupScreen() {
  return (
    <main className="setup-screen">
      <section className="setup-panel">
        <Database size={34} />
        <h1>إعداد Supabase مطلوب</h1>
        <p>أضف متغيرات البيئة في Vercel ثم أعد النشر.</p>
        <pre>{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}</pre>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("بيانات الدخول غير صحيحة أو الحساب غير مفعل.");
      setBusy(false);
      return;
    }
    await onLogin();
    setBusy(false);
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-tile">ف</div>
        <h1>الفريح</h1>
        <label>
          <span>البريد الإلكتروني</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
        </label>
        <label>
          <span>كلمة المرور</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-btn" type="submit" disabled={busy}>{busy ? "جاري الدخول..." : "دخول"}</button>
      </form>
    </main>
  );
}

function Header({ title, profile, onMenu, onLogout }) {
  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" type="button" onClick={onMenu} aria-label="القائمة"><Menu size={20} /></button>
      <div>
        <h1>{title}</h1>
        <span>{profile?.full_name || profile?.email || "مستخدم"}</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" type="button" aria-label="الإشعارات"><Bell size={19} /></button>
        <button className="logout-btn" type="button" onClick={onLogout}><LogOut size={18} /> خروج</button>
      </div>
    </header>
  );
}

function Sidebar({ active, onChange, open, onClose, employeeCount }) {
  return (
    <>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-tile">ف</div>
          <div><strong>الفريح</strong><span>نظام الإدارة</span></div>
        </div>
        <nav>
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? "active" : ""} type="button" onClick={() => { onChange(item.id); onClose(); }}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === "employees" ? <small>{employeeCount}</small> : null}
              </button>
            );
          })}
        </nav>
      </aside>
      <button className={`sidebar-scrim ${open ? "is-open" : ""}`} type="button" aria-label="إغلاق القائمة" onClick={onClose} />
    </>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Dashboard({ employees }) {
  const active = employees.filter((employee) => employee.status === "active").length;
  const payroll = employees.reduce((sum, employee) => sum + Number(employee.base_salary || 0) + Number(employee.allowances || 0), 0);

  return (
    <section className="page-grid">
      <div className="stats-grid">
        <Stat label="إجمالي الموظفين" value={employees.length} icon={Users} tone="teal" />
        <Stat label="على رأس العمل" value={active} icon={Check} tone="green" />
        <Stat label="إجمالي الرواتب" value={money(payroll)} icon={Banknote} tone="amber" />
        <Stat label="وثائق نشطة" value="0" icon={FileText} tone="violet" />
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>أحدث الموظفين</h2>
          <span>{employees.length} سجل</span>
        </div>
        <EmployeeTable employees={employees.slice(0, 6)} compact />
      </section>
    </section>
  );
}

function EmployeeTable({ employees, compact, onEdit }) {
  if (!employees.length) {
    return <div className="empty-state">لا توجد بيانات</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>رقم الموظف</th>
            <th>الموظف</th>
            <th>القسم</th>
            <th>المهنة</th>
            <th>الجوال</th>
            <th>الحالة</th>
            {!compact ? <th>إجراء</th> : null}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.employee_no || "-"}</td>
              <td>{fullName(employee)}</td>
              <td>{employee.department || "-"}</td>
              <td>{employee.role_title || "-"}</td>
              <td dir="ltr">{employee.phone || "-"}</td>
              <td><Badge status={employee.status} /></td>
              {!compact ? <td><button className="small-btn" type="button" onClick={() => onEdit(employee)}>تعديل</button></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeDialog({ employee, onClose, onSaved }) {
  const [form, setForm] = useState(employee || emptyEmployee);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const id = form.id || crypto.randomUUID();
    let attachmentPath = form.attachment_path || null;
    try {
      if (file) {
        const path = `employees/${id}/${Date.now()}-${safeFileName(file.name)}`;
        const upload = await supabase.storage.from("employee-attachments").upload(path, file, { upsert: false });
        if (upload.error) throw upload.error;
        attachmentPath = path;
      }
      const payload = {
        id,
        first_name: form.first_name,
        father_name: form.father_name,
        family_name: form.family_name,
        employee_no: form.employee_no,
        national_id: form.national_id,
        phone: form.phone,
        department: form.department,
        role_title: form.role_title,
        status: form.status,
        start_date: form.start_date || null,
        base_salary: Number(form.base_salary || 0),
        allowances: Number(form.allowances || 0),
        attachment_path: attachmentPath
      };
      const { error: saveError } = await supabase.from("employees").upsert(payload).select("id").single();
      if (saveError) throw saveError;
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ البيانات.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{employee ? "تعديل موظف" : "إضافة موظف"}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <div className="form-grid">
          <label><span>الاسم الأول</span><input value={form.first_name || ""} onChange={(event) => setField("first_name", event.target.value)} required /></label>
          <label><span>اسم الأب</span><input value={form.father_name || ""} onChange={(event) => setField("father_name", event.target.value)} /></label>
          <label><span>اسم العائلة</span><input value={form.family_name || ""} onChange={(event) => setField("family_name", event.target.value)} required /></label>
          <label><span>رقم الموظف</span><input value={form.employee_no || ""} onChange={(event) => setField("employee_no", event.target.value)} /></label>
          <label><span>رقم الهوية</span><input value={form.national_id || ""} onChange={(event) => setField("national_id", event.target.value)} /></label>
          <label><span>الجوال</span><input value={form.phone || ""} onChange={(event) => setField("phone", event.target.value)} /></label>
          <label><span>القسم</span><input value={form.department || ""} onChange={(event) => setField("department", event.target.value)} /></label>
          <label><span>المهنة</span><input value={form.role_title || ""} onChange={(event) => setField("role_title", event.target.value)} /></label>
          <label><span>الحالة</span><select value={form.status || "active"} onChange={(event) => setField("status", event.target.value)}>{Object.entries(employeeStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>تاريخ المباشرة</span><input type="date" value={form.start_date || ""} onChange={(event) => setField("start_date", event.target.value)} /></label>
          <label><span>الراتب الأساسي</span><input type="number" value={form.base_salary || ""} onChange={(event) => setField("base_salary", event.target.value)} /></label>
          <label><span>البدلات</span><input type="number" value={form.allowances || ""} onChange={(event) => setField("allowances", event.target.value)} /></label>
          <label className="full-field"><span>مرفق الموظف</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="secondary-btn" type="button" onClick={onClose}>إلغاء</button>
          <button className="primary-btn" type="submit" disabled={busy}>{busy ? "جاري الحفظ..." : "حفظ"}</button>
        </div>
      </form>
    </div>
  );
}

function EmployeesPage({ employees, refresh }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const filtered = employees.filter((employee) => `${fullName(employee)} ${employee.department} ${employee.role_title} ${employee.phone}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="page-grid">
      <div className="toolbar">
        <label className="search-box"><Search size={18} /><input placeholder="بحث" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button className="primary-btn" type="button" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={18} /> إضافة موظف</button>
      </div>
      <section className="panel">
        <div className="panel-head"><h2>الموظفون</h2><span>{filtered.length} سجل</span></div>
        <EmployeeTable employees={filtered} onEdit={(employee) => { setEditing(employee); setOpen(true); }} />
      </section>
      {open ? <EmployeeDialog employee={editing} onClose={() => setOpen(false)} onSaved={refresh} /> : null}
    </section>
  );
}

function PlaceholderPage({ title, icon: Icon, rows }) {
  return (
    <section className="page-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>{title}</h2>
          <Icon size={20} />
        </div>
        <div className="module-grid">
          {rows.map((row) => (
            <article className="module-tile" key={row.title}>
              <strong>{row.title}</strong>
              <span>{row.value}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", document_no: "", authority: "", expires_on: "" });
  const [file, setFile] = useState(null);

  async function load() {
    const { data } = await supabase.from("establishment_documents").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const id = crypto.randomUUID();
    let attachment_path = null;
    if (file) {
      const path = `establishment/${id}/${Date.now()}-${safeFileName(file.name)}`;
      const upload = await supabase.storage.from("establishment-documents").upload(path, file, { upsert: false });
      if (!upload.error) attachment_path = path;
    }
    await supabase.from("establishment_documents").insert({ id, ...form, attachment_path });
    setForm({ title: "", document_no: "", authority: "", expires_on: "" });
    setFile(null);
    await load();
    setBusy(false);
  }

  return (
    <section className="page-grid">
      <form className="panel document-form" onSubmit={submit}>
        <div className="panel-head"><h2>وثائق المنشأة</h2><Upload size={20} /></div>
        <div className="form-grid">
          <label><span>اسم الوثيقة</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
          <label><span>رقم الوثيقة</span><input value={form.document_no} onChange={(event) => setForm({ ...form, document_no: event.target.value })} /></label>
          <label><span>الجهة</span><input value={form.authority} onChange={(event) => setForm({ ...form, authority: event.target.value })} /></label>
          <label><span>تاريخ الانتهاء</span><input type="date" value={form.expires_on} onChange={(event) => setForm({ ...form, expires_on: event.target.value })} /></label>
          <label className="full-field"><span>المرفق</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
        </div>
        <button className="primary-btn" type="submit" disabled={busy}>حفظ الوثيقة</button>
      </form>
      <section className="panel">
        <div className="panel-head"><h2>السجل</h2><span>{docs.length}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>الوثيقة</th><th>الرقم</th><th>الجهة</th><th>الانتهاء</th><th>المرفق</th></tr></thead>
            <tbody>{docs.map((doc) => <tr key={doc.id}><td>{doc.title}</td><td>{doc.document_no || "-"}</td><td>{doc.authority || "-"}</td><td>{doc.expires_on || "-"}</td><td>{doc.attachment_path ? "مرفوع" : "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function SettingsPage({ profile }) {
  return (
    <section className="page-grid">
      <section className="panel">
        <div className="panel-head"><h2>الإعدادات</h2><Shield size={20} /></div>
        <div className="settings-list">
          <div><span>الحساب</span><strong>{profile?.email || "-"}</strong></div>
          <div><span>الصلاحية</span><strong>{profile?.role || "employee"}</strong></div>
          <div><span>Supabase URL</span><strong dir="ltr">{supabaseConfig.url}</strong></div>
        </div>
      </section>
    </section>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = useMemo(() => modules.find((item) => item.id === active)?.label || "النظام", [active]);

  async function loadProfile(user) {
    if (!user) return null;
    const { data } = await supabase.from("app_user_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data || { email: user.email, role: "employee" });
    return data;
  }

  async function loadEmployees() {
    const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    setEmployees(data || []);
  }

  async function bootstrap() {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    setSession(data.session || null);
    if (data.session?.user) {
      await loadProfile(data.session.user);
      await loadEmployees();
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!supabaseConfig.ready) return;
    bootstrap();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProfile(nextSession.user);
        loadEmployees();
      } else {
        setProfile(null);
        setEmployees([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!supabaseConfig.ready) return <SetupScreen />;
  if (loading) return <main className="loading-screen">جاري التحميل...</main>;
  if (!session) return <LoginScreen onLogin={bootstrap} />;

  const pages = {
    dashboard: <Dashboard employees={employees} />,
    employees: <EmployeesPage employees={employees} refresh={loadEmployees} />,
    attendance: <PlaceholderPage title="الحضور والانصراف" icon={Clock3} rows={[{ title: "حضور اليوم", value: "0" }, { title: "غيابات", value: "0" }, { title: "استثناءات", value: "0" }]} />,
    leaves: <PlaceholderPage title="الإجازات والسفر" icon={CalendarDays} rows={[{ title: "طلبات معلقة", value: "0" }, { title: "إجازات معتمدة", value: "0" }, { title: "طلبات سفر", value: "0" }]} />,
    finance: <PlaceholderPage title="المالية" icon={WalletCards} rows={[{ title: "الصندوق", value: money(0) }, { title: "المبيعات", value: money(0) }, { title: "المصروفات", value: money(0) }]} />,
    payroll: <PlaceholderPage title="الرواتب" icon={Banknote} rows={[{ title: "مسير الشهر", value: money(0) }, { title: "السلفيات", value: money(0) }, { title: "الصافي", value: money(0) }]} />,
    reports: <PlaceholderPage title="التقارير" icon={ClipboardList} rows={[{ title: "الموظفون", value: employees.length }, { title: "العقود", value: "0" }, { title: "الوثائق", value: "0" }]} />,
    documents: <DocumentsPage />,
    users: <PlaceholderPage title="إدارة المستخدمين" icon={UserCog} rows={[{ title: "المستخدمون", value: "Supabase Auth" }, { title: "الصلاحيات", value: profile?.role || "employee" }]} />,
    settings: <SettingsPage profile={profile} />
  };

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={setActive} open={sidebarOpen} onClose={() => setSidebarOpen(false)} employeeCount={employees.length} />
      <main className="main-area">
        <Header title={title} profile={profile} onMenu={() => setSidebarOpen(true)} onLogout={logout} />
        <div className="content-area">{pages[active]}</div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
