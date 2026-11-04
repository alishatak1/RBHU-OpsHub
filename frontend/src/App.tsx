import { useEffect, useMemo, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { io } from "socket.io-client";
import {
  LayoutDashboard, Users, Package, Plus, Search, RefreshCw, Bot, Send, BarChart3, Upload,
  Truck, CheckCircle2, AlertCircle, Pencil, Trash2,
  X, Activity, LogOut, Megaphone
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { api } from "./api";
import "./index.css";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  isActive: boolean;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: string;
  customerId: string;
  customer?: Customer;
  createdAt: string;
};

type Tab = "dashboard" | "customers" | "shipments" | "assistant" | "analytics" | "announcements";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
type Announcement = {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  publishedAt: string;
  pinned: boolean;
};
type AnalyticsResult = {
  success: boolean;
  summary: {
    total_revenue: number;
    average_revenue: number;
    highest_sale: number;
    total_records: number;
    total_regions: number;
    total_salespeople: number;
  };
  revenue_by_region: { region: string; revenue: number }[];
  top_salespeople: { salesperson: string; revenue: number }[];
};

const statuses = ["PENDING", "PROCESSING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message ||
      error.response?.data?.error ||
      fallback;
  }
  return fallback;
}

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("riva@company.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [customerModal, setCustomerModal] = useState(false);
  const [shipmentModal, setShipmentModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [shipmentForm, setShipmentForm] = useState({ trackingNumber: "", origin: "", destination: "", customerId: "" });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [analyticsFile, setAnalyticsFile] = useState<File | null>(null);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");


  useEffect(() => {
    if (tab !== "announcements") return;

    const fetchAnnouncements = async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const response = await api.get("/announcements");
        const data = response.data.data as Announcement[];

        setAnnouncements(
          [...data].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime();
          })
        );
      } catch {
        setAnnouncementsError(
          "Could not load announcements. Please check that the backend is running."
        );
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [tab]);
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });

      const token = response.data.token;
      if (!token) {
        throw new Error("The server did not return an authentication token.");
      }

      sessionStorage.setItem("rbhu_token", token);
      setIsAuthenticated(true);
      setLoginPassword("");
    } catch (err: unknown) {
      setLoginError(getApiErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("rbhu_token");
    setIsAuthenticated(false);
    setLoginPassword("");
    setLoginError("");
    setCustomers([]);
    setShipments([]);
  };

  const loadData = async () => {
    setError("");
    try {
      const [customerResponse, shipmentResponse] = await Promise.all([
        api.get("/customers"),
        api.get("/shipments")
      ]);
      setCustomers(customerResponse.data.customers ?? []);
      setShipments(shipmentResponse.data.data ?? []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not connect to the backend. Check that the backend server is running."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("rbhu_token");
    if (!token) return;

    let active = true;

    api.get("/auth/me")
      .then(() => {
        if (active) setIsAuthenticated(true);
      })
      .catch(() => {
        sessionStorage.removeItem("rbhu_token");
        if (active) setIsAuthenticated(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    void loadData();

    const socket = io(import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000");
    socket.on("shipment_status_changed", (event: { shipmentId: string; status: string }) => {
      setShipments(current => current.map(item =>
        item.id === event.shipmentId ? { ...item, status: event.status } : item
      ));
      setNotice("A shipment status was updated live.");
      window.setTimeout(() => setNotice(""), 3500);
    });

    return () => { socket.disconnect(); };
  }, [isAuthenticated]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c => `${c.name} ${c.email} ${c.company ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [customers, search]
  );

  const filteredShipments = useMemo(() =>
    shipments.filter(s => `${s.trackingNumber} ${s.origin} ${s.destination} ${s.customer?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [shipments, search]
  );

  const statusData = statuses.map(status => ({
    name: status.replace("_", " "),
    value: shipments.filter(s => s.status === status).length
  })).filter(item => item.value > 0);

  const regionData = [
    { name: "Pending", count: shipments.filter(s => s.status === "PENDING").length },
    { name: "Processing", count: shipments.filter(s => s.status === "PROCESSING").length },
    { name: "In transit", count: shipments.filter(s => s.status === "IN_TRANSIT").length },
    { name: "Delivered", count: shipments.filter(s => s.status === "DELIVERED").length }
  ];

  const openNewCustomer = () => {
    setEditing(null);
    setCustomerForm({ name: "", email: "", phone: "", company: "" });
    setCustomerModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditing(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      company: customer.company ?? ""
    });
    setCustomerModal(true);
  };

  const saveCustomer = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, customerForm);
        setNotice("Customer updated successfully.");
      } else {
        await api.post("/customers", customerForm);
        setNotice("Customer added successfully.");
      }
      setCustomerModal(false);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not save customer."));
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Deactivate ${customer.name}?`)) return;
    try {
      await api.delete(`/customers/${customer.id}`);
      setNotice("Customer deactivated.");
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not deactivate customer."));
    }
  };

  const saveShipment = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post("/shipments", shipmentForm);
      setShipmentModal(false);
      setShipmentForm({ trackingNumber: "", origin: "", destination: "", customerId: "" });
      setNotice("Shipment created successfully.");
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not create shipment. Check the customer and tracking number."));
    }
  };

  const changeStatus = async (shipment: Shipment, status: string) => {
    try {
      await api.patch(`/shipments/${shipment.id}/status`, { status });
      setNotice(`Shipment ${shipment.trackingNumber} updated.`);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not update shipment status."));
    }
  };

  const sendChatMessage = async (event: FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const previousHistory = chatMessages;
    setChatMessages(current => [...current, { role: "user", content: message }]);
    setChatInput("");
    setChatError("");
    setChatLoading(true);

    try {
      const response = await api.post("/chat", {
        message: `${message}

Current RBHU OpsHub dashboard context:
- Active customers: ${customers.length}
- Total shipments: ${shipments.length}
- Pending: ${shipments.filter(s => s.status === "PENDING").length}
- Processing: ${shipments.filter(s => s.status === "PROCESSING").length}
- In transit: ${shipments.filter(s => s.status === "IN_TRANSIT").length}
- Delivered: ${shipments.filter(s => s.status === "DELIVERED").length}
- Cancelled: ${shipments.filter(s => s.status === "CANCELLED").length}

Use this dashboard context when answering the user's question.`,
        history: previousHistory
      });

      setChatMessages(current => [
        ...current,
        { role: "assistant", content: response.data.reply }
      ]);
    } catch (err: unknown) {
      setChatError(
        getApiErrorMessage(err, "Unable to reach the AI assistant. Please try again.")
      );
    } finally {
      setChatLoading(false);
    }
  };

  const analyzeCsv = async (event: FormEvent) => {
    event.preventDefault();

    if (!analyticsFile) {
      setAnalyticsError("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", analyticsFile);
    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const response = await fetch("https://rbhu-opshub-analytics.onrender.com/analyze", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "CSV analysis failed.");
      }

      setAnalyticsResult(result);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : "Could not connect to the analytics service.");
    } finally {
      setAnalyticsLoading(false);
    }
  };
  const title = tab === "dashboard" ? "Overview" : tab === "customers" ? "Customers" : tab === "shipments" ? "Shipments" : tab === "assistant" ? "AI Assistant" : tab === "analytics" ? "Analytics" : "Announcements";

  return (
    <>
      {!isAuthenticated && <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-mark">R</div>
            <div><strong>RBHU OPSHUB</strong><span>OPERATIONS MANAGEMENT</span></div>
          </div>
          <div className="login-intro">
            <span className="login-eyebrow">WELCOME BACK</span>
            <h1>Sign in to your workspace</h1>
            <p>Manage customers, shipments and operations from one place.</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <label>Email address
              <input type="email" required value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="Enter your email"/>
            </label>
            <label>Password
              <input type="password" required value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter your password"/>
            </label>
            {loginError && <div className="login-error"><AlertCircle size={16}/>{loginError}</div>}
            <button type="submit" className="login-submit">{loginLoading ? "Signing in..." : "Sign in to OpsHub"}</button>
          </form>
          <div className="login-demo"><strong>SECURE ADMIN ACCESS</strong><span>Sign in using your administrator account.</span></div>
          <p className="login-footer">RBHU OpsHub — Enterprise Operations Platform</p>
        </div>
      </div>}
      <div className="app-shell" style={{display: isAuthenticated ? "block" : "none"}}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div><strong>RBHU</strong><span>OPSHUB</span></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav>
          <button className={tab === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => { setTab("dashboard"); setSearch(""); }}>
            <LayoutDashboard size={18}/> Overview
          </button>
          <button className={tab === "customers" ? "nav-item active" : "nav-item"} onClick={() => { setTab("customers"); setSearch(""); }}>
            <Users size={18}/> Customers
            <span className="nav-count">{customers.length}</span>
          </button>
          <button className={tab === "shipments" ? "nav-item active" : "nav-item"} onClick={() => { setTab("shipments"); setSearch(""); }}>
            <Package size={18}/> Shipments
            <span className="nav-count">{shipments.length}</span>
          </button>
          <button className={tab === "assistant" ? "nav-item active" : "nav-item"} onClick={() => { setTab("assistant"); setSearch(""); }}>
            <Bot size={18}/> AI Assistant
          </button>
          <button className={tab === "analytics" ? "nav-item active" : "nav-item"} onClick={() => { setTab("analytics"); setSearch(""); }}>
            <BarChart3 size={18}/> Analytics
          </button>          <button className={tab === "announcements" ? "nav-item active" : "nav-item"} onClick={() => { setTab("announcements"); setSearch(""); }}>
            <Megaphone size={18}/> Announcements
            <span className="nav-count">{announcements.length}</span>
          </button>        </nav>
        <div className="sidebar-bottom">
          <div className="system-status"><span className="live-dot"/> System operational</div>
          <div className="profile">
            <div className="avatar">A</div>
            <div><strong>Admin User</strong><span>Operations</span></div>
            <button type="button" className="logout-button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16}/></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
          <div className="top-actions">
            <span className="date-label">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            <button className="icon-button" onClick={loadData} title="Refresh data"><RefreshCw size={17}/></button>
            <div className="avatar small">A</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">OPERATIONS CONTROL CENTER</div>
              <h1>{title}</h1>
              <p>{tab === "dashboard" ? "Monitor your customers, shipments and operational activity." : tab === "customers" ? "Manage customer records and account information." : tab === "shipments" ? "Track shipments and manage delivery progress." : tab === "assistant" ? "Ask questions and get help with logistics operations." : tab === "analytics" ? "Analyze sales performance, regional revenue and salesperson results." : "Read the latest operations updates and announcements."}</p>
            </div>
            <div className="heading-actions">
              {tab === "customers" && <button className="primary-button" onClick={openNewCustomer}><Plus size={17}/> Add customer</button>}
              {tab === "shipments" && <button className="primary-button" onClick={() => setShipmentModal(true)}><Plus size={17}/> New shipment</button>}
            </div>
          </div>

          {error && <div className="alert error"><AlertCircle size={17}/>{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
          {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}><X size={16}/></button></div>}

          {loading ? <div className="loading">Loading your workspace—</div> : <>
            {tab === "dashboard" && <>
              <section className="stats-grid">
                <StatCard label="Total customers" value={customers.length} detail="Active customer accounts" icon={<Users/>} tone="blue"/>
                <StatCard label="Total shipments" value={shipments.length} detail="All recorded shipments" icon={<Package/>} tone="violet"/>
                <StatCard label="In transit" value={shipments.filter(s => s.status === "IN_TRANSIT").length} detail="Currently on the move" icon={<Truck/>} tone="orange"/>
                <StatCard label="Delivered" value={shipments.filter(s => s.status === "DELIVERED").length} detail="Successfully completed" icon={<CheckCircle2/>} tone="green"/>
              </section>

              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading"><div><h3>Shipment activity</h3><p>Current shipment status distribution</p></div><span className="panel-tag">LIVE DATA</span></div>
                  {statusData.length ? <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={245}>
                      <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={4}>
                        {statusData.map((_, i) => <Cell key={i} fill={["#4263eb","#8b5cf6","#f59e0b","#16a36a","#ef6461"][i % 5]}/>)}
                      </Pie><Tooltip/></PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">{statusData.map((item, i) => <div key={item.name}><span style={{background:["#4263eb","#8b5cf6","#f59e0b","#16a36a","#ef6461"][i % 5]}}/>{item.name}<strong>{item.value}</strong></div>)}</div>
                  </div> : <EmptyState text="Create a shipment to see status analytics."/>}
                </div>
                <div className="panel chart-panel">
                  <div className="panel-heading"><div><h3>Shipment pipeline</h3><p>Shipments by operational stage</p></div><Activity size={18} className="muted-icon"/></div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={regionData} margin={{top:20,right:8,left:-22,bottom:4}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:"#7b8496"}} axisLine={false} tickLine={false}/>
                      <YAxis allowDecimals={false} tick={{fontSize:11,fill:"#7b8496"}} axisLine={false} tickLine={false}/>
                      <Tooltip/>
                      <Bar dataKey="count" fill="#4263eb" radius={[5,5,0,0]} barSize={34}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="panel table-panel">
                <div className="panel-heading"><div><h3>Recent shipments</h3><p>Your latest shipment records</p></div><button className="text-button" onClick={() => setTab("shipments")}>View all <span aria-hidden="true">{"\u2192"}</span></button></div>
                <ShipmentTable shipments={shipments.slice(0, 5)} onStatusChange={changeStatus} compact/>
              </section>
            </>}

            {tab === "customers" && <section className="panel table-panel">
              <div className="table-toolbar">
                <div><h3>Customer directory</h3><p>{customers.length} active customer accounts</p></div>
                <div className="search-box"><Search size={17}/><input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}/></div>
              </div>
              <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>COMPANY</th><th>EMAIL</th><th>PHONE</th><th>SHIPMENTS</th><th>ACTIONS</th></tr></thead>
                <tbody>{filteredCustomers.map(c => <tr key={c.id}><td><div className="person-cell"><div className="avatar table-avatar">{c.name.charAt(0).toUpperCase()}</div><strong>{c.name}</strong></div></td><td>{c.company || "—"}</td><td>{c.email}</td><td>{c.phone || "—"}</td><td>{shipments.filter(s => s.customerId === c.id).length}</td><td><div className="row-actions"><button onClick={() => openEditCustomer(c)} title="Edit"><Pencil size={15}/></button><button className="danger-icon" onClick={() => deleteCustomer(c)} title="Deactivate"><Trash2 size={15}/></button></div></td></tr>)}
                {!filteredCustomers.length && <tr><td colSpan={6}><EmptyState text="No customers found. Add your first customer to get started."/></td></tr>}</tbody>
              </table></div>
            </section>}

            {tab === "shipments" && <section className="panel table-panel">
              <div className="table-toolbar">
                <div><h3>Shipment register</h3><p>{shipments.length} total shipment records</p></div>
                <div className="toolbar-right"><div className="search-box"><Search size={17}/><input placeholder="Search shipments..." value={search} onChange={e => setSearch(e.target.value)}/></div><button className="primary-button" onClick={() => setShipmentModal(true)}><Plus size={17}/> New shipment</button></div>
              </div>
              <ShipmentTable shipments={filteredShipments} onStatusChange={changeStatus}/>
            </section>}
          </>}
            {tab === "announcements" && <section className="announcements-page">
              <div className="panel announcements-intro">
                <div className="panel-heading">
                  <div>
                    <h3>Operations announcements</h3>
                    <p>Updates and important information from your operations team.</p>
                  </div>
                  <span className="panel-tag">LIVE FROM API</span>
                </div>
                <div className="announcement-summary">
                  <Megaphone size={22}/>
                  <div>
                    <strong>{announcements.length} announcements</strong>
                    <span>Latest updates from RBHU OpsHub</span>
                  </div>
                </div>
              </div>

              {announcementsLoading && (
                <div className="loading">Loading announcements—</div>
              )}

              {announcementsError && (
                <div className="alert error">
                  <AlertCircle size={17}/>{announcementsError}
                </div>
              )}

              {!announcementsLoading && !announcementsError &&
                announcements.length === 0 && (
                  <div className="panel announcements-empty">
                    <Megaphone size={36}/>
                    <h3>No announcements yet</h3>
                    <p>New operations updates will appear here.</p>
                  </div>
              )}

              {!announcementsLoading && !announcementsError &&
                announcements.map(item => (
                  <article className="panel announcement-card" key={item.id}>
                    <div className="announcement-top">
                      <span className="announcement-category">{item.category}</span>
                      <div className="announcement-labels">
                        {item.pinned && <span className="pinned-label">PINNED</span>}
                        <span className={`priority-label priority-${item.priority.toLowerCase()}`}>
                          {item.priority} priority
                        </span>
                      </div>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="announcement-message">{item.message}</p>
                    <div className="announcement-footer">
                      <span>Announcement ID: {item.id}</span>
                      <span>{new Date(item.publishedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}</span>
                    </div>
                  </article>
              ))}
            </section>}
            {tab === "analytics" && <section className="analytics-page">
              <div className="panel analytics-upload">
                <div className="panel-heading">
                  <div>
                    <h3>Sales analytics</h3>
                    <p>Upload a CSV file to generate business insights</p>
                  </div>
                  <span className="panel-tag">PYTHON — PANDAS — PLOTLY</span>
                </div>

                <form className="analytics-upload-form" onSubmit={analyzeCsv}>
                  <label htmlFor="analytics-csv">Choose sales CSV file</label>
                  <input
                    id="analytics-csv"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={event => {
                      setAnalyticsFile(event.target.files?.[0] ?? null);
                      setAnalyticsError("");
                    }}
                  />
                  <p className="analytics-hint">Required columns: salesperson, revenue, region</p>
                  <button className="primary-button" type="submit" disabled={!analyticsFile || analyticsLoading}>
                    <Upload size={17}/>
                    {analyticsLoading ? "Analyzing..." : "Analyze CSV"}
                  </button>
                </form>

                {analyticsError && <div className="chat-error"><AlertCircle size={16}/>{analyticsError}</div>}
              </div>

              {analyticsResult && <>
                <section className="stats-grid analytics-stats">
                  <StatCard label="Total revenue" value={formatINR(analyticsResult.summary.total_revenue)} detail="Revenue across all records" icon={<Activity/>} tone="blue"/>
                  <StatCard label="Average revenue" value={formatINR(analyticsResult.summary.average_revenue)} detail="Average per sales record" icon={<Activity/>} tone="violet"/>
                  <StatCard label="Highest sale" value={formatINR(analyticsResult.summary.highest_sale)} detail="Largest individual sale" icon={<CheckCircle2/>} tone="green"/>
                  <StatCard label="Total records" value={analyticsResult.summary.total_records} detail={`${analyticsResult.summary.total_salespeople} salespeople — ${analyticsResult.summary.total_regions} regions`} icon={<Users/>} tone="orange"/>
                </section>

                <section className="dashboard-grid analytics-charts">
                  <div className="panel chart-panel">
                    <div className="panel-heading">
                      <div><h3>Revenue by region</h3><p>Regional sales performance</p></div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analyticsResult.revenue_by_region}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="region"/>
                        <YAxis/>
                        <Tooltip formatter={(value) => formatINR(Number(value))}/>
                        <Bar dataKey="revenue" name="Revenue" fill="#636efa" radius={[6,6,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel chart-panel">
                    <div className="panel-heading">
                      <div><h3>Top salespeople</h3><p>Revenue by salesperson</p></div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analyticsResult.top_salespeople}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="salesperson"/>
                        <YAxis/>
                        <Tooltip formatter={(value) => formatINR(Number(value))}/>
                        <Bar dataKey="revenue" name="Revenue" fill="#00a98f" radius={[6,6,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </>}

              {!analyticsResult && <div className="panel analytics-empty">
                <BarChart3 size={38}/>
                <h3>Your sales insights will appear here</h3>
                <p>Upload a CSV file containing salesperson, revenue and region columns to get started.</p>
              </div>}
            </section>}
            {tab === "assistant" && <section className="panel chat-panel">
              <div className="chat-heading">
                <div className="chat-avatar"><Bot size={23}/></div>
                <div>
                  <h3>RBHU Operations Assistant</h3>
                  <p>AI-powered logistics support</p>
                </div>
                <span className="panel-tag">AI ASSISTANT</span>
              </div>

              <div className="chat-messages">
                {!chatMessages.length && <div className="chat-welcome">
                  <Bot size={36}/>
                  <h3>How can I help you today?</h3>
                  <p>Ask me about shipment workflows, delivery statuses, customer operations or analytics.</p>
                  <div className="chat-suggestions">
                    {["Explain shipment statuses", "How can I track a shipment?", "What does an operations dashboard show?"].map(question =>
                      <button key={question} type="button" onClick={() => setChatInput(question)}>{question}</button>
                    )}
                  </div>
                </div>}

                {chatMessages.map((message, index) =>
                  <div key={index} className={`chat-message ${message.role}`}>
                    <div className="chat-message-label">{message.role === "user" ? "You" : "OpsHub Assistant"}</div>
                    <div className="chat-bubble">{message.content}</div>
                  </div>
                )}

                {chatLoading && <div className="chat-typing">Assistant is thinking...</div>}
              </div>

              {chatError && <div className="chat-error"><AlertCircle size={16}/>{chatError}</div>}

              <form className="chat-input-form" onSubmit={sendChatMessage}>
                <input
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  placeholder="Ask something about operations..."
                  disabled={chatLoading}
                  maxLength={4000}
                />
                <button className="primary-button" type="submit" disabled={!chatInput.trim() || chatLoading}>
                  <Send size={17}/> Send
                </button>
              </form>
              <p className="chat-disclaimer">AI-generated responses may need verification. Do not share confidential information.</p>
            </section>}

          <footer>RBHU OpsHub <span>—</span> Operations Management Platform <span className="footer-right">Built for enterprise operations</span></footer>
        </div>
      </main>

      {customerModal && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setCustomerModal(false);}}>
        <form className="modal" onSubmit={saveCustomer}>
          <div className="modal-heading"><div><h2>{editing ? "Edit customer" : "Add customer"}</h2><p>Enter the customer account details below.</p></div><button type="button" className="icon-button" onClick={() => setCustomerModal(false)}><X/></button></div>
          <label>Full name<input required minLength={2} value={customerForm.name} onChange={e => setCustomerForm({...customerForm,name:e.target.value})} placeholder="e.g. Priya Sharma"/></label>
          <label>Email address<input required type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm,email:e.target.value})} placeholder="priya@company.com"/></label>
          <div className="form-row"><label>Phone number<input value={customerForm.phone} onChange={e => setCustomerForm({...customerForm,phone:e.target.value})} placeholder="+91 98765 43210"/></label><label>Company<input value={customerForm.company} onChange={e => setCustomerForm({...customerForm,company:e.target.value})} placeholder="Company name"/></label></div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCustomerModal(false)}>Cancel</button><button className="primary-button">{editing ? "Save changes" : "Create customer"}</button></div>
        </form>
      </div>}

      {shipmentModal && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setShipmentModal(false);}}>
        <form className="modal" onSubmit={saveShipment}>
          <div className="modal-heading"><div><h2>Create shipment</h2><p>Add a new shipment to the tracking register.</p></div><button type="button" className="icon-button" onClick={() => setShipmentModal(false)}><X/></button></div>
          <label>Tracking number<input required minLength={3} value={shipmentForm.trackingNumber} onChange={e => setShipmentForm({...shipmentForm,trackingNumber:e.target.value})} placeholder="RBHU-2026-001"/></label>
          <label>Customer<select required value={shipmentForm.customerId} onChange={e => setShipmentForm({...shipmentForm,customerId:e.target.value})}><option value="">Select a customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company || c.email}</option>)}</select></label>
          <div className="form-row"><label>Origin<input required value={shipmentForm.origin} onChange={e => setShipmentForm({...shipmentForm,origin:e.target.value})} placeholder="Mumbai"/></label><label>Destination<input required value={shipmentForm.destination} onChange={e => setShipmentForm({...shipmentForm,destination:e.target.value})} placeholder="Pune"/></label></div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShipmentModal(false)}>Cancel</button><button className="primary-button" disabled={!customers.length}>Create shipment</button></div>
          {!customers.length && <p className="form-hint">Add a customer before creating a shipment.</p>}
        </form>
      </div>}
    </div>
    </>
  );
}

function StatCard({label,value,detail,icon,tone}:{label:string;value:string | number;detail:string;icon:React.ReactNode;tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value.toLocaleString("en-IN")}</div><div className="stat-detail">{detail}</div></div>;
}

function EmptyState({text}:{text:string}) {
  return <div className="empty-state"><Package size={25}/><span>{text}</span></div>;
}

function ShipmentTable({shipments,onStatusChange,compact=false}:{shipments:Shipment[];onStatusChange:(shipment:Shipment,status:string)=>void;compact?:boolean}) {
  if (!shipments.length) return <EmptyState text="No shipments yet. Create a shipment to see it here."/>;
  return <div className="table-scroll"><table><thead><tr><th>TRACKING ID</th><th>ROUTE</th><th>CUSTOMER</th><th>CREATED</th><th>STATUS</th>{!compact && <th>UPDATE STATUS</th>}</tr></thead>
    <tbody>{shipments.map(s => <tr key={s.id}><td><strong className="tracking">{s.trackingNumber}</strong></td><td><div className="route-cell"><span>{s.origin}</span><span className="route-arrow">{"\u2192"}</span><span>{s.destination}</span></div></td><td>{s.customer?.name || "—"}</td><td>{new Date(s.createdAt).toLocaleDateString("en-IN")}</td><td><StatusBadge status={s.status}/></td>{!compact && <td><select className="status-select" value={s.status} onChange={e => onStatusChange(s,e.target.value)}>{statuses.map(status=><option key={status} value={status}>{status.replace("_"," ")}</option>)}</select></td>}</tr>)}</tbody>
  </table></div>;
}

function StatusBadge({status}:{status:string}) {
  const cls = status.toLowerCase().replace("_","-");
  return <span className={`status-badge ${cls}`}><span/> {status.replace("_"," ")}</span>;
}

export default App;
















