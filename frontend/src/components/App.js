import React from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	useLocation,
	Navigate,
	useNavigate,
} from "react-router-dom";
import "../styles/main.css";
import api from "../utils/api";

// Auth Components
import Login from "./Login";
import CreateAccount from "./CreateAccount";
import AuthLayout from "./AuthLayout";

// Layout Components
import Header from "./Header";
import Footer from "./Footer";

// Page Components
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import SymptomAI from "../pages/SymptomAI";
import PatientRecords from "../pages/PatientRecords";
import PrescriptionManagement from "../pages/PrescriptionManagement";
import InventoryManagement from "../pages/InventoryManagement";
import ReportsAnalytics from "../pages/ReportsAnalytics";
import HelpSupport from "../pages/HelpSupport";
import AdminPanel from "./AdminPanel";
import Contact from "../pages/Contact";
import Cart from "../pages/Cart";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import UserManagement from "../pages/UserManagement";

// Custom hook for authentication
const useAuth = () => {
	const [user, setUser] = React.useState(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await api.get("/api/user");
				setUser(response.data);
			} catch (error) {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, []);

	return { user, loading };
};

// Auth redirect component for login and create account pages
const AuthRedirect = ({ children }) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return null; // or a loading spinner
	}

	if (user) {
		// If user is authenticated, redirect back to the previous page or home
		const from = location.state?.from?.pathname || "/";
		return <Navigate to={from} replace />;
	}

	return children;
};

// Auth protection component for protected routes
const AuthGuard = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return null; // or a loading spinner
	}

	if (!user) {
		// If user is not authenticated, redirect to login page
		return <Navigate to="/login" replace />;
	}

	return children;
};

// Admin protection component
const AdminGuard = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return null; // or a loading spinner
	}

	if (!user) {
		// If user is not authenticated, redirect to login page
		return <Navigate to="/login" replace />;
	}

	if (user.role !== "admin" && user.role !== "administrator") {
		// If user is not an admin or administrator, redirect to home page
		return <Navigate to="/" replace />;
	}

	return children;
};

// Layout wrapper component to handle conditional rendering of Header and Footer
const LayoutWrapper = ({ children }) => {
	const location = useLocation();
	const isAuthPage =
		location.pathname === "/login" || location.pathname === "/create-account";

	return (
		<div className="flex flex-col min-h-screen">
			{!isAuthPage && <Header />}
			<main className="flex-grow">{children}</main>
			{!isAuthPage && <Footer />}
		</div>
	);
};

const App = () => {
	return (
		<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<LayoutWrapper>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/symptom-ai" element={<SymptomAI />} />
					<Route path="/patient-records" element={<PatientRecords />} />
					<Route
						path="/prescription-management"
						element={<PrescriptionManagement />}
					/>
					<Route
						path="/inventory-management"
						element={<InventoryManagement />}
					/>
					<Route path="/reports-analytics" element={<ReportsAnalytics />} />
					<Route path="/help-support" element={<HelpSupport />} />
					<Route path="/contact" element={<Contact />} />
					<Route path="/cart" element={<Cart />} />
					<Route
						path="/profile"
						element={
							<AuthGuard>
								<Profile />
							</AuthGuard>
						}
					/>
					<Route
						path="/settings"
						element={
							<AuthGuard>
								<Settings />
							</AuthGuard>
						}
					/>
					<Route
						path="/login"
						element={
							<AuthRedirect>
								<AuthLayout>
									<Login />
								</AuthLayout>
							</AuthRedirect>
						}
					/>
					<Route
						path="/admin"
						element={
							<AdminGuard>
								<AdminPanel />
							</AdminGuard>
						}
					/>
					<Route
						path="/user-management"
						element={
							<AdminGuard>
								<UserManagement />
							</AdminGuard>
						}
					/>
					<Route
						path="/create-account"
						element={
							<AuthRedirect>
								<AuthLayout>
									<CreateAccount />
								</AuthLayout>
							</AuthRedirect>
						}
					/>
				</Routes>
			</LayoutWrapper>
		</Router>
	);
};

export default App;
