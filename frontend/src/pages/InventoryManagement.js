import React, { useState } from "react";
import { Link } from "react-router-dom";

const InventoryManagement = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedItem, setSelectedItem] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [activeTab, setActiveTab] = useState("all"); // all, low-stock, out-of-stock

	// Mock data - replace with actual API data
	const inventory = [
		{
			id: 1,
			name: "Amoxicillin 500mg",
			category: "Antibiotics",
			quantity: 150,
			unit: "tablets",
			expiryDate: "2024-12-31",
			supplier: "MediCorp Ltd",
			price: 2.5,
			status: "In Stock",
			reorderLevel: 50,
		},
		{
			id: 2,
			name: "Paracetamol 500mg",
			category: "Pain Relief",
			quantity: 25,
			unit: "tablets",
			expiryDate: "2024-10-15",
			supplier: "PharmaPlus Inc",
			price: 1.2,
			status: "Low Stock",
			reorderLevel: 30,
		},
		{
			id: 3,
			name: "Omeprazole 20mg",
			category: "Gastrointestinal",
			quantity: 0,
			unit: "capsules",
			expiryDate: "2024-09-30",
			supplier: "MediCorp Ltd",
			price: 3.75,
			status: "Out of Stock",
			reorderLevel: 40,
		},
		{
			id: 4,
			name: "Metformin 500mg",
			category: "Diabetes",
			quantity: 200,
			unit: "tablets",
			expiryDate: "2025-03-15",
			supplier: "PharmaPlus Inc",
			price: 2.8,
			status: "In Stock",
			reorderLevel: 60,
		},
	];

	const filteredInventory = inventory.filter(
		(item) =>
			(item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) &&
			(activeTab === "all" ||
				(activeTab === "low-stock" && item.status === "Low Stock") ||
				(activeTab === "out-of-stock" && item.status === "Out of Stock"))
	);

	const handleViewDetails = (item) => {
		setSelectedItem(item);
		setShowModal(true);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "In Stock":
				return "bg-green-100 text-green-800";
			case "Low Stock":
				return "bg-yellow-100 text-yellow-800";
			case "Out of Stock":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
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
								Inventory Management
							</h1>
							<Link
								to="/add-inventory"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Add New Item
							</Link>
						</div>
					</div>

					{/* Tabs */}
					<div className="border-b border-gray-200">
						<nav
							className="-mb-px flex space-x-8 px-4 sm:px-6"
							aria-label="Tabs"
						>
							{["all", "low-stock", "out-of-stock"].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`${
										activeTab === tab
											? "border-blue-500 text-blue-600"
											: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
								>
									{tab.replace("-", " ")}
								</button>
							))}
						</nav>
					</div>

					{/* Search Bar */}
					<div className="px-4 py-5 sm:px-6">
						<div className="max-w-lg">
							<label htmlFor="search" className="sr-only">
								Search inventory
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
									placeholder="Search by name, category, or supplier..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Inventory Table */}
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Item
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Category
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Quantity
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Expiry Date
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
								{filteredInventory.map((item) => (
									<tr key={item.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{item.name}
											</div>
											<div className="text-sm text-gray-500">ID: {item.id}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{item.category}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{item.quantity} {item.unit}
											</div>
											<div className="text-sm text-gray-500">
												Reorder Level: {item.reorderLevel}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{item.expiryDate}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
													item.status
												)}`}
											>
												{item.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<button
												onClick={() => handleViewDetails(item)}
												className="text-blue-600 hover:text-blue-900 mr-4"
											>
												View
											</button>
											<button className="text-blue-600 hover:text-blue-900">
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Item Details Modal */}
			{showModal && selectedItem && (
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
											Item Details
										</h3>
										<div className="mt-2 space-y-4">
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Basic Information
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Name: {selectedItem.name}
													</p>
													<p className="text-sm text-gray-900">
														Category: {selectedItem.category}
													</p>
													<p className="text-sm text-gray-900">
														ID: {selectedItem.id}
													</p>
												</div>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Stock Information
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Quantity: {selectedItem.quantity}{" "}
														{selectedItem.unit}
													</p>
													<p className="text-sm text-gray-900">
														Reorder Level: {selectedItem.reorderLevel}
													</p>
													<p className="text-sm text-gray-900">
														Status: {selectedItem.status}
													</p>
												</div>
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Additional Details
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Expiry Date: {selectedItem.expiryDate}
													</p>
													<p className="text-sm text-gray-900">
														Supplier: {selectedItem.supplier}
													</p>
													<p className="text-sm text-gray-900">
														Price: ${selectedItem.price.toFixed(2)}
													</p>
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

export default InventoryManagement;
