import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const PrescriptionManagement = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPrescription, setSelectedPrescription] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [activeTab, setActiveTab] = useState("active"); // active, pending, completed
	const [prescriptions, setPrescriptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isDoctor, setIsDoctor] = useState(false);

	useEffect(() => {
		// Check if user is a doctor
		const checkUserRole = async () => {
			try {
				const response = await api.get("/user/role");
				setIsDoctor(response.data.role === "doctor");
			} catch (err) {
				console.error("Error checking user role:", err);
			}
		};
		checkUserRole();
	}, []);

	useEffect(() => {
		const fetchPrescriptions = async () => {
			try {
				setLoading(true);
				let endpoint = "/prescriptions";
				if (isDoctor && activeTab === "pending") {
					endpoint = "/prescriptions/pending";
				} else if (activeTab === "approved") {
					endpoint = "/prescriptions/approved";
				}
				const response = await api.get(endpoint);
				setPrescriptions(response.data);
				setError(null);
			} catch (err) {
				setError("Failed to fetch prescriptions");
				console.error("Error fetching prescriptions:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchPrescriptions();
	}, [activeTab, isDoctor]);

	const handleApprovePrescription = async (prescriptionId, modifications) => {
		try {
			await api.post(`/prescriptions/${prescriptionId}/approve`, modifications);
			// Refresh prescriptions after approval
			const response = await api.get("/prescriptions/pending");
			setPrescriptions(response.data);
			setShowModal(false);
		} catch (err) {
			setError("Failed to approve prescription");
			console.error("Error approving prescription:", err);
		}
	};

	const handleViewDetails = (prescription) => {
		setSelectedPrescription(prescription);
		setShowModal(true);
	};

	const getStatusColor = (status) => {
		switch (status.toLowerCase()) {
			case "active":
			case "approved":
				return "bg-green-100 text-green-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "completed":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const filteredPrescriptions = prescriptions.filter(
		(prescription) =>
			(prescription.patientName
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
				prescription.patientId
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				prescription.doctorName
					?.toLowerCase()
					.includes(searchTerm.toLowerCase())) &&
			(activeTab === "all" || prescription.status.toLowerCase() === activeTab)
	);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white shadow rounded-lg">
					{/* Header */}
					<div className="px-4 py-5 border-b border-gray-200 sm:px-6">
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold text-gray-900">
								Prescription Management
							</h1>
							<Link
								to="/create-prescription"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Create New Prescription
							</Link>
						</div>
					</div>

					{/* Tabs */}
					<div className="border-b border-gray-200">
						<nav
							className="-mb-px flex space-x-8 px-4 sm:px-6"
							aria-label="Tabs"
						>
							{["active", "pending", "approved", "completed", "all"].map(
								(tab) => (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`${
											activeTab === tab
												? "border-blue-500 text-blue-600"
												: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
										} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
									>
										{tab}
									</button>
								)
							)}
						</nav>
					</div>

					{/* Search Bar */}
					<div className="px-4 py-5 sm:px-6">
						<div className="max-w-lg">
							<label htmlFor="search" className="sr-only">
								Search prescriptions
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
									placeholder="Search by patient name, ID, or doctor..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="px-4 py-3 bg-red-100 text-red-700">{error}</div>
					)}

					{/* Loading State */}
					{loading ? (
						<div className="px-4 py-5 text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
							<p className="mt-2 text-gray-600">Loading prescriptions...</p>
						</div>
					) : (
						/* Prescriptions Table */
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Patient
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Doctor
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Date
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Medications
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Status
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
									{filteredPrescriptions.map((prescription) => (
										<tr key={prescription.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{prescription.patientName}
												</div>
												<div className="text-sm text-gray-500">
													ID: {prescription.patientId}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{prescription.doctorName}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{prescription.date}
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-900">
													{prescription.medications
														.map((med) => med.name)
														.join(", ")}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
														prescription.status
													)}`}
												>
													{prescription.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<button
													onClick={() => handleViewDetails(prescription)}
													className="text-blue-600 hover:text-blue-900 mr-4"
												>
													View
												</button>
												{isDoctor && prescription.status === "pending" && (
													<button
														onClick={() => handleViewDetails(prescription)}
														className="text-green-600 hover:text-green-900"
													>
														Approve
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Prescription Details Modal */}
			{showModal && selectedPrescription && (
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
													Patient Information
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Name: {selectedPrescription.patientName}
													</p>
													<p className="text-sm text-gray-900">
														ID: {selectedPrescription.patientId}
													</p>
												</div>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Prescription Information
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Doctor: {selectedPrescription.doctorName}
													</p>
													<p className="text-sm text-gray-900">
														Date: {selectedPrescription.date}
													</p>
													<p className="text-sm text-gray-900">
														Status: {selectedPrescription.status}
													</p>
												</div>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Medications
												</h4>
												<ul className="mt-1 space-y-2">
													{selectedPrescription.medications.map(
														(medication, index) => (
															<li key={index} className="text-sm text-gray-900">
																<strong>{medication.name}</strong>
																<br />
																Dosage: {medication.dosage}
																<br />
																Frequency: {medication.frequency}
																<br />
																Duration: {medication.duration}
															</li>
														)
													)}
												</ul>
											</div>
											{selectedPrescription.notes && (
												<div>
													<h4 className="text-sm font-medium text-gray-500">
														Notes
													</h4>
													<p className="mt-1 text-sm text-gray-900">
														{selectedPrescription.notes}
													</p>
												</div>
											)}
											{isDoctor &&
												selectedPrescription.status === "pending" && (
													<div className="mt-4">
														<h4 className="text-sm font-medium text-gray-500 mb-2">
															Approve Prescription
														</h4>
														<div className="space-y-4">
															{selectedPrescription.medications.map(
																(medication, index) => (
																	<div
																		key={index}
																		className="border p-4 rounded"
																	>
																		<h5 className="font-medium mb-2">
																			{medication.name}
																		</h5>
																		<div className="grid grid-cols-2 gap-4">
																			<div>
																				<label className="block text-sm text-gray-700">
																					Dosage
																				</label>
																				<input
																					type="text"
																					defaultValue={medication.dosage}
																					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
																				/>
																			</div>
																			<div>
																				<label className="block text-sm text-gray-700">
																					Frequency
																				</label>
																				<input
																					type="text"
																					defaultValue={medication.frequency}
																					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
																				/>
																			</div>
																			<div>
																				<label className="block text-sm text-gray-700">
																					Duration
																				</label>
																				<input
																					type="text"
																					defaultValue={medication.duration}
																					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
																				/>
																			</div>
																			<div>
																				<label className="block text-sm text-gray-700">
																					Quantity
																				</label>
																				<input
																					type="number"
																					defaultValue={medication.quantity}
																					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
																				/>
																			</div>
																		</div>
																	</div>
																)
															)}
															<button
																onClick={() => {
																	const modifications = {
																		dosage:
																			document.querySelector(
																				'input[type="text"]'
																			).value,
																		frequency:
																			document.querySelectorAll(
																				'input[type="text"]'
																			)[1].value,
																		duration:
																			document.querySelectorAll(
																				'input[type="text"]'
																			)[2].value,
																		quantity: parseInt(
																			document.querySelector(
																				'input[type="number"]'
																			).value
																		),
																	};
																	handleApprovePrescription(
																		selectedPrescription.id,
																		modifications
																	);
																}}
																className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
															>
																Approve Prescription
															</button>
														</div>
													</div>
												)}
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

export default PrescriptionManagement;
