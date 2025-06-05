import React, { useState, useEffect } from "react";
import {
	FaPills,
	FaInfoCircle,
	FaExclamationTriangle,
	FaCheckCircle,
	FaHistory,
	FaRedo,
	FaUserMd,
	FaQuestionCircle,
} from "react-icons/fa";
import api from "../utils/api";

const RecommendedMedicine = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("current"); // 'current' or 'history'

	useEffect(() => {
		fetchRecommendations();
	}, []);

	const fetchRecommendations = async () => {
		try {
			setLoading(true);
			const response = await api.get("/api/recommendations");
			setRecommendations(response.data);
			setError(null);
		} catch (err) {
			setError("Failed to fetch recommendations. Please try again later.");
			console.error("Error fetching recommendations:", err);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status.toLowerCase()) {
			case "active":
				return "bg-green-100 text-green-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "completed":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="bg-white p-6 rounded-lg shadow">
									<div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header - Keep it visible even in error state */}
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900">
							Recommended Medicine
						</h1>
						<p className="mt-2 text-sm text-gray-600">
							View your current and past medication recommendations based on
							your symptoms and medical history.
						</p>
					</div>

					{/* Enhanced Error State */}
					<div className="bg-white rounded-lg shadow-lg overflow-hidden">
						<div className="p-8">
							<div className="text-center">
								<div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
									<FaExclamationTriangle className="h-12 w-12 text-red-600" />
								</div>
								<h3 className="mt-4 text-lg font-medium text-gray-900">
									Unable to Load Recommendations
								</h3>
								<p className="mt-2 text-sm text-gray-500">{error}</p>
								<div className="mt-6 space-y-4">
									<button
										onClick={fetchRecommendations}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										<FaRedo className="mr-2 -ml-1 h-4 w-4" />
										Try Again
									</button>
									<div className="text-sm text-gray-500">
										<p className="flex items-center justify-center">
											<FaQuestionCircle className="mr-2 h-4 w-4" />
											Need help? Contact our support team
										</p>
									</div>
								</div>
							</div>

							{/* Troubleshooting Tips */}
							<div className="mt-8 border-t border-gray-200 pt-6">
								<h4 className="text-sm font-medium text-gray-900 mb-4">
									Troubleshooting Tips:
								</h4>
								<ul className="space-y-3 text-sm text-gray-500">
									<li className="flex items-start">
										<FaCheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
										<span>Check your internet connection</span>
									</li>
									<li className="flex items-start">
										<FaCheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
										<span>Ensure you're logged in to your account</span>
									</li>
									<li className="flex items-start">
										<FaCheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
										<span>Try refreshing the page</span>
									</li>
									<li className="flex items-start">
										<FaCheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
										<span>Clear your browser cache and cookies</span>
									</li>
								</ul>
							</div>

							{/* Contact Support */}
							<div className="mt-6 bg-blue-50 rounded-lg p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<FaUserMd className="h-5 w-5 text-blue-400" />
									</div>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-blue-800">
											Still having issues?
										</h3>
										<div className="mt-2 text-sm text-blue-700">
											<p>Our support team is here to help. Contact us at:</p>
											<p className="mt-1 font-medium">support@uzurichem.com</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Recommended Medicine
					</h1>
					<p className="mt-2 text-sm text-gray-600">
						View your current and past medication recommendations based on your
						symptoms and medical history.
					</p>
				</div>

				{/* Tabs */}
				<div className="border-b border-gray-200 mb-6">
					<nav className="-mb-px flex space-x-8">
						<button
							onClick={() => setActiveTab("current")}
							className={`${
								activeTab === "current"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
						>
							<FaPills className="mr-2" />
							Current Recommendations
						</button>
						<button
							onClick={() => setActiveTab("history")}
							className={`${
								activeTab === "history"
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
						>
							<FaHistory className="mr-2" />
							History
						</button>
					</nav>
				</div>

				{/* Recommendations List */}
				<div className="space-y-6">
					{recommendations.length === 0 ? (
						<div className="text-center py-12">
							<FaInfoCircle className="mx-auto h-12 w-12 text-gray-400" />
							<h3 className="mt-2 text-sm font-medium text-gray-900">
								No recommendations
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								{activeTab === "current"
									? "You don't have any current medication recommendations."
									: "You don't have any past medication recommendations."}
							</p>
						</div>
					) : (
						recommendations
							.filter((rec) =>
								activeTab === "current"
									? rec.status === "active"
									: rec.status === "completed"
							)
							.map((recommendation) => (
								<div
									key={recommendation.id}
									className="bg-white shadow rounded-lg overflow-hidden"
								>
									<div className="p-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center">
												<div className="flex-shrink-0">
													<FaPills className="h-6 w-6 text-blue-500" />
												</div>
												<div className="ml-4">
													<h3 className="text-lg font-medium text-gray-900">
														{recommendation.medicineName}
													</h3>
													<p className="text-sm text-gray-500">
														Recommended by: {recommendation.recommendedBy}
													</p>
												</div>
											</div>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
													recommendation.status
												)}`}
											>
												{recommendation.status}
											</span>
										</div>

										<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Dosage
												</h4>
												<p className="mt-1 text-sm text-gray-900">
													{recommendation.dosage}
												</p>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Frequency
												</h4>
												<p className="mt-1 text-sm text-gray-900">
													{recommendation.frequency}
												</p>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Duration
												</h4>
												<p className="mt-1 text-sm text-gray-900">
													{recommendation.duration}
												</p>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Reason
												</h4>
												<p className="mt-1 text-sm text-gray-900">
													{recommendation.reason}
												</p>
											</div>
										</div>

										{recommendation.notes && (
											<div className="mt-4">
												<h4 className="text-sm font-medium text-gray-500">
													Additional Notes
												</h4>
												<p className="mt-1 text-sm text-gray-900">
													{recommendation.notes}
												</p>
											</div>
										)}

										{recommendation.status === "active" && (
											<div className="mt-6 flex justify-end space-x-3">
												<button
													type="button"
													className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
												>
													View Details
												</button>
												<button
													type="button"
													className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
												>
													Get Prescription
												</button>
											</div>
										)}
									</div>
								</div>
							))
					)}
				</div>
			</div>
		</div>
	);
};

export default RecommendedMedicine;
