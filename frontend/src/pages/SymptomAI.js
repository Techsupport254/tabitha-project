import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
	FaRobot,
	FaUserMd,
	FaExclamationTriangle,
	FaSpinner,
	FaInfoCircle,
	FaExclamationCircle,
	FaCheckCircle,
	FaFlask,
} from "react-icons/fa";

const SymptomAI = () => {
	const navigate = useNavigate();
	const [symptoms, setSymptoms] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [result, setResult] = useState(null);
	const [modalContent, setModalContent] = useState(null); // State to hold content for the modal

	// Check authentication on component mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				// Attempt to fetch user data - this requires authentication
				await api.get("/api/user"); // Use the same endpoint Header uses
				// If successful, user is authenticated, do nothing or set user state if needed
			} catch (error) {
				console.error("Authentication check failed for SymptomAI page:", error);
				// If request fails (e.g., 401 Unauthorized or network error), redirect to login
				navigate("/login");
			}
		};
		checkAuth();
	}, [navigate]); // Rerun check if navigate changes

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setResult(null);
		setLoading(true);

		try {
			console.log("Sending symptoms for analysis:", symptoms);
			const response = await api.post("/api/symptoms", {
				description: symptoms.trim(),
			});

			console.log("Raw analysis response:", response);
			console.log("Analysis response data:", response.data);

			// Ensure we have the expected data structure
			if (!response.data || typeof response.data !== "object") {
				throw new Error("Invalid response format from server");
			}

			// Validate the response structure
			if (!Array.isArray(response.data.symptoms)) {
				console.error("Symptoms array missing or invalid:", response.data);
				throw new Error("Invalid symptoms data in response");
			}

			if (!Array.isArray(response.data.recommendations)) {
				console.error(
					"Recommendations array missing or invalid:",
					response.data
				);
				throw new Error("Invalid recommendations data in response");
			}

			setResult(response.data);
		} catch (error) {
			console.error("Analysis error:", error);
			if (error.response?.status === 401) {
				setError("Please log in to use this feature");
				navigate("/login");
			} else {
				setError(
					error.response?.data?.error ||
						error.message ||
						"Failed to analyze symptoms. Please try again."
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-3xl font-bold text-blue-700 mb-2 text-center">
					Symptom Analysis AI
				</h1>
				<p className="text-center text-gray-600 mb-6">
					AI-powered tool to help you understand your symptoms and get
					personalized recommendations. <br />
					<strong>Not a substitute for professional medical advice.</strong>
				</p>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Guide/Info Column */}
					<div className="lg:w-1/2 w-full space-y-6">
						<div className="bg-white shadow rounded-lg p-6 space-y-6">
							{/* User Guide */}
							<div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
								<h2 className="text-lg font-semibold text-blue-800 mb-2">
									How to Use
								</h2>
								<ol className="list-decimal list-inside text-blue-900 space-y-1">
									<li>
										Describe your symptoms in as much detail as possible in the
										box.
									</li>
									<li>
										Include duration, severity, and any other relevant
										information (e.g., "I have had a persistent cough and mild
										fever for 3 days").
									</li>
									<li>
										Click{" "}
										<span className="font-semibold">Analyze Symptoms</span> to
										get AI-powered insights.
									</li>
									<li>
										Review the possible conditions and recommended actions.
									</li>
									<li>
										Always consult a healthcare professional for diagnosis and
										treatment.
									</li>
								</ol>
							</div>
							{/* How it Works */}
							<div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded">
								<h2 className="text-lg font-semibold text-gray-800 mb-2">
									How it Works
								</h2>
								<ul className="list-disc list-inside text-gray-700 space-y-1">
									<li>
										Your symptom description is securely sent to our AI system.
									</li>
									<li>
										The AI analyzes your input using machine learning models
										trained on medical data.
									</li>
									<li>
										It identifies key symptoms, suggests possible conditions,
										and recommends next steps.
									</li>
									<li>
										<strong>Data Integrity:</strong> We prioritize accuracy,
										consistency, and privacy in handling your data.
									</li>
									<li>
										<strong>Security:</strong> All data is processed securely
										and never shared without your consent.
									</li>
									<li>
										<strong>Limitations:</strong> The AI provides suggestions,
										not a diagnosis. Always seek professional care for urgent or
										serious symptoms.
									</li>
								</ul>
							</div>
							{/* Best Practices / Tips */}
							<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
								<h2 className="text-lg font-semibold text-yellow-800 mb-2">
									Tips for Accurate Results
								</h2>
								<ul className="list-disc list-inside text-yellow-900 space-y-1">
									<li>Be honest and thorough in your symptom description.</li>
									<li>
										Mention any relevant medical history, allergies, or
										medications.
									</li>
									<li>
										Include details like when symptoms started, what makes them
										better or worse, and any recent travel or exposures.
									</li>
								</ul>
							</div>
							{/* Security & Privacy Note */}
							<div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
								<h2 className="text-lg font-semibold text-green-800 mb-2">
									Security & Privacy
								</h2>
								<p className="text-green-900">
									Your data is protected with industry-standard security
									measures. We never share your information without your
									consent. For more details, see our privacy policy.
								</p>
							</div>
						</div>
					</div>

					{/* Input/Results Column */}
					<div className="lg:w-1/2 w-full flex flex-col h-screen">
						{/* Input Form */}
						<div className="bg-white shadow rounded-lg p-6 mb-6 flex-shrink-0">
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label
										htmlFor="symptoms"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Describe Your Symptoms
									</label>
									<textarea
										id="symptoms"
										rows="4"
										className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Please describe your symptoms in detail. For example: 'I have been experiencing severe headache for the past 2 days, along with fever and fatigue.'"
										value={symptoms}
										onChange={(e) => setSymptoms(e.target.value)}
										required
									/>
								</div>

								<div className="flex justify-end">
									<button
										type="submit"
										disabled={loading}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
									>
										{loading ? (
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
												Analyzing...
											</>
										) : (
											"Analyze Symptoms"
										)}
									</button>
								</div>
							</form>

							{error && (
								<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
									<p className="text-sm text-red-600">{error}</p>
								</div>
							)}
						</div>

						{/* Results Section */}
						<div className="bg-white shadow rounded-lg p-6 mb-6 flex-grow overflow-y-auto">
							{result && (
								<div className="space-y-6 sticky top-4 lg:top-6">
									<div className="bg-blue-50 border border-blue-200 rounded-md p-4">
										<h2 className="text-lg font-medium text-blue-900 mb-2">
											Analysis Results
										</h2>
										<div className="space-y-4">
											{result.symptoms && result.symptoms.length > 0 && (
												<div>
													<h3 className="text-sm font-medium text-blue-700">
														Identified Symptoms
													</h3>
													<ul className="mt-2 list-disc list-inside text-sm text-blue-600">
														{result.symptoms.map((symptom, index) => (
															<li key={index}>{symptom}</li>
														))}
													</ul>
												</div>
											)}

											{result.recommendations &&
												result.recommendations.length > 0 && (
													<div>
														<h3 className="text-sm font-medium text-blue-700">
															Possible Conditions
														</h3>

														{/* Display main prediction */}
														{result.predictions &&
															result.predictions.length > 0 && (
																<div className="mt-2">
																	<h4 className="text-sm font-medium text-gray-900">
																		Main Prediction:{" "}
																		{result.predictions[0].disease} (
																		{Math.round(
																			result.predictions[0].confidence * 100
																		)}
																		% confidence)
																	</h4>
																</div>
															)}

														{/* Display detailed recommendations */}
														<div className="space-y-4 mt-4">
															{result.recommendations.map((rec, index) => (
																<div
																	key={index}
																	className="bg-white rounded-lg p-4 shadow-sm"
																>
																	<div className="flex justify-between items-start">
																		<h4 className="text-sm font-medium text-gray-900">
																			{rec.disease}
																		</h4>
																		<span className="text-xs text-gray-500">
																			{Math.round(rec.confidence * 100)}%
																			confidence
																		</span>
																	</div>

																	{rec.medication && (
																		<div className="mt-2">
																			<h5 className="text-xs font-medium text-gray-700 mb-1">
																				Recommended Medication:
																			</h5>
																			<div className="text-sm text-gray-600">
																				<div className="font-medium">
																					{rec.medication}
																				</div>
																				{rec.dosage && (
																					<div className="text-xs text-gray-500 mt-1">
																						<span className="font-medium">
																							Dosage:
																						</span>{" "}
																						{rec.dosage.length > 150
																							? `${rec.dosage.substring(
																									0,
																									150
																							  )}...`
																							: rec.dosage}
																					</div>
																				)}
																				{rec.instructions && (
																					<div
																						className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline"
																						onClick={() =>
																							setModalContent(rec.instructions)
																						}
																					>
																						<span className="font-medium">
																							Instructions:
																						</span>{" "}
																						Click to view full instructions
																					</div>
																				)}
																			</div>
																		</div>
																	)}
																</div>
															))}
														</div>
													</div>
												)}

											<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
												<p className="text-sm text-yellow-700">
													<strong>Note:</strong> This analysis is provided by AI
													and should not replace professional medical advice.
													Please consult with a healthcare provider for proper
													diagnosis and treatment.
												</p>
											</div>

											{/* Button to Patient Records */}
											<div className="mt-6 text-center">
												<button
													onClick={() => navigate("/patient-records")}
													className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
												>
													View Patient Records
												</button>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Modal for full instructions */}
			{modalContent && (
				<div
					className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
					onClick={() => setModalContent(null)}
				>
					<div
						className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium text-gray-900">
								Full Instructions
							</h3>
							<button
								onClick={() => setModalContent(null)}
								className="text-gray-400 hover:text-gray-600 text-xl leading-none font-semibold"
							>
								&times;
							</button>
						</div>
						<div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
							{modalContent}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SymptomAI;
