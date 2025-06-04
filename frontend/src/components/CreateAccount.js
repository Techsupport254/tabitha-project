import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
	FaUser,
	FaEnvelope,
	FaLock,
	FaCheck,
	FaEye,
	FaEyeSlash,
	FaExclamationTriangle,
	FaCalendarAlt,
	FaVenusMars,
	FaUserPlus,
	FaCheckCircle,
} from "react-icons/fa";

const CreateAccount = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "patient", // Default role for UI registrations
		dob: "",
		gender: "male", // Default gender
	});
	const [errors, setErrors] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		dob: "",
		gender: "",
		general: "",
	});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validatePassword = (password) => {
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
		return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
	};

	const validateField = (name, value) => {
		let error = "";
		switch (name) {
			case "name":
				if (!value.trim()) {
					error = "Name is required";
				} else if (value.length < 2) {
					error = "Name must be at least 2 characters long";
				}
				break;
			case "email":
				if (!value.trim()) {
					error = "Email is required";
				} else if (!validateEmail(value)) {
					error = "Please enter a valid email address";
				}
				break;
			case "password":
				if (!value) {
					error = "Password is required";
				} else if (value.length < 8) {
					error = "Password must be at least 8 characters long";
				} else if (!validatePassword(value)) {
					error =
						"Password must contain uppercase, lowercase, number, and special character";
				}
				break;
			case "confirmPassword":
				if (!value) {
					error = "Please confirm your password";
				} else if (value !== formData.password) {
					error = "Passwords do not match";
				}
				break;
			case "dob":
				if (!value) {
					error = "Date of birth is required";
				} else {
					const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
					if (!dateRegex.test(value)) {
						error = "Date must be in YYYY-MM-DD format";
					} else {
						const date = new Date(value);
						if (isNaN(date.getTime())) {
							error = "Invalid date";
						}
					}
				}
				break;
			case "gender":
				if (!value) {
					error = "Gender is required";
				} else if (!["male", "female", "other"].includes(value)) {
					error = "Invalid gender selection";
				}
				break;
			default:
				break;
		}
		return error;
	};

	const handleChange = (e) => {
		const { id, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[id]: value,
		}));
		// Clear error when user starts typing
		if (errors[id]) {
			setErrors((prev) => ({
				...prev,
				[id]: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {
			name: validateField("name", formData.name),
			email: validateField("email", formData.email),
			password: validateField("password", formData.password),
			confirmPassword: validateField(
				"confirmPassword",
				formData.confirmPassword
			),
			dob: validateField("dob", formData.dob),
			gender: validateField("gender", formData.gender),
			general: "",
		};

		setErrors(newErrors);
		return !Object.values(newErrors).some((error) => error !== "");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccess(false);
		setErrors((prev) => ({ ...prev, general: "" }));

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			console.log("Attempting registration with:", {
				name: formData.name,
				email: formData.email,
			});
			const response = await api.post("/api/register", {
				name: formData.name.trim(),
				email: formData.email.trim(),
				password: formData.password,
				role: formData.role,
				dob: formData.dob,
				gender: formData.gender,
			});

			console.log("Registration response:", response.data);

			if (response.data.user) {
				// Navigate to home page
				navigate("/");
			} else {
				setErrors((prev) => ({
					...prev,
					general: "Invalid response from server",
				}));
			}
		} catch (error) {
			console.error("Registration error:", error);
			if (error.response?.status === 409) {
				setErrors((prev) => ({
					...prev,
					email: "Email is already registered",
				}));
			} else {
				setErrors((prev) => ({
					...prev,
					general:
						error.response?.data?.error ||
						"Failed to create account. Please try again.",
				}));
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md mx-auto">
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900">
						Create Your Account
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Join our pharmacy management system as a patient
					</p>
				</div>

				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{success && (
						<div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<FaCheck className="h-5 w-5 text-green-400" />
								</div>
								<div className="ml-3">
									<p className="text-sm text-green-700">
										Account created successfully! Redirecting...
									</p>
								</div>
							</div>
						</div>
					)}

					{errors.general && (
						<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<FaExclamationTriangle className="h-5 w-5 text-red-400" />
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-700">{errors.general}</p>
								</div>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
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
									className={`block w-full pl-10 pr-3 py-2 border ${
										errors.name
											? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.name}
									onChange={handleChange}
									placeholder="Enter your full name"
								/>
							</div>
							{errors.name && (
								<p className="mt-2 text-sm text-red-600">{errors.name}</p>
							)}
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
									className={`block w-full pl-10 pr-3 py-2 border ${
										errors.email
											? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.email}
									onChange={handleChange}
									placeholder="Enter your email address"
								/>
							</div>
							{errors.email && (
								<p className="mt-2 text-sm text-red-600">{errors.email}</p>
							)}
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaLock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									className={`block w-full pl-10 pr-10 py-2 border ${
										errors.password
											? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.password}
									onChange={handleChange}
									placeholder="Enter your password"
								/>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="text-gray-400 hover:text-gray-500 focus:outline-none"
									>
										{showPassword ? (
											<FaEyeSlash className="h-5 w-5" />
										) : (
											<FaEye className="h-5 w-5" />
										)}
									</button>
								</div>
							</div>
							{errors.password && (
								<p className="mt-2 text-sm text-red-600">{errors.password}</p>
							)}
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700"
							>
								Confirm Password
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaLock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									type={showConfirmPassword ? "text" : "password"}
									id="confirmPassword"
									className={`block w-full pl-10 pr-10 py-2 border ${
										errors.confirmPassword
											? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.confirmPassword}
									onChange={handleChange}
									placeholder="Confirm your password"
								/>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="text-gray-400 hover:text-gray-500 focus:outline-none"
									>
										{showConfirmPassword ? (
											<FaEyeSlash className="h-5 w-5" />
										) : (
											<FaEye className="h-5 w-5" />
										)}
									</button>
								</div>
							</div>
							{errors.confirmPassword && (
								<p className="mt-2 text-sm text-red-600">
									{errors.confirmPassword}
								</p>
							)}
						</div>

						<div>
							<label
								htmlFor="dob"
								className="block text-sm font-medium text-gray-700"
							>
								Date of Birth
							</label>
							<div className="mt-1">
								<input
									type="date"
									id="dob"
									className={`block w-full pl-3 pr-3 py-2 border ${
										errors.dob
											? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.dob}
									onChange={handleChange}
								/>
							</div>
							{errors.dob && (
								<p className="mt-2 text-sm text-red-600">{errors.dob}</p>
							)}
						</div>

						<div>
							<label
								htmlFor="gender"
								className="block text-sm font-medium text-gray-700"
							>
								Gender
							</label>
							<div className="mt-1">
								<select
									id="gender"
									className={`block w-full pl-3 pr-10 py-2 border ${
										errors.gender
											? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
									} rounded-md shadow-sm focus:outline-none sm:text-sm`}
									value={formData.gender}
									onChange={handleChange}
								>
									<option value="male">Male</option>
									<option value="female">Female</option>
									<option value="other">Other</option>
								</select>
							</div>
							{errors.gender && (
								<p className="mt-2 text-sm text-red-600">{errors.gender}</p>
							)}
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
									loading
										? "bg-blue-400 cursor-not-allowed"
										: "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								}`}
							>
								{loading ? (
									<div className="flex items-center">
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
										Creating account...
									</div>
								) : (
									"Create Account"
								)}
							</button>
						</div>
					</form>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">
									Already have an account?
								</span>
							</div>
						</div>

						<div className="mt-6">
							<a
								href="/login"
								className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Sign in
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateAccount;
