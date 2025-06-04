import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
	// Mock data for demonstration
	const stats = {
		totalPatients: 150,
		activePrescriptions: 45,
		lowStockItems: 8,
		todayAppointments: 12,
	};

	const recentPatients = [
		{ id: 1, name: "John Doe", lastVisit: "2024-03-15", status: "Active" },
		{ id: 2, name: "Jane Smith", lastVisit: "2024-03-14", status: "Active" },
		{
			id: 3,
			name: "Mike Johnson",
			lastVisit: "2024-03-13",
			status: "Inactive",
		},
	];

	const lowStockItems = [
		{ id: 1, name: "Paracetamol 500mg", quantity: 5, threshold: 20 },
		{ id: 2, name: "Amoxicillin 250mg", quantity: 8, threshold: 25 },
		{ id: 3, name: "Ibuprofen 400mg", quantity: 3, threshold: 15 },
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Section */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				{/* Stats Grid */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{/* Total Patients */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-6 w-6 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											Total Patients
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.totalPatients}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* Active Prescriptions */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-6 w-6 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											Active Prescriptions
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.activePrescriptions}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* Low Stock Items */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-6 w-6 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
										/>
									</svg>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											Low Stock Items
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.lowStockItems}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					{/* Today's Appointments */}
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg
										className="h-6 w-6 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">
											Today's Appointments
										</dt>
										<dd className="text-lg font-medium text-gray-900">
											{stats.todayAppointments}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mt-8">
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Quick Actions
					</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Link
							to="/symptom-ai"
							className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<svg
											className="h-6 w-6 text-blue-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
											/>
										</svg>
									</div>
									<div className="ml-4">
										<h3 className="text-lg font-medium text-gray-900">
											Symptom AI
										</h3>
										<p className="text-sm text-gray-500">
											AI-powered symptom analysis
										</p>
									</div>
								</div>
							</div>
						</Link>

						<Link
							to="/patient-records"
							className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<svg
											className="h-6 w-6 text-green-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
									</div>
									<div className="ml-4">
										<h3 className="text-lg font-medium text-gray-900">
											Patient Records
										</h3>
										<p className="text-sm text-gray-500">
											Manage patient information
										</p>
									</div>
								</div>
							</div>
						</Link>

						<Link
							to="/prescription-management"
							className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<svg
											className="h-6 w-6 text-purple-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
									<div className="ml-4">
										<h3 className="text-lg font-medium text-gray-900">
											Prescriptions
										</h3>
										<p className="text-sm text-gray-500">
											Manage prescriptions
										</p>
									</div>
								</div>
							</div>
						</Link>

						<Link
							to="/inventory-management"
							className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<svg
											className="h-6 w-6 text-yellow-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
											/>
										</svg>
									</div>
									<div className="ml-4">
										<h3 className="text-lg font-medium text-gray-900">
											Inventory
										</h3>
										<p className="text-sm text-gray-500">Manage stock levels</p>
									</div>
								</div>
							</div>
						</Link>
					</div>
				</div>

				{/* Recent Activity and Low Stock Alerts */}
				<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Recent Patients */}
					<div className="bg-white shadow rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg font-medium text-gray-900">
								Recent Patients
							</h3>
						</div>
						<div className="border-t border-gray-200">
							<ul className="divide-y divide-gray-200">
								{recentPatients.map((patient) => (
									<li key={patient.id} className="px-4 py-4 sm:px-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center">
												<div className="flex-shrink-0">
													<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
														<span className="text-gray-500 font-medium">
															{patient.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</span>
													</div>
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{patient.name}
													</div>
													<div className="text-sm text-gray-500">
														Last Visit: {patient.lastVisit}
													</div>
												</div>
											</div>
											<div className="ml-2 flex-shrink-0">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
														patient.status === "Active"
															? "bg-green-100 text-green-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{patient.status}
												</span>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Low Stock Alerts */}
					<div className="bg-white shadow rounded-lg">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg font-medium text-gray-900">
								Low Stock Alerts
							</h3>
						</div>
						<div className="border-t border-gray-200">
							<ul className="divide-y divide-gray-200">
								{lowStockItems.map((item) => (
									<li key={item.id} className="px-4 py-4 sm:px-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center">
												<div className="flex-shrink-0">
													<svg
														className="h-6 w-6 text-red-600"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
														/>
													</svg>
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{item.name}
													</div>
													<div className="text-sm text-gray-500">
														Current Stock: {item.quantity} (Threshold:{" "}
														{item.threshold})
													</div>
												</div>
											</div>
											<div className="ml-2 flex-shrink-0">
												<button className="text-sm font-medium text-blue-600 hover:text-blue-500">
													Reorder
												</button>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
