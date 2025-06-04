import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

const AdminPanel = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const checkAdminAuth = async () => {
			try {
				const response = await api.get("/api/user");
				if (!response.data || response.data.role !== "administrator") {
					navigate("/login");
					return;
				}
				setUser(response.data);
			} catch (error) {
				console.error("Admin auth check failed:", error);
				navigate("/login");
			} finally {
				setLoading(false);
			}
		};

		checkAdminAuth();
	}, [navigate]);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
		}
		if (showDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showDropdown]);

	const handleLogout = async () => {
		try {
			await api.post("/api/logout");
			setUser(null);
			navigate("/login");
		} catch (error) {
			console.error("Logout failed:", error);
			// Still navigate to login even if the API call fails
			navigate("/login");
		}
	};

	const toggleDropdown = () => {
		setShowDropdown((prev) => !prev);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="admin-panel">
			<div className="sidebar">
				<nav className="admin-nav">
					<ul style={{ listStyle: "none", padding: 0 }}>
						<li>
							<Link to="/">HOME</Link>
						</li>
						<li>
							<Link to="/dashboard">DASHBOARD</Link>
						</li>
						<li>
							<Link to="/symptom-ai">SYMPTOM AI</Link>
						</li>
						<li>
							<Link to="/patient-records">PATIENT RECORDS</Link>
						</li>
						<li>
							<Link to="/prescription-management">PRESCRIPTIONS</Link>
						</li>
						<li>
							<Link to="/inventory-management">INVENTORY</Link>
						</li>
						<li>
							<Link to="/reports-analytics">REPORTS</Link>
						</li>
						<li>
							<Link to="/help-support">HELP</Link>
						</li>
					</ul>
				</nav>
				<div style={{ marginTop: "auto", padding: "1rem 0 0.5rem 0" }}>
					{user && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								position: "relative",
							}}
							ref={dropdownRef}
						>
							<div
								style={{
									width: "48px",
									height: "48px",
									borderRadius: "50%",
									backgroundColor: "#007bff",
									color: "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontWeight: "bold",
									fontSize: "1.3rem",
								}}
							>
								{user.name
									? user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
									: user.email.charAt(0).toUpperCase()}
							</div>
							<div style={{ fontWeight: "bold", marginTop: 4 }}>
								{user.name || user.email}
							</div>
							<div style={{ fontSize: "0.95em", color: "#555" }}>
								({user.role || "User"})
							</div>
							<button
								onClick={toggleDropdown}
								className="btn btn-secondary btn-sm"
								style={{ marginTop: 4 }}
								aria-haspopup="true"
								aria-expanded={showDropdown}
								aria-label="User menu"
							>
								▼
							</button>
							{showDropdown && (
								<ul
									tabIndex={-1}
									style={{
										position: "absolute",
										top: "110%",
										right: 0,
										background: "white",
										boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
										borderRadius: "6px",
										padding: "0.5rem 0",
										minWidth: "140px",
										zIndex: 1000,
										listStyle: "none",
										margin: 0,
									}}
								>
									<li>
										<button
											onClick={handleLogout}
											className="btn btn-link btn-block"
											style={{
												width: "100%",
												textAlign: "left",
												padding: "0.5rem 1rem",
											}}
										>
											Logout
										</button>
									</li>
									<li>
										<Link
											to="/admin"
											className="btn btn-link btn-block"
											style={{
												width: "100%",
												textAlign: "left",
												padding: "0.5rem 1rem",
											}}
										>
											Admin
										</Link>
									</li>
								</ul>
							)}
						</div>
					)}
				</div>
			</div>
			<div className="main-content">
				{/* Main content goes here */}
				<h2>Welcome To "NewChem Pharmacy" Admin Panel</h2>
				<div className="stats">
					<h3>STATS</h3>
					{/* Stats content goes here */}
					<div className="stats-block">
						<h4>TODAY</h4>
						<p>1,876 HITS</p>
						<p>2,103 VIEWS</p>
					</div>
					<div className="stats-block">
						<h4>YESTERDAY</h4>
						<p>1,646 HITS</p>
						<p>2,054 VIEWS</p>
					</div>
				</div>
				<div className="commands-complain">
					<h3>Commands and Complain</h3>
					<table>
						<thead>
							<tr>
								<th>Check</th>
								<th>ID</th>
								<th>Name</th>
								<th>Email</th>
								<th>TelePhone</th>
								<th>Comment</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>{/* Table rows will go here */}</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default AdminPanel;
