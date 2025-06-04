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
	const [selectedPrescriptionDetails, setSelectedPrescriptionDetails] =
		useState(null);
	const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

	// Fetch user role and ID on component mount
	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				console.log("Fetching user info...");
				const response = await api.get("/api/user");
				console.log("User info response:", response.data);

				// The user ID should be in response.data.id or response.data.user_id
				const userId = response.data.id || response.data.user_id;
				console.log("Extracted userId:", userId);

				setUserRole(response.data.role);
				setUserId(userId);

				// Log the state after setting
				console.log("Updated user state:", {
					role: response.data.role,
					userId: userId,
					fullResponse: response.data,
				});
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
				console.log("Starting fetchPatients with:", { userRole, userId });
				let response;

				if (userRole === "patient" && userId) {
					console.log("Fetching patient records for user:", {
						userRole,
						userId,
					});
					// If user is a patient, fetch their medical history
					response = await api.get(`/api/medical-history/${userId}`);
					console.log("Raw API response for patient:", {
						status: response.status,
						data: response.data,
						hasPrescriptions: !!response.data?.prescriptions,
						prescriptionsLength: response.data?.prescriptions?.length,
						fullResponse: response,
					});

					if (!response.data) {
						console.error("No data received from medical history API");
						setError("No medical records found");
						return;
					}

					const patientData = response.data;
					console.log("Raw medical history data:", {
						medicalHistory: patientData.medical_history,
						prescriptions: patientData.prescriptions,
						fullData: patientData,
					});

					// Parse symptoms from string if needed
					const parsedSymptomHistory =
						patientData.symptom_history?.map((entry) => {
							console.log("Processing symptom entry:", entry);
							const parsed = {
								...entry,
								symptoms:
									typeof entry.symptoms === "string"
										? JSON.parse(entry.symptoms)
										: entry.symptoms,
							};
							console.log("Parsed symptom entry:", parsed);
							return parsed;
						}) || [];

					// Format the patient data to match the expected structure
					const formattedPatient = {
						patient_id: `${patientData.patient_id}-0`,
						original_id: patientData.patient_id,
						personal_info: {
							name:
								patientData.personal_info?.name ||
								patientData.name ||
								"No Name",
							email:
								patientData.personal_info?.email ||
								patientData.email ||
								"No Email",
							gender:
								patientData.personal_info?.gender ||
								patientData.gender ||
								"N/A",
							phone:
								patientData.personal_info?.phone || patientData.phone || "N/A",
							dob: patientData.personal_info?.dob || patientData.dob || "N/A",
						},
						medical_history: {
							conditions: patientData.conditions || [],
							allergies: patientData.allergies || [],
							symptom_history: parsedSymptomHistory,
							prescriptions:
								patientData.prescriptions ||
								patientData.medical_history?.prescriptions ||
								[],
						},
						created_at: patientData.last_updated || new Date().toISOString(),
					};

					console.log("Formatted patient data:", {
						...formattedPatient,
						medical_history: {
							...formattedPatient.medical_history,
							prescriptions: formattedPatient.medical_history.prescriptions,
						},
					});
					setPatients([formattedPatient]);
					setTotalPages(1);
					setSelectedPatient(formattedPatient);
					setShowModal(true);
				} else if (userRole === "doctor" || userRole === "pharmacist") {
					// If user is a doctor or pharmacist, fetch all patients with pagination
					response = await api.get("/api/patients", {
						params: {
							page: currentPage,
							search: searchTerm,
						},
					});

					const formattedPatients = await Promise.all(
						response.data.patients.map(async (patient, index) => {
							// Fetch detailed medical history for each patient
							try {
								const historyResponse = await api.get(
									`/api/medical-history/${patient.id}`
								);
								const historyData = historyResponse.data;

								return {
									patient_id: `${patient.id}-${index}`,
									original_id: patient.id,
									personal_info: {
										name: patient.name || "No Name",
										email: patient.email || "No Email",
										age: patient.age || "N/A",
										gender: patient.gender || "N/A",
										phone: patient.phone || "N/A",
										dob: patient.dob || "N/A",
									},
									medical_history: {
										conditions: historyData.conditions || [],
										allergies: historyData.allergies || [],
										symptom_history: historyData.symptom_history || [],
										prescriptions: historyData.prescriptions || [],
									},
									created_at:
										historyData.last_updated ||
										patient.lastVisit ||
										new Date().toISOString(),
								};
							} catch (error) {
								console.error(
									`Error fetching history for patient ${patient.id}:`,
									error
								);
								return {
									patient_id: `${patient.id}-${index}`,
									original_id: patient.id,
									personal_info: {
										name: patient.name || "No Name",
										email: patient.email || "No Email",
										age: patient.age || "N/A",
										gender: patient.gender || "N/A",
										phone: patient.phone || "N/A",
										dob: patient.dob || "N/A",
									},
									medical_history: {
										conditions: [],
										allergies: [],
										symptom_history: [],
										prescriptions: [],
									},
									created_at: patient.lastVisit || new Date().toISOString(),
								};
							}
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

	// Add useEffect to log state changes
	useEffect(() => {
		console.log("Current state:", {
			userRole,
			userId,
			patients,
			selectedPatient,
			showModal,
			loading,
			error,
		});

		// Add specific logging for prescriptions
		if (selectedPatient) {
			console.log("Selected patient data:", {
				patientId: selectedPatient.original_id,
				hasMedicalHistory: !!selectedPatient.medical_history,
				medicalHistoryKeys: selectedPatient.medical_history
					? Object.keys(selectedPatient.medical_history)
					: [],
				hasPrescriptions: !!selectedPatient.medical_history?.prescriptions,
				prescriptionsLength:
					selectedPatient.medical_history?.prescriptions?.length,
				prescriptions: selectedPatient.medical_history?.prescriptions,
				fullMedicalHistory: selectedPatient.medical_history,
			});
		}
	}, [userRole, userId, patients, selectedPatient, showModal, loading, error]);

	// Add console log for render conditions
	console.log("Render conditions:", {
		userRole,
		loading,
		error,
		hasPatients: patients.length > 0,
		hasSelectedPatient: !!selectedPatient,
		showModal,
		selectedPatientPrescriptions:
			selectedPatient?.medical_history?.prescriptions,
	});

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

	const calculateAge = (dob) => {
		try {
			const birthDate = new Date(dob);
			// Check if the date is valid
			if (isNaN(birthDate.getTime())) {
				console.error("Invalid date provided to calculateAge:", dob);
				return "N/A";
			}
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();

			if (
				monthDiff < 0 ||
				(monthDiff === 0 && today.getDate() < birthDate.getDate())
			) {
				age--;
			}
			return age >= 0 ? age : "N/A"; // Return 'N/A' for invalid or future dates
		} catch (error) {
			console.error("Error calculating age:", error);
			return "N/A";
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			{/* Add debug info in development */}
			{/* Removed debug panel */}
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
									{userRole === "patient" &&
										patients.length === 0 &&
										!selectedPatient && (
											<div className="px-4 py-8 text-center text-gray-500">
												No medical records found for your account.
											</div>
										)}
								</>
							)}

							{/* Patient Records Display for Patient Role */}
							{userRole === "patient" && selectedPatient && (
								<div className="px-4 py-5 sm:px-6">
									<div className="bg-white shadow overflow-hidden sm:rounded-lg">
										<div className="px-4 py-5 sm:px-6">
											<h3 className="text-lg leading-6 font-medium text-gray-900">
												Medical Records
											</h3>
											<p className="mt-1 max-w-2xl text-sm text-gray-500">
												Last updated: {formatDate(selectedPatient.created_at)}
											</p>
										</div>
										<div className="border-t border-gray-200">
											<dl>
												{/* Personal Information */}
												<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
													<dt className="text-sm font-medium text-gray-500">
														Personal Information
													</dt>
													<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p>
																	<span className="font-medium">Name:</span>{" "}
																	{selectedPatient.personal_info.name}
																</p>
																<p>
																	<span className="font-medium">Age:</span>{" "}
																	{(() => {
																		console.log(
																			"Calculating age for patient view with dob:",
																			selectedPatient.personal_info.dob
																		);
																		const calculatedAge = calculateAge(
																			selectedPatient.personal_info.dob
																		);
																		console.log(
																			"Calculated age:",
																			calculatedAge
																		);
																		return calculatedAge !== "N/A"
																			? `${calculatedAge} years`
																			: "N/A";
																	})()}
																</p>
																<p>
																	<span className="font-medium">Gender:</span>{" "}
																	{selectedPatient.personal_info.gender}
																</p>
															</div>
															<div>
																<p>
																	<span className="font-medium">Email:</span>{" "}
																	{selectedPatient.personal_info.email}
																</p>
																<p>
																	<span className="font-medium">Phone:</span>{" "}
																	{selectedPatient.personal_info.phone}
																</p>
															</div>
														</div>
													</dd>
												</div>

												{/* Medical Conditions */}
												<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
													<dt className="text-sm font-medium text-gray-500">
														Medical Conditions
													</dt>
													<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
														{selectedPatient.medical_history?.conditions
															?.length > 0 ? (
															<ul className="list-disc list-inside">
																{selectedPatient.medical_history.conditions.map(
																	(condition, index) => (
																		<li key={index}>{condition}</li>
																	)
																)}
															</ul>
														) : (
															<p className="text-gray-500">
																No medical conditions recorded
															</p>
														)}
													</dd>
												</div>

												{/* Allergies */}
												<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
													<dt className="text-sm font-medium text-gray-500">
														Allergies
													</dt>
													<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
														{selectedPatient.medical_history?.allergies
															?.length > 0 ? (
															<ul className="list-disc list-inside">
																{selectedPatient.medical_history.allergies.map(
																	(allergy, index) => (
																		<li key={index}>{allergy}</li>
																	)
																)}
															</ul>
														) : (
															<p className="text-gray-500">
																No allergies recorded
															</p>
														)}
													</dd>
												</div>

												{/* Symptom History */}
												<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
													<dt className="text-sm font-medium text-gray-500">
														Recent Symptoms
													</dt>
													<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
														{selectedPatient.medical_history?.symptom_history
															?.length > 0 ? (
															<div className="space-y-4">
																{selectedPatient.medical_history.symptom_history
																	.slice()
																	.reverse()
																	.map((entry, index) => (
																		<div
																			key={index}
																			className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
																		>
																			<div className="font-medium">
																				{Array.isArray(entry.symptoms)
																					? entry.symptoms.join(", ")
																					: entry.symptoms ||
																					  "No symptoms recorded"}
																			</div>
																			<div className="text-gray-600 mt-1">
																				<p>
																					Severity:{" "}
																					{entry.severity || "Not specified"}
																				</p>
																				{entry.notes && (
																					<p className="mt-1">
																						Notes: {entry.notes}
																					</p>
																				)}
																				<p className="mt-1 text-sm">
																					Recorded:{" "}
																					{formatDate(entry.recorded_at)}
																				</p>
																			</div>
																		</div>
																	))}
															</div>
														) : (
															<p className="text-gray-500">
																No symptom history recorded
															</p>
														)}
													</dd>
												</div>

												{/* Prescriptions */}
												<div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
													<dt className="text-sm font-medium text-gray-500">
														Prescriptions
													</dt>
													<dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
														{selectedPatient?.medical_history?.prescriptions
															?.length > 0 ? (
															<div className="space-y-3">
																{selectedPatient.medical_history.prescriptions.map(
																	(prescription, index) => (
																		<div
																			key={index}
																			className="bg-white p-3 rounded-md shadow-sm mb-3 border border-gray-200 last:mb-0 cursor-pointer hover:bg-gray-100"
																			onClick={() => {
																				setSelectedPrescriptionDetails(
																					prescription
																				);
																				setShowPrescriptionModal(true);
																			}}
																		>
																			<div className="flex items-center justify-between">
																				<div className="font-medium text-gray-900">
																					{prescription.medication_name}
																				</div>
																				<span
																					className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
																						prescription.status === "approved"
																							? "bg-green-100 text-green-800"
																							: prescription.status ===
																							  "pending"
																							? "bg-yellow-100 text-yellow-800"
																							: "bg-gray-100 text-gray-800"
																					}`}
																				>
																					{prescription.status}
																				</span>
																			</div>
																		</div>
																	)
																)}
															</div>
														) : (
															<p className="text-gray-500">No prescriptions</p>
														)}
													</dd>
												</div>
											</dl>
										</div>
									</div>
								</div>
							)}

							{/* Patient Table for Doctor Role */}
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
															{calculateAge(patient.personal_info.dob) !== "N/A"
																? `${calculateAge(
																		patient.personal_info.dob
																  )} years`
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
															{patient.medical_history?.conditions?.length >
															0 ? (
																patient.medical_history.conditions.map(
																	(condition, index) => (
																		<span
																			key={index}
																			className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
																		>
																			{condition}
																		</span>
																	)
																)
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

			{/* Prescription Details Modal */}
			{showPrescriptionModal && selectedPrescriptionDetails && (
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
											Prescription Details
										</h3>
										<div className="mt-2 space-y-4">
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Medication Information
												</h4>
												<div className="mt-2 space-y-2">
													<p className="text-sm text-gray-900">
														<span className="font-medium">Medication:</span>{" "}
														{selectedPrescriptionDetails.medication_name}
													</p>
													<p className="text-sm text-gray-900">
														<span className="font-medium">Dosage:</span>{" "}
														{selectedPrescriptionDetails.dosage}
													</p>
													<p className="text-sm text-gray-900">
														<span className="font-medium">Instructions:</span>{" "}
														{selectedPrescriptionDetails.instructions &&
														selectedPrescriptionDetails.instructions.length >
															300
															? selectedPrescriptionDetails.instructions.substring(
																	0,
																	300
															  ) + "..."
															: selectedPrescriptionDetails.instructions}
													</p>
													<p className="text-sm text-gray-900">
														<span className="font-medium">Status:</span>{" "}
														<span
															className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
																selectedPrescriptionDetails.status ===
																"approved"
																	? "bg-green-100 text-green-800"
																	: selectedPrescriptionDetails.status ===
																	  "pending"
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-gray-100 text-gray-800"
															}`}
														>
															{selectedPrescriptionDetails.status}
														</span>
													</p>
													{selectedPrescriptionDetails.prescribed_by && (
														<p className="text-sm text-gray-900">
															<span className="font-medium">
																Prescribed by:
															</span>{" "}
															{selectedPrescriptionDetails.prescribed_by}
														</p>
													)}
													{selectedPrescriptionDetails.prescribed_date && (
														<p className="text-sm text-gray-900">
															<span className="font-medium">
																Prescribed on:
															</span>{" "}
															{formatDate(
																selectedPrescriptionDetails.prescribed_date
															)}
														</p>
													)}
													{selectedPrescriptionDetails.expiry_date && (
														<p className="text-sm text-gray-900">
															<span className="font-medium">Expires on:</span>{" "}
															{formatDate(
																selectedPrescriptionDetails.expiry_date
															)}
														</p>
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
									onClick={() => {
										setShowPrescriptionModal(false);
										setSelectedPrescriptionDetails(null);
									}}
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
