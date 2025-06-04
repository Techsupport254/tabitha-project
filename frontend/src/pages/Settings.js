import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
	FaBell,
	FaPalette,
	FaLanguage,
	FaSave,
	FaTimes,
	FaExclamationTriangle,
	FaCheck,
	FaMoon,
	FaSun,
	FaDesktop,
} from "react-icons/fa";

const Settings = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activeTab, setActiveTab] = useState("notifications");
	const [settings, setSettings] = useState({
		// Notification Settings
		emailNotifications: true,
		smsNotifications: false,
		appointmentReminders: true,
		prescriptionUpdates: true,
		inventoryAlerts: true,

		// Appearance Settings
		theme: "light", // light, dark, system
		fontSize: "medium", // small, medium, large
		compactMode: false,

		// Language Settings
		language: "en", // en, es, fr, etc.
		dateFormat: "MM/DD/YYYY",
		timeFormat: "12h", // 12h, 24h
		timezone: "UTC",
	});

	useEffect(() => {
		const fetchUserAndSettings = async () => {
			try {
				// Check authentication
				const userResponse = await api.get("/api/user");
				if (!userResponse.data) {
					navigate("/login");
					return;
				}

				// Fetch user settings from backend
				const settingsResponse = await api.get("/api/settings");
				if (settingsResponse.data) {
					setSettings(settingsResponse.data);
				}
			} catch (error) {
				if (error.response?.status === 401) {
					navigate("/login");
					return;
				}
				console.error("Error fetching settings:", error);
				setError("Failed to load settings. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchUserAndSettings();
	}, [navigate]);

	const handleChange = (e) => {
		const { id, type, checked, value } = e.target;
		setSettings((prev) => ({
			...prev,
			[id]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setSaving(true);

		try {
			// Save settings to backend
			const response = await api.put("/api/settings", settings);
			if (response.status === 200) {
				setSuccess("Settings updated successfully!");
			}
		} catch (err) {
			console.error("Settings update error:", err);
			if (err.response?.status === 401) {
				navigate("/login");
				return;
			}
			setError(
				err.response?.data?.error ||
					"Failed to update settings. Please try again."
			);
		} finally {
			setSaving(false);
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
								Application Settings
							</h3>
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
										<FaCheck className="h-5 w-5 text-green-400" />
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
									onClick={() => setActiveTab("notifications")}
									className={`${
										activeTab === "notifications"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaBell className="inline-block mr-2" />
									Notifications
								</button>
								<button
									onClick={() => setActiveTab("appearance")}
									className={`${
										activeTab === "appearance"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaPalette className="inline-block mr-2" />
									Appearance
								</button>
								<button
									onClick={() => setActiveTab("language")}
									className={`${
										activeTab === "language"
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
								>
									<FaLanguage className="inline-block mr-2" />
									Language & Region
								</button>
							</nav>
						</div>

						<form onSubmit={handleSubmit} className="mt-6 space-y-6">
							{activeTab === "notifications" && (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="emailNotifications"
												type="checkbox"
												checked={settings.emailNotifications}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="emailNotifications"
												className="ml-2 block text-sm text-gray-900"
											>
												Email Notifications
											</label>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="smsNotifications"
												type="checkbox"
												checked={settings.smsNotifications}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="smsNotifications"
												className="ml-2 block text-sm text-gray-900"
											>
												SMS Notifications
											</label>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="appointmentReminders"
												type="checkbox"
												checked={settings.appointmentReminders}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="appointmentReminders"
												className="ml-2 block text-sm text-gray-900"
											>
												Appointment Reminders
											</label>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="prescriptionUpdates"
												type="checkbox"
												checked={settings.prescriptionUpdates}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="prescriptionUpdates"
												className="ml-2 block text-sm text-gray-900"
											>
												Prescription Updates
											</label>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="inventoryAlerts"
												type="checkbox"
												checked={settings.inventoryAlerts}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="inventoryAlerts"
												className="ml-2 block text-sm text-gray-900"
											>
												Inventory Alerts
											</label>
										</div>
									</div>
								</div>
							)}

							{activeTab === "appearance" && (
								<div className="space-y-6">
									<div>
										<label className="block text-sm font-medium text-gray-700">
											Theme
										</label>
										<div className="mt-2 grid grid-cols-3 gap-3">
											<button
												type="button"
												onClick={() =>
													setSettings({ ...settings, theme: "light" })
												}
												className={`${
													settings.theme === "light"
														? "border-blue-500 ring-2 ring-blue-500"
														: "border-gray-300"
												} relative block w-full rounded-lg border p-4 focus:outline-none`}
											>
												<FaSun className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
												<span className="block text-sm font-medium text-gray-900">
													Light
												</span>
											</button>

											<button
												type="button"
												onClick={() =>
													setSettings({ ...settings, theme: "dark" })
												}
												className={`${
													settings.theme === "dark"
														? "border-blue-500 ring-2 ring-blue-500"
														: "border-gray-300"
												} relative block w-full rounded-lg border p-4 focus:outline-none`}
											>
												<FaMoon className="h-6 w-6 text-gray-500 mx-auto mb-2" />
												<span className="block text-sm font-medium text-gray-900">
													Dark
												</span>
											</button>

											<button
												type="button"
												onClick={() =>
													setSettings({ ...settings, theme: "system" })
												}
												className={`${
													settings.theme === "system"
														? "border-blue-500 ring-2 ring-blue-500"
														: "border-gray-300"
												} relative block w-full rounded-lg border p-4 focus:outline-none`}
											>
												<FaDesktop className="h-6 w-6 text-gray-500 mx-auto mb-2" />
												<span className="block text-sm font-medium text-gray-900">
													System
												</span>
											</button>
										</div>
									</div>

									<div>
										<label
											htmlFor="fontSize"
											className="block text-sm font-medium text-gray-700"
										>
											Font Size
										</label>
										<select
											id="fontSize"
											value={settings.fontSize}
											onChange={handleChange}
											className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
										>
											<option value="small">Small</option>
											<option value="medium">Medium</option>
											<option value="large">Large</option>
										</select>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<input
												id="compactMode"
												type="checkbox"
												checked={settings.compactMode}
												onChange={handleChange}
												className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
											<label
												htmlFor="compactMode"
												className="ml-2 block text-sm text-gray-900"
											>
												Compact Mode
											</label>
										</div>
									</div>
								</div>
							)}

							{activeTab === "language" && (
								<div className="space-y-6">
									<div>
										<label
											htmlFor="language"
											className="block text-sm font-medium text-gray-700"
										>
											Language
										</label>
										<select
											id="language"
											value={settings.language}
											onChange={handleChange}
											className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
										>
											<option value="en">English</option>
											<option value="es">Español</option>
											<option value="fr">Français</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="dateFormat"
											className="block text-sm font-medium text-gray-700"
										>
											Date Format
										</label>
										<select
											id="dateFormat"
											value={settings.dateFormat}
											onChange={handleChange}
											className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
										>
											<option value="MM/DD/YYYY">MM/DD/YYYY</option>
											<option value="DD/MM/YYYY">DD/MM/YYYY</option>
											<option value="YYYY-MM-DD">YYYY-MM-DD</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="timeFormat"
											className="block text-sm font-medium text-gray-700"
										>
											Time Format
										</label>
										<select
											id="timeFormat"
											value={settings.timeFormat}
											onChange={handleChange}
											className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
										>
											<option value="12h">12-hour</option>
											<option value="24h">24-hour</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="timezone"
											className="block text-sm font-medium text-gray-700"
										>
											Timezone
										</label>
										<select
											id="timezone"
											value={settings.timezone}
											onChange={handleChange}
											className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
										>
											<option value="UTC">UTC</option>
											<option value="EST">Eastern Time</option>
											<option value="CST">Central Time</option>
											<option value="MST">Mountain Time</option>
											<option value="PST">Pacific Time</option>
										</select>
									</div>
								</div>
							)}

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
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Settings;
