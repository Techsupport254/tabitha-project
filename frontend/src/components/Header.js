import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	FaUser,
	FaShoppingCart,
	FaBell,
	FaCog,
	FaSignOutAlt,
	FaBars,
	FaTimes,
	FaPhone,
	FaEnvelope,
	FaMapMarkerAlt,
	FaChartLine,
	FaPills,
	FaFilePrescription,
	FaUserMd,
	FaUserNurse,
	FaCashRegister,
	FaUserShield,
	FaCaretDown,
	FaFileAlt,
} from "react-icons/fa";
import api from "../utils/api"; // Import the centralized API utility

const Header = () => {
	const [user, setUser] = useState(null);
	const [showDropdown, setShowDropdown] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isForbidden, setIsForbidden] = useState(false);
	const [cartCount, setCartCount] = useState(0);
	const navigate = useNavigate();
	const dropdownRef = useRef(null);
	const notificationsRef = useRef(null);
	const mobileMenuRef = useRef(null);

	// Fetch user data and cart count on component mount
	useEffect(() => {
		const fetchUserAndCart = async () => {
			try {
				const [userResponse, cartResponse] = await Promise.all([
					api.get("/api/user"),
					api.get("/api/cart"),
				]);

				if (userResponse.data) {
					setUser(userResponse.data);
					setIsForbidden(false);
				}

				if (cartResponse.data) {
					setCartCount(
						Array.isArray(cartResponse.data) ? cartResponse.data.length : 0
					);
				}
			} catch (error) {
				console.error("Failed to fetch user data or cart:", error);
				if (error.response && error.response.status === 403) {
					setIsForbidden(true);
					setUser(null);
				} else {
					setUser(null);
					setIsForbidden(false);
				}
				setCartCount(0);
			} finally {
				setIsLoading(false);
			}
		};
		fetchUserAndCart();

		// Set up interval to refresh cart count
		const cartRefreshInterval = setInterval(async () => {
			try {
				const response = await api.get("/api/cart");
				if (response.data) {
					setCartCount(Array.isArray(response.data) ? response.data.length : 0);
				}
			} catch (error) {
				console.error("Failed to refresh cart count:", error);
				setCartCount(0);
			}
		}, 30000); // Refresh every 30 seconds

		return () => clearInterval(cartRefreshInterval);
	}, []); // Empty dependency array to run only once on mount

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
			if (
				notificationsRef.current &&
				!notificationsRef.current.contains(event.target)
			) {
				setShowNotifications(false);
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setShowMobileMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = async () => {
		try {
			await api.post("/api/logout");
			api.clearUserCache(); // Clear user cache on logout
			setUser(null);
			window.location.href = "/";
			window.location.reload();
		} catch (error) {
			console.error("Logout failed:", error);
			api.clearUserCache(); // Clear cache even if logout fails
			window.location.href = "/";
			window.location.reload();
		}
	};

	const toggleDropdown = () => {
		setShowDropdown((prev) => !prev);
		setShowNotifications(false);
	};

	const toggleNotifications = () => {
		setShowNotifications((prev) => !prev);
		setShowDropdown(false);
	};

	const toggleMobileMenu = () => {
		setShowMobileMenu((prev) => !prev);
	};

	// Get user initials
	const getUserInitials = (name) => {
		if (!name) return user?.email?.charAt(0).toUpperCase() || "?";
		const nameParts = name.split(" ");
		if (nameParts.length >= 2) {
			return (
				nameParts[0][0] + nameParts[nameParts.length - 1][0]
			).toUpperCase();
		}
		return name.charAt(0).toUpperCase();
	};

	// Role-based access control
	const isAdmin = user?.role === "admin" || user?.role === "administrator";
	const isDoctor = user?.role === "doctor";
	const isPharmacist = user?.role === "pharmacist";
	const isCashier = user?.role === "cashier";
	const isTechnician = user?.role === "technician";
	const isPatient = user?.role === "patient";

	// Role-based navigation items
	const getNavigationItems = () => {
		const items = [
			{
				to: "/dashboard",
				label: "Dashboard",
				icon: <FaChartLine className="w-4 h-4 mr-2" />,
				show: isAdmin || isPharmacist,
			},
			{
				to: "/symptom-ai",
				label: "Symptom AI",
				icon: <FaUserMd className="w-4 h-4 mr-2" />,
				show: true, // Available to all users
			},
			{
				to: "/patient-records",
				label: "Patient Records",
				icon: <FaUser className="w-4 h-4 mr-2" />,
				show: isAdmin || isPatient,
			},
			{
				to: "/prescription-management",
				label: "Prescriptions",
				icon: <FaFilePrescription className="w-4 h-4 mr-2" />,
				show: isAdmin || isDoctor || isPharmacist || isPatient,
			},
			{
				to: "/inventory-management",
				label: "Inventory",
				icon: <FaPills className="w-4 h-4 mr-2" />,
				show: isAdmin || isPharmacist || isTechnician,
			},
			{
				to: "/reports-analytics",
				label: "Reports",
				icon: <FaChartLine className="w-4 h-4 mr-2" />,
				show: isAdmin || isPharmacist,
			},
			{
				to: "/staff-management",
				label: "Staff",
				icon: <FaUserNurse className="w-4 h-4 mr-2" />,
				show: isAdmin,
			},
			{
				to: "/sales-management",
				label: "Sales",
				icon: <FaCashRegister className="w-4 h-4 mr-2" />,
				show: isAdmin || isCashier,
			},
		];

		return items.filter((item) => item.show);
	};

	// If forbidden, don't render the header
	if (isForbidden) {
		return null;
	}

	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			{/* Top Bar */}
			<div className="bg-blue-600 text-white py-2">
				<div className="container mx-auto px-4">
					<div className="flex flex-row justify-between items-center">
						<div className="flex items-center space-x-6">
							<div className="flex items-center space-x-2">
								<FaPhone className="text-blue-200" />
								<span className="text-sm">+254 712 345 678</span>
							</div>
							<div className="flex items-center space-x-2">
								<FaEnvelope className="text-blue-200" />
								<span className="text-sm">info@uzurichem.com</span>
							</div>
							<div className="flex items-center space-x-2">
								<FaMapMarkerAlt className="text-blue-200" />
								<span className="text-sm">Thika, Kenya</span>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Link
								to="/contact"
								className="text-sm hover:text-blue-200 transition-colors"
							>
								Contact Us
							</Link>
							<Link
								to="/help-support"
								className="text-sm hover:text-blue-200 transition-colors"
							>
								Help & Support
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Main Header */}
			<div className="container mx-auto px-4 py-2">
				<div className="hidden md:flex items-center justify-between w-full">
					{/* Logo */}
					<Link to="/" className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
							<span className="text-white text-xl font-bold">U</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xl font-bold text-gray-900">UzuriChem</span>
							<span className="text-xs text-gray-600">
								AI Medicine Prescription
							</span>
						</div>
					</Link>

					{/* Navigation Links */}
					<nav className="flex-1 flex items-center justify-center space-x-8 px-8">
						{getNavigationItems().map((item, index) => (
							<Link
								key={index}
								to={item.to}
								className="text-gray-600 hover:text-blue-600 transition-colors flex items-center"
							>
								{item.icon}
								{item.label}
							</Link>
						))}
					</nav>

					{/* Cart and User Menu */}
					<div className="flex items-center space-x-6">
						{/* Medicine Cart */}
						<Link to="/cart" className="relative group">
							<FaShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
							{cartCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
									{cartCount}
								</span>
							)}
						</Link>

						{/* User Menu */}
						{isLoading ? (
							<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
						) : user ? (
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={toggleDropdown}
									className="flex items-center space-x-3 group"
								>
									<div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
										{getUserInitials(user.name)}
									</div>
									<div className="hidden md:block text-left">
										<p className="text-sm font-medium text-gray-900">
											{user.name || user.email}
										</p>
										<p className="text-xs text-gray-500 capitalize flex items-center gap-2">
											{user.role || "User"} <FaCaretDown />
										</p>
									</div>
								</button>
								{showDropdown && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
										<Link
											to="/profile"
											className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<FaUser className="w-4 h-4 mr-3" />
											Profile
										</Link>
										<Link
											to="/dashboard"
											className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<FaChartLine className="w-4 h-4 mr-3" />
											Dashboard
										</Link>
										<Link
											to="/settings"
											className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										>
											<FaCog className="w-4 h-4 mr-3" />
											Settings
										</Link>
										{isAdmin && (
											<>
												<Link
													to="/admin"
													className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
												>
													<FaUserShield className="w-4 h-4 mr-3" />
													Admin Panel
												</Link>
												<Link
													to="/system-settings"
													className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
												>
													<FaCog className="w-4 h-4 mr-3" />
													System Settings
												</Link>
												<Link
													to="/audit-logs"
													className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
												>
													<FaFileAlt className="w-4 h-4 mr-3" />
													Audit Logs
												</Link>
											</>
										)}
										<button
											onClick={handleLogout}
											className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
										>
											<FaSignOutAlt className="w-4 h-4 mr-3" />
											Logout
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center space-x-4">
								<Link
									to="/login"
									className="text-gray-600 hover:text-blue-600 transition-colors"
								>
									Login
								</Link>
								<Link
									to="/create-account"
									className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
								>
									Sign Up
								</Link>
							</div>
						)}
					</div>
				</div>

				{/* Mobile Menu */}
				{showMobileMenu && (
					<div
						ref={mobileMenuRef}
						className="md:hidden mt-4 bg-white rounded-lg shadow-lg py-2"
					>
						<nav className="flex flex-col space-y-2">
							{getNavigationItems().map((item, index) => (
								<Link
									key={index}
									to={item.to}
									className="px-4 py-2 text-gray-600 hover:bg-gray-50 flex items-center"
								>
									{item.icon}
									{item.label}
								</Link>
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
