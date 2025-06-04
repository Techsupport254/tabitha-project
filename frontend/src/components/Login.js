import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
	FaEnvelope,
	FaLock,
	FaExclamationTriangle,
	FaEye,
	FaEyeSlash,
} from "react-icons/fa";

const Login = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState({
		email: "",
		password: "",
		general: "",
	});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
			email: "",
			password: "",
			general: "",
		};

		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);
		return !Object.values(newErrors).some((error) => error !== "");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrors((prev) => ({ ...prev, general: "" }));

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			console.log("Attempting login with:", { email: formData.email });
			const response = await api.post("/api/login", {
				email: formData.email.trim(),
				password: formData.password,
			});

			console.log("Login response:", response.data);

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
			console.error("Login error:", error);
			if (error.response?.status === 401) {
				setErrors((prev) => ({
					...prev,
					general: "Invalid email or password",
				}));
			} else {
				setErrors((prev) => ({
					...prev,
					general:
						error.response?.data?.error || "Failed to login. Please try again.",
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
					<h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
					<p className="mt-2 text-sm text-gray-600">
						Please sign in to your account
					</p>
				</div>

				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

					<form className="space-y-6" onSubmit={handleSubmit}>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email address
							</label>
							<div className="mt-1 relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaEnvelope className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={formData.email}
									onChange={handleChange}
									className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
										errors.email ? "border-red-300" : "border-gray-300"
									} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
									placeholder="Enter your email"
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
							<div className="mt-1 relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaLock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									required
									value={formData.password}
									onChange={handleChange}
									className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
										errors.password ? "border-red-300" : "border-gray-300"
									} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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

						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<input
									id="remember-me"
									name="remember-me"
									type="checkbox"
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label
									htmlFor="remember-me"
									className="ml-2 block text-sm text-gray-900"
								>
									Remember me
								</label>
							</div>

							<div className="text-sm">
								<a
									href="#"
									className="font-medium text-blue-600 hover:text-blue-500"
								>
									Forgot your password?
								</a>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
									loading ? "opacity-50 cursor-not-allowed" : ""
								}`}
							>
								{loading ? "Signing in..." : "Sign in"}
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
									Don't have an account?
								</span>
							</div>
						</div>

						<div className="mt-6">
							<a
								href="/create-account"
								className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Create a new account
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
