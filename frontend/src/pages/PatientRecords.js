import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { format } from "date-fns";

const PatientRecords = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [userRole, setUserRole] = useState("");
	const [userId, setUserId] = useState(null);

	// Fetch user role and ID on component mount
	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				const response = await api.get("/api/user");
				setUserRole(response.data.role);
				setUserId(response.data.id);
			} catch (error) {
				console.error("Error fetching user info:", error);
				// Only redirect on 401 errors, other errors should be handled differently
				if (error.response && error.response.status === 401) {
					navigate("/login");
				} else {
					setError("Failed to load user information. Please try again.");
				}
			}
		};
		fetchUserInfo();
	}, [navigate]);

	// Fetch patients data
	useEffect(() => {
		const fetchPatients = async () => {
			try {
				setLoading(true);
				let response;

				if (userRole === "patient" && userId) {
					// If user is a patient, fetch only their records
					response = await api.get(`/api/medical-history/${userId}`);
					// Format single patient data to match the expected structure
					const patient = response.data;
					setPatients([
						{
							patient_id: `${patient.id}-0`,
							original_id: patient.id,
							personal_info: {
								name: patient.name || "No Name",
								email: patient.email || "No Email",
								age: patient.age || "N/A",
								gender: patient.gender || "N/A",
								phone: patient.phone || "N/A",
							},
							conditions: Array.isArray(patient.medicalHistory)
								? patient.medicalHistory
								: [],
							created_at: patient.lastVisit || new Date().toISOString(),
						},
					]);
					setTotalPages(1);
					setSelectedPatient(response.data);
					setShowModal(true);
				} else {
					// If user is a doctor, fetch all patients with pagination
					response = await api.get("/api/patients", {
						params: {
							page: currentPage,
							search: searchTerm,
						},
					});
					const formattedPatients = response.data.patients.map(
						(patient, index) => ({
							patient_id: `${patient.id}-${index}`,
							original_id: patient.id,
							personal_info: {
								name: patient.name || "No Name",
								email: patient.email || "No Email",
								age: patient.age || "N/A",
								gender: patient.gender || "N/A",
								phone: patient.phone || "N/A",
							},
							conditions: Array.isArray(patient.medicalHistory)
								? patient.medicalHistory
								: [],
							created_at: patient.lastVisit || new Date().toISOString(),
						})
					);

					formattedPatients.sort((a, b) => {
						const dateA = new Date(a.created_at || 0);
						const dateB = new Date(b.created_at || 0);
						return dateB - dateA;
					});

					setPatients(formattedPatients);
					setTotalPages(response.data.totalPages);
				}
			} catch (error) {
				console.error("Error fetching patients:", error);
				setError("Failed to load patient records. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		const debounceTimer = setTimeout(() => {
			fetchPatients();
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [currentPage, searchTerm, userRole, userId]);

	const handleViewDetails = async (patient) => {
		try {
			const response = await api.get(
				`/api/medical-history/${patient.original_id}`
			);
			setSelectedPatient(response.data);
			setShowModal(true);
		} catch (error) {
			console.error("Error fetching patient details:", error);
			setError("Failed to load patient details. Please try again.");
		}
	};

	const handleEdit = (patient) => {
		navigate(`/edit-patient/${patient.original_id}`);
	};

	const formatDate = (dateString) => {
		try {
			return format(new Date(dateString), "MMM dd, yyyy");
		} catch (error) {
			return dateString;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white shadow rounded-lg">
					{/* Header */}
					<div className="px-4 py-5 border-b border-gray-200 sm:px-6">
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold text-gray-900">
								{userRole === "patient"
									? "My Medical Records"
									: "Patient Records"}
							</h1>
							{userRole === "doctor" && (
								<Link
									to="/add-patient"
									className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Add New Patient
								</Link>
							)}
						</div>
					</div>

					{/* Search Bar - Only show for doctors */}
					{userRole === "doctor" && (
						<div className="px-4 py-5 sm:px-6">
							<div className="max-w-lg">
								<label htmlFor="search" className="sr-only">
									Search patients
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg
											className="h-5 w-5 text-gray-400"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<input
										type="text"
										name="search"
										id="search"
										className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
										placeholder="Search patients..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="px-4 py-3 bg-red-50 border-b border-red-200">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{/* Loading State */}
					{loading ? (
						<div className="px-4 py-8 text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
							<p className="mt-2 text-sm text-gray-600">Loading patients...</p>
						</div>
					) : (
						<>
							{/* Search Bar - Only show for doctors */}
							{userRole === "doctor" && (
								<div className="px-4 py-5 sm:px-6">
									<div className="max-w-lg">
										<label htmlFor="search" className="sr-only">
											Search patients
										</label>
										<div className="relative">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<svg
													className="h-5 w-5 text-gray-400"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
											<input
												type="text"
												name="search"
												id="search"
												className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
												placeholder="Search patients..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
											/>
										</div>
									</div>
								</div>
							)}

							{/* Error Message */}
							{error && (
								<div className="px-4 py-3 bg-red-50 border-b border-red-200">
									<p className="text-sm text-red-600">{error}</p>
								</div>
							)}

							{/* No Records Found Message */}
							{!loading && !error && (
								<>
									{userRole === "doctor" && patients.length === 0 && (
										<div className="px-4 py-8 text-center text-gray-500">
											No patient records found.
										</div>
									)}
									{userRole === "patient" && !selectedPatient && (
										<div className="px-4 py-8 text-center text-gray-500">
											No medical records found for your account.
										</div>
									)}
								</>
							)}

							{/* Patient Table */}
							{userRole === "doctor" && patients.length > 0 && (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Name
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Age/Gender
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Contact
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Conditions
												</th>
												<th
													scope="col"
													className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{patients.map((patient) => (
												<tr
													key={patient.patient_id}
													className="hover:bg-gray-50"
												>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
															<div className="flex-shrink-0 h-10 w-10">
																<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
																	<span className="text-gray-500 font-medium">
																		{patient.personal_info.name
																			? patient.personal_info.name
																					.split(" ")
																					.map((n) => n[0])
																					.join("")
																			: "N/A"}
																	</span>
																</div>
															</div>
															<div className="ml-4">
																<div className="text-sm font-medium text-gray-900">
																	{patient.personal_info.name}
																</div>
																<div className="text-sm text-gray-500">
																	{patient.personal_info.email}
																</div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">
															{patient.personal_info.age !== "N/A"
																? `${patient.personal_info.age} years`
																: "N/A"}
														</div>
														<div className="text-sm text-gray-500">
															{patient.personal_info.gender}
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">
															{patient.personal_info.phone}
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex flex-wrap gap-1">
															{Array.isArray(patient.conditions) &&
															patient.conditions.length > 0 ? (
																patient.conditions.map((condition, index) => (
																	<span
																		key={index}
																		className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
																	>
																		{condition}
																	</span>
																))
															) : (
																<span className="text-gray-500 text-sm">
																	No conditions
																</span>
															)}
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														<button
															onClick={() => handleViewDetails(patient)}
															className="text-blue-600 hover:text-blue-900 mr-4"
														>
															View
														</button>
														{userRole === "doctor" && (
															<button
																onClick={() => handleEdit(patient)}
																className="text-blue-600 hover:text-blue-900"
															>
																Edit
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
									<div className="flex-1 flex justify-between sm:hidden">
										<button
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
										>
											Previous
										</button>
										<button
											onClick={() =>
												setCurrentPage((p) => Math.min(totalPages, p + 1))
											}
											disabled={currentPage === totalPages}
											className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
										>
											Next
										</button>
									</div>
									<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
										<div>
											<p className="text-sm text-gray-700">
												Showing page{" "}
												<span className="font-medium">{currentPage}</span> of{" "}
												<span className="font-medium">{totalPages}</span>
											</p>
										</div>
										<div>
											<nav
												className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
												aria-label="Pagination"
											>
												<button
													onClick={() =>
														setCurrentPage((p) => Math.max(1, p - 1))
													}
													disabled={currentPage === 1}
													className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
												>
													Previous
												</button>
												<button
													onClick={() =>
														setCurrentPage((p) => Math.min(totalPages, p + 1))
													}
													disabled={currentPage === totalPages}
													className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
												>
													Next
												</button>
											</nav>
										</div>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Patient Details Modal */}
			{showModal && selectedPatient && (
				<div className="fixed z-10 inset-0 overflow-y-auto">
					<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
						<div
							className="fixed inset-0 transition-opacity"
							aria-hidden="true"
						>
							<div className="absolute inset-0 bg-gray-500 opacity-75"></div>
						</div>
						<span
							className="hidden sm:inline-block sm:align-middle sm:h-screen"
							aria-hidden="true"
						>
							&#8203;
						</span>
						<div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
							<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
								<div className="sm:flex sm:items-start">
									<div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
										<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
											Patient Details
										</h3>
										<div className="mt-2 space-y-4">
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Personal Information
												</h4>
												<div className="mt-1 grid grid-cols-2 gap-4">
													<div>
														<p className="text-sm text-gray-900">
															Name: {selectedPatient.personal_info.name}
														</p>
														<p className="text-sm text-gray-900">
															Age: {selectedPatient.personal_info.age}
														</p>
														<p className="text-sm text-gray-900">
															Gender: {selectedPatient.personal_info.gender}
														</p>
													</div>
													<div>
														<p className="text-sm text-gray-900">
															Phone: {selectedPatient.personal_info.phone}
														</p>
														<p className="text-sm text-gray-900">
															Email: {selectedPatient.personal_info.email}
														</p>
														<p className="text-sm text-gray-900">
															Last Updated:{" "}
															{formatDate(selectedPatient.created_at)}
														</p>
													</div>
												</div>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Medical History
												</h4>
												<div className="mt-2 space-y-4">
													{selectedPatient.conditions?.length > 0 && (
														<div>
															<h5 className="text-xs font-medium text-gray-700 mb-1">
																Conditions:
															</h5>
															<ul className="list-disc list-inside text-sm text-gray-900">
																{selectedPatient.conditions.map(
																	(condition, index) => (
																		<li key={index}>{condition}</li>
																	)
																)}
															</ul>
														</div>
													)}
													{selectedPatient.allergies?.length > 0 && (
														<div>
															<h5 className="text-xs font-medium text-gray-700 mb-1">
																Allergies:
															</h5>
															<ul className="list-disc list-inside text-sm text-gray-900">
																{selectedPatient.allergies.map(
																	(allergy, index) => (
																		<li key={index}>{allergy}</li>
																	)
																)}
															</ul>
														</div>
													)}
													{selectedPatient.symptom_history?.length > 0 && (
														<div>
															<h5 className="text-xs font-medium text-gray-700 mb-1">
																Recent Symptoms:
															</h5>
															<ul className="list-disc list-inside text-sm text-gray-900">
																{selectedPatient.symptom_history
																	.slice(-3)
																	.map((entry, index) => (
																		<li key={index}>
																			{entry.symptoms?.join(", ") ||
																				"No symptoms recorded"}{" "}
																			- {formatDate(entry.recorded_at)}
																		</li>
																	))}
															</ul>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
								<button
									type="button"
									className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
									onClick={() => setShowModal(false)}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PatientRecords;
