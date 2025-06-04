import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Table,
	Tag,
	Button,
	Space,
	Input,
	Modal,
	Form,
	InputNumber,
	Pagination,
	Descriptions,
	Dropdown,
	Menu,
	message,
} from "antd";
import {
	SearchOutlined,
	EyeOutlined,
	EditOutlined,
	CheckOutlined,
	DeleteOutlined,
	MedicineBoxOutlined,
	EllipsisOutlined,
} from "@ant-design/icons";
import api from "../utils/api";
import { format } from "date-fns";

const PrescriptionManagement = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPrescription, setSelectedPrescription] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [prescriptions, setPrescriptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userRole, setUserRole] = useState("");
	const [userId, setUserId] = useState(null);
	const [doctorCache, setDoctorCache] = useState({});

	// State variables for edit modal
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingPrescription, setEditingPrescription] = useState(null);
	const [editedMedications, setEditedMedications] = useState([]);
	const [editedNotes, setEditedNotes] = useState("");

	// Fetch user role and ID on component mount
	useEffect(() => {
		let isMounted = true;
		const fetchUserInfo = async () => {
			try {
				const response = await api.get("/api/user");
				if (isMounted) {
					setUserRole(response.data.role);
					setUserId(response.data.id || response.data.user_id);
				}
			} catch (err) {
				console.error("Error fetching user info:", err);
				if (isMounted) {
					if (err.response && err.response.status === 401) {
						navigate("/login");
					} else {
						setError("Failed to load user information");
					}
				}
			}
		};
		fetchUserInfo();
		return () => {
			isMounted = false;
		};
	}, []); // Remove navigate from dependencies since it's stable

	// Add a helper function for safe date formatting
	const formatDateSafely = (dateString) => {
		try {
			if (!dateString) return "N/A";
			const date = new Date(dateString);
			// Check if date is valid
			if (isNaN(date.getTime())) {
				console.warn("Invalid date:", dateString);
				return "N/A";
			}
			return format(date, "MMM dd, yyyy");
		} catch (error) {
			console.warn("Error formatting date:", dateString, error);
			return "N/A";
		}
	};

	// Add a function to fetch multiple doctors at once
	const fetchDoctors = async (doctorIds) => {
		// Filter out doctors we already have cached
		const uniqueDoctorIds = [...new Set(doctorIds)].filter(
			(id) => id && !doctorCache[id]
		);
		if (uniqueDoctorIds.length === 0) return;

		try {
			// Make a single API call to get all doctors
			const response = await api.post("/api/users/batch", {
				user_ids: uniqueDoctorIds,
			});

			// Update cache with new doctors
			const newDoctors = response.data.reduce((acc, doctor) => {
				if (doctor && doctor.id) {
					acc[doctor.id] = doctor;
				}
				return acc;
			}, {});

			// Update the cache using functional update to ensure we have latest state
			setDoctorCache((prev) => ({ ...prev, ...newDoctors }));
		} catch (error) {
			console.error("Error fetching doctors:", error);
			// Don't throw error, just log it and continue
		}
	};

	const formatPrescriptionsData = async (prescriptions) => {
		try {
			console.log("Starting formatPrescriptionsData with:", prescriptions);

			// Collect all doctor IDs that aren't already in cache
			const doctorIds = prescriptions
				.map((p) => p.prescribed_by)
				.filter((id) => id && !doctorCache[id]); // Only fetch doctors not in cache

			// Only fetch doctors if we have any new ones
			if (doctorIds.length > 0) {
				await fetchDoctors(doctorIds);
			}

			const formattedPrescriptions = prescriptions.map((prescription) => {
				// Get doctor name from cache or API response
				const doctorName =
					prescription.doctor_name ||
					doctorCache[prescription.prescribed_by]?.name ||
					"Unknown Doctor";

				// Get patient name from API response
				const patientName = prescription.patient_name || "Unknown Patient";
				const patientId = prescription.patient_id;

				// Get medication details
				const medicationName =
					prescription.medication_name ||
					prescription.generic_name ||
					"Unknown Medication";

				// Format dates with proper handling
				const startDate = prescription.start_date
					? formatDateSafely(prescription.start_date)
					: "N/A";
				const endDate = prescription.end_date
					? formatDateSafely(prescription.end_date)
					: "N/A";

				// Format dosage and frequency
				const dosage = prescription.dosage || "N/A";
				const frequency = prescription.frequency || "N/A";

				// Create medications array with proper structure
				const medications = [
					{
						name: medicationName,
						dosage: dosage,
						frequency: frequency,
						duration:
							endDate !== "N/A" ? `${startDate} to ${endDate}` : "Ongoing",
						quantity: prescription.quantity || 0,
						genericName: prescription.generic_name || medicationName,
					},
				];

				return {
					id: prescription.id,
					patientId: patientId,
					patientName: patientName,
					doctorName: doctorName,
					doctorId: prescription.prescribed_by,
					medications: medications,
					dosage: dosage,
					frequency: frequency,
					status: prescription.status?.toLowerCase() || "pending",
					prescriptionDate: startDate,
					endDate: endDate,
					notes: prescription.notes || "",
					quantity: prescription.quantity || 0,
					genericName: prescription.generic_name || medicationName,
					dispensed_at: prescription.dispensed_at || null,
				};
			});

			console.log("All formatted prescriptions:", formattedPrescriptions);
			return formattedPrescriptions;
		} catch (error) {
			console.error("Error formatting prescriptions:", error);
			return [];
		}
	};

	// Modify the fetchPrescriptions function to handle caching
	const fetchPrescriptions = async () => {
		console.log("fetchPrescriptions: Starting fetch with role:", userRole);

		// Don't fetch if we don't have a user role yet
		if (!userRole || !userId) {
			console.log(
				"fetchPrescriptions: Waiting for user role and ID to be set..."
			);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			let endpoint = "";
			let response;

			// Add cache-busting parameter
			const timestamp = new Date().getTime();

			if (userRole === "patient") {
				endpoint = `/api/prescriptions/patient/${userId}?_t=${timestamp}`;
				response = await api.get(endpoint);
				console.log("Patient prescriptions:", response.data);
			} else if (userRole === "doctor" || userRole === "pharmacist") {
				endpoint = `/api/prescriptions?_t=${timestamp}`;
				response = await api.get(endpoint);
				console.log("All prescriptions:", response.data);
			}

			// Format the prescriptions data
			if (response.data) {
				const formattedPrescriptions = await formatPrescriptionsData(
					Array.isArray(response.data) ? response.data : [response.data]
				);
				console.log("Formatted prescriptions:", formattedPrescriptions);
				setPrescriptions(formattedPrescriptions);
			}
		} catch (error) {
			console.error("Error fetching prescriptions:", error);
			if (error.response) {
				if (error.response.status === 401) {
					setError("Please log in to view prescriptions");
					navigate("/login");
				} else if (error.response.status === 403) {
					setError("You don't have permission to view these prescriptions");
				} else if (error.response.status === 404) {
					setPrescriptions([]);
					setError(null);
				} else {
					setError(
						error.response.data?.error ||
							"Failed to load prescriptions. Please try again later."
					);
				}
			} else if (error.request) {
				setError("Network error. Please check your connection and try again.");
			} else {
				setError("An unexpected error occurred. Please try again later.");
			}
			setPrescriptions([]);
		} finally {
			setLoading(false);
		}
	};

	// Modify the auto-refresh useEffect
	useEffect(() => {
		if (!userRole || !userId) return;

		// Initial fetch
		fetchPrescriptions();

		// Set up interval for subsequent fetches
		const refreshInterval = setInterval(fetchPrescriptions, 30000);

		return () => clearInterval(refreshInterval);
	}, [userRole, userId]); // Only depend on these values

	// Function to handle editing a prescription (for doctors)
	const handleEditPrescription = (prescription) => {
		console.log("Editing prescription:", prescription);
		setEditingPrescription(prescription);
		// Initialize editable fields state
		// Assuming prescriptions have a medications array, even if it's just one item
		if (prescription.medications && prescription.medications.length > 0) {
			setEditedMedications(prescription.medications.map((med) => ({ ...med }))); // Deep copy
		} else {
			setEditedMedications([]);
		}
		setEditedNotes(prescription.notes || "");
		setShowEditModal(true);
	};

	// Replace the handleApprovePrescription function
	const handleApprovePrescription = async (prescriptionId, modifications) => {
		try {
			setLoading(true); // Set loading state
			message.loading({ content: "Approving prescription...", key: "approve" });

			// First approve the prescription
			await api.post(
				`/api/prescriptions/${prescriptionId}/approve`,
				modifications
			);

			// Close the modal
			setShowModal(false);
			setSelectedPrescription(null);

			// Refresh the prescriptions list immediately
			await fetchPrescriptions();

			message.success({
				content: "Prescription approved successfully",
				key: "approve",
			});
			setError(null);
		} catch (err) {
			console.error("Error approving prescription:", err);
			message.error({
				content:
					err.response?.data?.error ||
					"Failed to approve prescription. Please try again.",
				key: "approve",
			});
			setError("Failed to approve prescription. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Replace the handleSaveEdit function
	const handleSaveEdit = async () => {
		if (!editingPrescription) {
			message.error("No prescription selected for editing");
			return;
		}

		// Validate required fields
		const hasEmptyFields = editedMedications.some(
			(med) =>
				!med.dosage ||
				!med.frequency ||
				!med.duration ||
				med.quantity === undefined
		);

		if (hasEmptyFields) {
			message.error("Please fill in all required fields for medications");
			return;
		}

		try {
			setLoading(true); // Set loading state
			message.loading({ content: "Saving changes...", key: "saveEdit" });

			const response = await api.put(
				`/api/prescriptions/${editingPrescription.id}`,
				{
					medications: editedMedications,
					notes: editedNotes,
					status:
						editingPrescription.status === "pending"
							? "approved"
							: editingPrescription.status,
				}
			);

			// Close modal and reset state
			setShowEditModal(false);
			setEditingPrescription(null);
			setEditedMedications([]);
			setEditedNotes("");

			// Refresh prescriptions list immediately
			await fetchPrescriptions();

			message.success({
				content: "Changes saved successfully",
				key: "saveEdit",
			});
			setError(null);
		} catch (err) {
			console.error("Error saving edited prescription:", err);
			message.error({
				content:
					err.response?.data?.error ||
					"Failed to save prescription changes. Please try again.",
				key: "saveEdit",
			});
			setError("Failed to save prescription changes. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Function to handle canceling edit
	const handleCancelEdit = () => {
		console.log("handleCancelEdit: Canceling edit.");
		setShowEditModal(false);
		setEditingPrescription(null);
		setEditedMedications([]);
		setEditedNotes("");
		setError(null); // Clear errors on cancel
		console.log("handleCancelEdit: Edit canceled.");
	};

	const handleViewDetails = (prescription) => {
		setSelectedPrescription(prescription);
		setShowModal(true);
	};

	const getStatusColor = (status) => {
		switch (status.toLowerCase()) {
			case "approved":
				return "bg-green-100 text-green-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "completed":
				return "bg-blue-100 text-blue-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const filteredPrescriptions = prescriptions.filter((prescription) => {
		const searchLower = searchTerm.toLowerCase();
		return (
			prescription.patientName?.toLowerCase().includes(searchLower) ||
			prescription.medications?.some((med) =>
				med.name.toLowerCase().includes(searchLower)
			)
		);
	});

	// Define columns for antd Table
	const columns = [
		...(userRole !== "patient"
			? [
					{
						title: "Patient",
						dataIndex: "patientName",
						key: "patientName",
						render: (text, record) => (
							<div>
								<div className="font-medium">{text}</div>
								<div className="text-gray-500">ID: {record.patientId}</div>
							</div>
						),
					},
			  ]
			: []),
		{
			title: "Date",
			dataIndex: "prescriptionDate",
			key: "prescriptionDate",
			render: (text, record) => (
				<div>
					<div>Start: {text}</div>
					{record.endDate !== "N/A" && (
						<div className="text-gray-500">End: {record.endDate}</div>
					)}
				</div>
			),
		},
		{
			title: "Medications",
			dataIndex: "medications",
			key: "medications",
			render: (medications, record) => (
				<div>
					{medications.map((med, index) => (
						<div key={index} className="mb-2">
							<div className="font-medium">{med.name}</div>
							{med.genericName && med.genericName !== med.name && (
								<div className="text-gray-500 text-sm">({med.genericName})</div>
							)}
						</div>
					))}
				</div>
			),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (status, record) => (
				<div>
					<Tag
						color={
							status.toLowerCase() === "approved"
								? "success"
								: status.toLowerCase() === "pending"
								? "warning"
								: status.toLowerCase() === "completed"
								? "processing"
								: status.toLowerCase() === "rejected"
								? "error"
								: "default"
						}
					>
						{status}
					</Tag>
					{status.toLowerCase() === "completed" && record.dispensed_at && (
						<div className="text-xs text-gray-500 mt-1">
							Dispensed: {formatDateSafely(record.dispensed_at)}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => {
				const menu = (
					<Menu>
						<Menu.Item key="view" onClick={() => handleViewDetails(record)}>
							<EyeOutlined /> View
						</Menu.Item>
						{userRole === "doctor" && record.status === "pending" && (
							<Menu.Item
								key="edit"
								onClick={() => handleEditPrescription(record)}
							>
								<EditOutlined /> Edit
							</Menu.Item>
						)}
						{userRole === "doctor" && record.status === "pending" && (
							<Menu.Item
								key="approve"
								onClick={() =>
									handleApprovePrescription(record.id, {
										medications: record.medications,
										notes: record.notes,
									})
								}
							>
								<CheckOutlined /> Approve
							</Menu.Item>
						)}
						{userRole === "doctor" && record.status === "pending" && (
							<Menu.Item
								key="delete"
								danger
								onClick={() => {
									if (
										window.confirm(
											"Are you sure you want to delete this prescription?"
										)
									) {
										console.log("Delete prescription:", record.id);
									}
								}}
							>
								<DeleteOutlined /> Delete
							</Menu.Item>
						)}
						{userRole === "pharmacist" && record.status === "approved" && (
							<Menu.Item
								key="dispense"
								onClick={() => handleDispensePrescription(record.id)}
							>
								<MedicineBoxOutlined /> Dispense
							</Menu.Item>
						)}
					</Menu>
				);

				return (
					<Dropdown overlay={menu} trigger={["click"]}>
						<Button
							type="link"
							icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
						/>
					</Dropdown>
				);
			},
		},
	];

	// Function to handle dispensing a prescription (for pharmacists)
	const handleDispensePrescription = async (prescriptionId) => {
		try {
			setLoading(true);
			setError(null); // Clear previous errors
			message.loading({
				content: "Dispensing prescription...",
				key: "dispense",
			});

			await api.patch(`/api/prescriptions/${prescriptionId}`, {
				status: "completed",
				notes: "Dispensed by pharmacist",
			});

			// Refresh the prescriptions list immediately
			await fetchPrescriptions();

			message.success({
				content: "Prescription dispensed successfully",
				key: "dispense",
				duration: 3,
			});
			setError(null);
		} catch (err) {
			console.error("Error dispensing prescription:", err);
			const errorMsg =
				err.response?.data?.error ||
				"Failed to dispense prescription. Please try again.";
			message.error({
				content: errorMsg,
				key: "dispense",
				duration: 5,
			});
			setError(errorMsg);
			// Scroll to top and focus error for accessibility
			setTimeout(() => {
				const errorDiv = document.querySelector(
					".ant-message-error, .ant-message-notice-error, .ant-message-custom-content-error"
				);
				if (errorDiv) {
					errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
					errorDiv.setAttribute("tabindex", "-1");
					errorDiv.focus();
				}
			}, 100);
		} finally {
			setLoading(false);
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
								Prescription Management
							</h1>
						</div>
					</div>

					{/* Search Bar */}
					<div className="px-4 py-5 sm:px-6">
						<div className="max-w-lg">
							<Input
								placeholder="Search by patient name or medication..."
								prefix={<SearchOutlined />}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full"
							/>
						</div>
					</div>

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
							<p className="mt-2 text-sm text-gray-600">
								Loading prescriptions...
							</p>
						</div>
					) : (
						<>
							{/* No Prescriptions Message */}
							{!loading && !error && filteredPrescriptions.length === 0 && (
								<div className="px-4 py-8 text-center text-gray-500">
									No prescriptions found.
								</div>
							)}

							{/* Prescriptions Table */}
							{filteredPrescriptions.length > 0 && (
								<div className="px-4 py-5 sm:px-6">
									<Table
										columns={columns}
										dataSource={filteredPrescriptions.map((prescription) => ({
											...prescription,
											key: prescription.id,
										}))}
										pagination={{
											defaultPageSize: 10,
											showSizeChanger: true,
											showTotal: (total) => `Total ${total} prescriptions`,
										}}
										className="prescription-table"
									/>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Prescription Details Modal */}
			<Modal
				title="Prescription Details"
				open={showModal && selectedPrescription}
				onCancel={() => {
					setShowModal(false);
					setSelectedPrescription(null);
				}}
				width={1200}
				footer={[
					<Button
						key="close"
						onClick={() => {
							setShowModal(false);
							setSelectedPrescription(null);
						}}
					>
						Close
					</Button>,
				]}
			>
				{selectedPrescription && (
					<div className="space-y-6">
						<Descriptions title="Patient Information" bordered>
							<Descriptions.Item label="Name" span={2}>
								{selectedPrescription.patientName}
							</Descriptions.Item>
							<Descriptions.Item label="Patient ID" span={2}>
								{selectedPrescription.patientId}
							</Descriptions.Item>
						</Descriptions>

						<Descriptions title="Prescription Information" bordered>
							<Descriptions.Item label="Start Date" span={2}>
								{selectedPrescription.prescriptionDate}
							</Descriptions.Item>
							<Descriptions.Item label="End Date" span={2}>
								{selectedPrescription.endDate}
							</Descriptions.Item>
							<Descriptions.Item label="Status" span={2}>
								<div>
									<Tag
										color={
											selectedPrescription.status.toLowerCase() === "approved"
												? "success"
												: selectedPrescription.status.toLowerCase() ===
												  "pending"
												? "warning"
												: selectedPrescription.status.toLowerCase() ===
												  "completed"
												? "processing"
												: selectedPrescription.status.toLowerCase() ===
												  "rejected"
												? "error"
												: "default"
										}
									>
										{selectedPrescription.status}
									</Tag>
									{selectedPrescription.status.toLowerCase() === "completed" &&
										selectedPrescription.dispensed_at && (
											<div className="text-sm text-gray-500 mt-1">
												Dispensed on:{" "}
												{formatDateSafely(selectedPrescription.dispensed_at)}
											</div>
										)}
								</div>
							</Descriptions.Item>
						</Descriptions>

						<div>
							<h4 className="text-base font-medium mb-4">Medication Details</h4>
							<div className="space-y-4">
								{selectedPrescription.medications.map((medication, index) => (
									<div
										key={index}
										className="border border-gray-200 rounded-lg p-4"
									>
										<Descriptions bordered>
											<Descriptions.Item label="Medication Name" span={3}>
												<div className="font-medium">
													{medication.name}
													{selectedPrescription.genericName &&
														selectedPrescription.genericName !==
															medication.name && (
															<span className="ml-2 text-gray-500">
																({selectedPrescription.genericName})
															</span>
														)}
												</div>
											</Descriptions.Item>
											<Descriptions.Item label="Dosage" span={3}>
												{medication.dosage}
											</Descriptions.Item>
											<Descriptions.Item label="Frequency" span={3}>
												{medication.frequency}
											</Descriptions.Item>
											<Descriptions.Item label="Duration" span={3}>
												{medication.duration}
											</Descriptions.Item>
											{medication.quantity > 0 && (
												<Descriptions.Item label="Quantity" span={3}>
													{medication.quantity}
												</Descriptions.Item>
											)}
										</Descriptions>
									</div>
								))}
							</div>
						</div>

						{selectedPrescription.notes && (
							<div>
								<h4 className="text-base font-medium mb-2">Additional Notes</h4>
								<div className="bg-gray-50 p-4 rounded-lg">
									<p className="text-gray-700 whitespace-pre-wrap">
										{selectedPrescription.notes}
									</p>
								</div>
							</div>
						)}

						{userRole === "pharmacist" &&
							selectedPrescription.status === "pending" && (
								<div className="mt-6">
									<h4 className="text-base font-medium mb-4">
										Approve Prescription
									</h4>
									<div className="space-y-4">
										{selectedPrescription.medications.map(
											(medication, index) => (
												<div
													key={index}
													className="border border-gray-200 rounded-lg p-4"
												>
													<h5 className="font-medium mb-3">
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
										<Button
											type="primary"
											className="w-full"
											onClick={() => {
												const modifications = {
													medications: selectedPrescription.medications.map(
														(med, index) => ({
															name: med.name,
															dosage:
																document.querySelectorAll('input[type="text"]')[
																	index * 3
																].value,
															frequency:
																document.querySelectorAll('input[type="text"]')[
																	index * 3 + 1
																].value,
															duration:
																document.querySelectorAll('input[type="text"]')[
																	index * 3 + 2
																].value,
															quantity: parseInt(
																document.querySelectorAll(
																	'input[type="number"]'
																)[index].value
															),
														})
													),
												};
												handleApprovePrescription(
													selectedPrescription.id,
													modifications
												);
											}}
										>
											Approve Prescription
										</Button>
									</div>
								</div>
							)}
					</div>
				)}
			</Modal>

			{/* Edit Prescription Modal */}
			<Modal
				title="Edit Prescription"
				open={showEditModal}
				onCancel={handleCancelEdit}
				width={800}
				footer={[
					<Button key="cancel" onClick={handleCancelEdit}>
						Cancel
					</Button>,
					<Button key="save" type="primary" onClick={handleSaveEdit}>
						Save Changes
					</Button>,
				]}
			>
				{editingPrescription && (
					<Form
						layout="vertical"
						initialValues={{
							notes: editedNotes,
							medications: editedMedications,
						}}
					>
						{/* Patient Information Section */}
						<div className="mb-6 p-4 bg-gray-50 rounded-lg">
							<h4 className="text-base font-medium text-gray-900 mb-3">
								Patient Information
							</h4>
							<Descriptions column={2} size="small">
								<Descriptions.Item label="Name">
									{editingPrescription.patientName}
								</Descriptions.Item>
								<Descriptions.Item label="Patient ID">
									{editingPrescription.patientId}
								</Descriptions.Item>
								{editingPrescription.doctorName && (
									<Descriptions.Item label="Prescribed By">
										{editingPrescription.doctorName}
									</Descriptions.Item>
								)}
								<Descriptions.Item label="Status">
									<Tag
										color={
											editingPrescription.status.toLowerCase() === "approved"
												? "success"
												: editingPrescription.status.toLowerCase() === "pending"
												? "warning"
												: editingPrescription.status.toLowerCase() ===
												  "rejected"
												? "error"
												: "default"
										}
									>
										{editingPrescription.status}
									</Tag>
								</Descriptions.Item>
							</Descriptions>
						</div>

						{/* Medications Section */}
						<div className="mb-6">
							<h4 className="text-base font-medium text-gray-900 mb-3">
								Medication Details
							</h4>
							{editedMedications.map((med, index) => (
								<div
									key={index}
									className="mb-4 p-4 border border-gray-200 rounded-lg"
								>
									<h5 className="font-medium text-gray-900 mb-3">
										{med.name}
										{med.genericName && med.genericName !== med.name && (
											<span className="ml-2 text-gray-500">
												({med.genericName})
											</span>
										)}
									</h5>
									<div className="grid grid-cols-2 gap-4">
										<Form.Item
											label="Dosage"
											name={["medications", index, "dosage"]}
											initialValue={med.dosage}
											rules={[
												{ required: true, message: "Please enter dosage" },
											]}
										>
											<Input
												onChange={(e) => {
													const newMeds = [...editedMedications];
													newMeds[index].dosage = e.target.value;
													setEditedMedications(newMeds);
												}}
											/>
										</Form.Item>
										<Form.Item
											label="Frequency"
											name={["medications", index, "frequency"]}
											initialValue={med.frequency}
											rules={[
												{ required: true, message: "Please enter frequency" },
											]}
										>
											<Input
												onChange={(e) => {
													const newMeds = [...editedMedications];
													newMeds[index].frequency = e.target.value;
													setEditedMedications(newMeds);
												}}
											/>
										</Form.Item>
										<Form.Item
											label="Duration"
											name={["medications", index, "duration"]}
											initialValue={med.duration}
											rules={[
												{ required: true, message: "Please enter duration" },
											]}
										>
											<Input
												onChange={(e) => {
													const newMeds = [...editedMedications];
													newMeds[index].duration = e.target.value;
													setEditedMedications(newMeds);
												}}
											/>
										</Form.Item>
										<Form.Item
											label="Quantity"
											name={["medications", index, "quantity"]}
											initialValue={med.quantity}
											rules={[
												{ required: true, message: "Please enter quantity" },
											]}
										>
											<InputNumber
												min={0}
												className="w-full"
												onChange={(value) => {
													const newMeds = [...editedMedications];
													newMeds[index].quantity = value || 0;
													setEditedMedications(newMeds);
												}}
											/>
										</Form.Item>
									</div>
								</div>
							))}
						</div>

						{/* Notes Section */}
						<Form.Item
							label="Additional Notes"
							name="notes"
							initialValue={editedNotes}
						>
							<Input.TextArea
								rows={4}
								onChange={(e) => setEditedNotes(e.target.value)}
								placeholder="Enter any additional notes or instructions..."
							/>
						</Form.Item>
					</Form>
				)}
			</Modal>
		</div>
	);
};

export default PrescriptionManagement;
