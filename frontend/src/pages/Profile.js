import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
	FaUser,
	FaEnvelope,
	FaPhone,
	FaMapMarkerAlt,
	FaEdit,
	FaSave,
	FaTimes,
	FaExclamationTriangle,
	FaLock,
	FaBuilding,
	FaIdCard,
	FaShieldAlt,
	FaKey,
	FaSignOutAlt,
	FaCalendar,
} from "react-icons/fa";

const Profile = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activeTab, setActiveTab] = useState("personal");
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		dob: "",
		gender: "",
		pharmacyName: "",
		pharmacyLicense: "",
		pharmacyAddress: "",
		pharmacyPhone: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Fetch user data on component mount using session cookie
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await api.get("/api/user");
				if (response.data) {
					setUser(response.data);
					setFormData({
						...formData,
						name: response.data.name || "",
						email: response.data.email || "",
						phone: response.data.phone || "",
						address: response.data.address || "",
						dob: response.data.dob || "",
						gender: response.data.gender || "",
						pharmacyName: response.data.pharmacyName || "",
						pharmacyLicense: response.data.pharmacyLicense || "",
						pharmacyAddress: response.data.pharmacyAddress || "",
						pharmacyPhone: response.data.pharmacyPhone || "",
					});
				} else {
					// If no user data, redirect to login
					navigate("/login");
				}
			} catch (error) {
				console.error("Failed to fetch user data for profile:", error);
				// If fetching fails (e.g., 401), redirect to login
				if (error.response?.status === 401) {
					navigate("/login");
				} else {
					setError("Failed to load profile data.");
				}
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, [navigate]); // Remove formData from dependencies to prevent infinite loop

	const handleChange = (e) => {
		const { id, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[id]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setSaving(true);

		try {
			const response = await api.put("/api/profile", formData);
			if (response.status === 200) {
				const updatedUser = { ...user, ...formData };
				setUser(updatedUser);
				setIsEditing(false);
				setSuccess("Profile updated successfully!");
				api.clearUserCache();
			}
		} catch (err) {
			console.error("Profile update error:", err);
			if (err.response?.status === 401) {
				navigate("/login");
				return;
			}
			setError(
				err.response?.data?.error ||
					"Failed to update profile. Please try again."
			);
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setSaving(true);

		if (formData.newPassword !== formData.confirmPassword) {
			setError("New passwords do not match");
			setSaving(false);
			return;
		}

		try {
			const response = await api.put("/api/change-password", {
				currentPassword: formData.currentPassword,
				newPassword: formData.newPassword,
			});

			if (response.status === 200) {
				setSuccess("Password changed successfully!");
				setFormData({
					...formData,
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				api.clearUserCache();
			}
		} catch (err) {
			if (err.response?.status === 401) {
				navigate("/login");
				return;
			}
			setError(
				err.response?.data?.error ||
					"Failed to change password. Please try again."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = async () => {
		try {
			await api.post("/api/logout");
			navigate("/login");
		} catch (error) {
			console.error("Logout failed:", error);
			// Still navigate to login even if the API call fails
			navigate("/login");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="bg-white shadow sm:rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900">
								Profile Settings
							</h3>
							<button
								onClick={handleLogout}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
							>
								<FaSignOutAlt className="mr-2 -ml-1 h-4 w-4" />
								Logout
							</button>
						</div>

						{error && (
							<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<FaExclamationTriangle className="h-5 w-5 text-red-400" />
									</div>
									<div className="ml-3">
										<p className="text-sm text-red-700">{error}</p>
									</div>
								</div>
							</div>
						)}

						{success && (
							<div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<FaSave className="h-5 w-5 text-green-400" />
									</div>
									<div className="ml-3">
										<p className="text-sm text-green-700">{success}</p>
									</div>
								</div>
							</div>
						)}

						<div className="border-b border-gray-200">
							<nav className="-mb-px flex space-x-8">
								<button
									onClick={() => setActiveTab("personal")}
									className={`${
										activeTab === "personal"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaUser className="inline-block mr-2" />
									Personal Information
								</button>
								<button
									onClick={() => setActiveTab("pharmacy")}
									className={`${
										activeTab === "pharmacy"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaBuilding className="inline-block mr-2" />
									Pharmacy Information
								</button>
								<button
									onClick={() => setActiveTab("security")}
									className={`${
										activeTab === "security"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaShieldAlt className="inline-block mr-2" />
									Security
								</button>
							</nav>
						</div>

						{activeTab === "personal" && (
							<form onSubmit={handleSubmit} className="mt-6 space-y-6">
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<div>
										<label
											htmlFor="name"
											className="block text-sm font-medium text-gray-700"
										>
											Full Name
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaUser className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												id="name"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.name}
												onChange={handleChange}
												placeholder="Your full name"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="email"
											className="block text-sm font-medium text-gray-700"
										>
											Email Address
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaEnvelope className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="email"
												id="email"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.email}
												onChange={handleChange}
												placeholder="Your email address"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="phone"
											className="block text-sm font-medium text-gray-700"
										>
											Phone Number
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaPhone className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="tel"
												id="phone"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.phone}
												onChange={handleChange}
												placeholder="Your phone number"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="address"
											className="block text-sm font-medium text-gray-700"
										>
											Address
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												id="address"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.address}
												onChange={handleChange}
												placeholder="Your address"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="dob"
											className="block text-sm font-medium text-gray-700"
										>
											Date of Birth
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaCalendar className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="date"
												id="dob"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.dob}
												onChange={handleChange}
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="gender"
											className="block text-sm font-medium text-gray-700"
										>
											Gender
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaUser className="h-5 w-5 text-gray-400" />
											</div>
											<select
												id="gender"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.gender}
												onChange={handleChange}
											>
												<option value="">Select gender</option>
												<option value="male">Male</option>
												<option value="female">Female</option>
												<option value="other">Other</option>
												<option value="prefer_not_to_say">
													Prefer not to say
												</option>
											</select>
										</div>
									</div>
								</div>

								<div className="flex justify-end">
									{!isEditing ? (
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											<FaEdit className="mr-2 -ml-1 h-4 w-4" />
											Edit Profile
										</button>
									) : (
										<div className="space-x-3">
											<button
												type="button"
												onClick={() => setIsEditing(false)}
												className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
											>
												<FaTimes className="mr-2 -ml-1 h-4 w-4" />
												Cancel
											</button>
											<button
												type="submit"
												disabled={saving}
												className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
													saving
														? "bg-blue-400 cursor-not-allowed"
														: "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
												}`}
											>
												{saving ? (
													<>
														<svg
															className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
														>
															<circle
																className="opacity-25"
																cx="12"
																cy="12"
																r="10"
																stroke="currentColor"
																strokeWidth="4"
															></circle>
															<path
																className="opacity-75"
																fill="currentColor"
																d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
															></path>
														</svg>
														Saving...
													</>
												) : (
													<>
														<FaSave className="mr-2 -ml-1 h-4 w-4" />
														Save Changes
													</>
												)}
											</button>
										</div>
									)}
								</div>
							</form>
						)}

						{activeTab === "pharmacy" && (
							<form onSubmit={handleSubmit} className="mt-6 space-y-6">
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
									<div>
										<label
											htmlFor="pharmacyName"
											className="block text-sm font-medium text-gray-700"
										>
											Pharmacy Name
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaBuilding className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												id="pharmacyName"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.pharmacyName}
												onChange={handleChange}
												placeholder="Your pharmacy name"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="pharmacyLicense"
											className="block text-sm font-medium text-gray-700"
										>
											Pharmacy License Number
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaIdCard className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												id="pharmacyLicense"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.pharmacyLicense}
												onChange={handleChange}
												placeholder="Your pharmacy license number"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="pharmacyAddress"
											className="block text-sm font-medium text-gray-700"
										>
											Pharmacy Address
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												id="pharmacyAddress"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.pharmacyAddress}
												onChange={handleChange}
												placeholder="Your pharmacy address"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="pharmacyPhone"
											className="block text-sm font-medium text-gray-700"
										>
											Pharmacy Phone
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaPhone className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="tel"
												id="pharmacyPhone"
												disabled={!isEditing}
												className={`block w-full pl-10 pr-3 py-2 border ${
													isEditing
														? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
														: "border-gray-200 bg-gray-50"
												} rounded-md shadow-sm focus:outline-none sm:text-sm`}
												value={formData.pharmacyPhone}
												onChange={handleChange}
												placeholder="Your pharmacy phone number"
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-end">
									{!isEditing ? (
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											<FaEdit className="mr-2 -ml-1 h-4 w-4" />
											Edit Pharmacy Information
										</button>
									) : (
										<div className="space-x-3">
											<button
												type="button"
												onClick={() => setIsEditing(false)}
												className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
											>
												<FaTimes className="mr-2 -ml-1 h-4 w-4" />
												Cancel
											</button>
											<button
												type="submit"
												disabled={saving}
												className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
													saving
														? "bg-blue-400 cursor-not-allowed"
														: "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
												}`}
											>
												{saving ? (
													<>
														<svg
															className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
														>
															<circle
																className="opacity-25"
																cx="12"
																cy="12"
																r="10"
																stroke="currentColor"
																strokeWidth="4"
															></circle>
															<path
																className="opacity-75"
																fill="currentColor"
																d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
															></path>
														</svg>
														Saving...
													</>
												) : (
													<>
														<FaSave className="mr-2 -ml-1 h-4 w-4" />
														Save Changes
													</>
												)}
											</button>
										</div>
									)}
								</div>
							</form>
						)}

						{activeTab === "security" && (
							<form onSubmit={handlePasswordChange} className="mt-6 space-y-6">
								<div className="space-y-6">
									<div>
										<label
											htmlFor="currentPassword"
											className="block text-sm font-medium text-gray-700"
										>
											Current Password
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaLock className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="password"
												id="currentPassword"
												className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
												value={formData.currentPassword}
												onChange={handleChange}
												placeholder="Enter your current password"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="newPassword"
											className="block text-sm font-medium text-gray-700"
										>
											New Password
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaKey className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="password"
												id="newPassword"
												className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
												value={formData.newPassword}
												onChange={handleChange}
												placeholder="Enter your new password"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="confirmPassword"
											className="block text-sm font-medium text-gray-700"
										>
											Confirm New Password
										</label>
										<div className="mt-1 relative rounded-md shadow-sm">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<FaKey className="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="password"
												id="confirmPassword"
												className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
												value={formData.confirmPassword}
												onChange={handleChange}
												placeholder="Confirm your new password"
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-end">
									<button
										type="submit"
										disabled={saving}
										className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
											saving
												? "bg-blue-400 cursor-not-allowed"
												: "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										}`}
									>
										{saving ? (
											<>
												<svg
													className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														className="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														strokeWidth="4"
													></circle>
													<path
														className="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Updating...
											</>
										) : (
											<>
												<FaSave className="mr-2 -ml-1 h-4 w-4" />
												Update Password
											</>
										)}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
