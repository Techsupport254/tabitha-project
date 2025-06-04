import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const InventoryManagement = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedItem, setSelectedItem] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [newItem, setNewItem] = useState({
		medication_id: "",
		name: "",
		category: "Uncategorized",
		quantity: 0,
		unit: "tablets",
		expiry_date: "",
		reorder_point: 0,
		supplier: "",
		price: 0,
	});
	const [activeTab, setActiveTab] = useState("all"); // all, low-stock, out-of-stock
	const [inventory, setInventory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [updateError, setUpdateError] = useState(null);
	const [addError, setAddError] = useState(null);
	const [summary, setSummary] = useState({
		totalItems: 0,
		lowStockCount: 0,
		expiringCount: 0,
		lastUpdated: null,
	});

	// Fetch inventory data
	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setLoading(true);
				const response = await api.get("/api/inventory");
				if (response.data) {
					// Set summary data
					setSummary({
						totalItems: response.data.total_items,
						lowStockCount: response.data.low_stock_count,
						expiringCount: response.data.expiring_count,
						lastUpdated: new Date(response.data.last_updated).toLocaleString(),
					});

					// Transform the data to match our display format
					const formattedInventory = response.data.report.map((item) => ({
						id: item["Medication ID"],
						name: item["Name"],
						category: item["Category"] || "Uncategorized",
						quantity: item["Quantity"],
						unit: item["Unit"],
						expiryDate: new Date(item["Expiration Date"]).toLocaleDateString(),
						supplier: item["Supplier"],
						price: item["Price"] || 0,
						status: getStatus(item["Quantity"], item["Reorder Point"]),
						reorderLevel: item["Reorder Point"],
						lastUpdated: new Date(item["Last Updated"]).toLocaleString(),
						isAutoAdded: item["Supplier"] === "System Auto-Add",
					}));
					setInventory(formattedInventory);
				}
			} catch (err) {
				console.error("Error fetching inventory:", err);
				setError("Failed to load inventory data. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchInventory();
		// Set up auto-refresh every 30 seconds
		const refreshInterval = setInterval(fetchInventory, 30000);
		return () => clearInterval(refreshInterval);
	}, []);

	// Helper function to determine status based on quantity and reorder point
	const getStatus = (quantity, reorderPoint) => {
		if (quantity <= 0) return "Out of Stock";
		if (quantity <= reorderPoint) return "Low Stock";
		return "In Stock";
	};

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

	const handleEdit = (item) => {
		setEditingItem({
			...item,
			expiryDate: new Date(item.expiryDate).toISOString().split("T")[0], // Convert to YYYY-MM-DD for input
		});
		setShowEditModal(true);
	};

	const handleUpdateItem = async (e) => {
		e.preventDefault();
		setUpdateError(null);
		try {
			const response = await api.put(`/api/inventory/${editingItem.id}`, {
				quantity: parseInt(editingItem.quantity),
				expiry_date: editingItem.expiryDate,
				reorder_point: parseInt(editingItem.reorderLevel),
				price: parseFloat(editingItem.price),
				category: editingItem.category,
			});

			if (response.data.success) {
				// Update local inventory state
				setInventory(
					inventory.map((item) =>
						item.id === editingItem.id
							? {
									...item,
									quantity: parseInt(editingItem.quantity),
									expiryDate: new Date(
										editingItem.expiryDate
									).toLocaleDateString(),
									reorderLevel: parseInt(editingItem.reorderLevel),
									price: parseFloat(editingItem.price),
									category: editingItem.category,
									status: getStatus(
										parseInt(editingItem.quantity),
										parseInt(editingItem.reorderLevel)
									),
							  }
							: item
					)
				);
				setShowEditModal(false);
				setEditingItem(null);
			}
		} catch (err) {
			console.error("Error updating inventory item:", err);
			setUpdateError("Failed to update item. Please try again.");
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setEditingItem((prev) => ({
			...prev,
			[name]: value,
		}));
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

	const handleAddItem = async (e) => {
		e.preventDefault();
		setAddError(null);
		try {
			const response = await api.post("/api/inventory", newItem);
			if (response.data.message === "Medication added successfully") {
				// Refresh inventory data
				const inventoryResponse = await api.get("/api/inventory");
				if (inventoryResponse.data) {
					const formattedInventory = inventoryResponse.data.report.map(
						(item) => ({
							id: item["Medication ID"],
							name: item["Name"],
							category: item["Category"] || "Uncategorized",
							quantity: item["Quantity"],
							unit: item["Unit"],
							expiryDate: new Date(
								item["Expiration Date"]
							).toLocaleDateString(),
							supplier: item["Supplier"],
							price: item["Price"] || 0,
							status: getStatus(item["Quantity"], item["Reorder Point"]),
							reorderLevel: item["Reorder Point"],
							lastUpdated: new Date(item["Last Updated"]).toLocaleString(),
							isAutoAdded: item["Supplier"] === "System Auto-Add",
						})
					);
					setInventory(formattedInventory);
					setShowAddModal(false);
					setNewItem({
						medication_id: "",
						name: "",
						category: "Uncategorized",
						quantity: 0,
						unit: "tablets",
						expiry_date: "",
						reorder_point: 0,
						supplier: "",
						price: 0,
					});
				}
			}
		} catch (err) {
			console.error("Error adding inventory item:", err);
			setAddError("Failed to add item. Please try again.");
		}
	};

	const handleNewItemChange = (e) => {
		const { name, value } = e.target;
		setNewItem((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="px-4 py-5 sm:p-6">
							<dt className="text-sm font-medium text-gray-500 truncate">
								Total Items
							</dt>
							<dd className="mt-1 text-3xl font-semibold text-gray-900">
								{summary.totalItems}
							</dd>
						</div>
					</div>
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="px-4 py-5 sm:p-6">
							<dt className="text-sm font-medium text-gray-500 truncate">
								Low Stock Items
							</dt>
							<dd className="mt-1 text-3xl font-semibold text-yellow-600">
								{summary.lowStockCount}
							</dd>
						</div>
					</div>
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="px-4 py-5 sm:p-6">
							<dt className="text-sm font-medium text-gray-500 truncate">
								Expiring Soon
							</dt>
							<dd className="mt-1 text-3xl font-semibold text-red-600">
								{summary.expiringCount}
							</dd>
						</div>
					</div>
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="px-4 py-5 sm:p-6">
							<dt className="text-sm font-medium text-gray-500 truncate">
								Last Updated
							</dt>
							<dd className="mt-1 text-sm text-gray-900">
								{summary.lastUpdated}
							</dd>
						</div>
					</div>
				</div>

				<div className="bg-white shadow rounded-lg">
					{/* Header */}
					<div className="px-4 py-5 border-b border-gray-200 sm:px-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Inventory Management
								</h1>
								<p className="mt-1 text-sm text-gray-500">
									Manage your pharmacy inventory, including auto-added
									medications from prescriptions
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(true)}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Add New Item
							</button>
						</div>
					</div>

					{/* Loading and Error States */}
					{loading && (
						<div className="px-4 py-5 sm:px-6">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
								<p className="mt-2 text-sm text-gray-500">
									Loading inventory data...
								</p>
							</div>
						</div>
					)}

					{error && (
						<div className="px-4 py-5 sm:px-6">
							<div className="rounded-md bg-red-50 p-4">
								<div className="flex">
									<div className="flex-shrink-0">
										<svg
											className="h-5 w-5 text-red-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-red-800">
											Error loading inventory
										</h3>
										<div className="mt-2 text-sm text-red-700">
											<p>{error}</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{!loading && !error && (
						<>
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
													<div className="flex items-center">
														<div>
															<div className="text-sm font-medium text-gray-900">
																{item.name}
																{item.isAutoAdded && (
																	<span
																		className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 cursor-help"
																		title="This medication was automatically added based on prescription recommendations"
																	>
																		Auto-Added
																	</span>
																)}
															</div>
															<div className="text-sm text-gray-500">
																ID: {item.id}
															</div>
														</div>
													</div>
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
													<button
														onClick={() => handleEdit(item)}
														className="text-blue-600 hover:text-blue-900"
													>
														Edit
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}
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
											{selectedItem.isAutoAdded && (
												<span
													className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 cursor-help"
													title="This medication was automatically added based on prescription recommendations"
												>
													Auto-Added
												</span>
											)}
										</h3>
										<div className="mt-2 space-y-4">
											<div>
												<h4 className="text-sm font-medium text-gray-500">
													Basic Information
												</h4>
												<div className="mt-1">
													<p className="text-sm text-gray-900">
														Name: {selectedItem.name}
														{selectedItem.supplier === "System Auto-Add" && (
															<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
																Auto-Added
															</span>
														)}
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
													<p className="text-sm text-gray-900">
														Last Updated: {selectedItem.lastUpdated}
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

			{/* Edit Modal */}
			{showEditModal && editingItem && (
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
							<form onSubmit={handleUpdateItem}>
								<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
									<div className="sm:flex sm:items-start">
										<div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
											<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
												Edit Item
												{editingItem.isAutoAdded && (
													<span
														className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 cursor-help"
														title="This medication was automatically added based on prescription recommendations"
													>
														Auto-Added
													</span>
												)}
											</h3>
											{updateError && (
												<div className="mb-4 rounded-md bg-red-50 p-4">
													<div className="flex">
														<div className="ml-3">
															<h3 className="text-sm font-medium text-red-800">
																Error
															</h3>
															<div className="mt-2 text-sm text-red-700">
																<p>{updateError}</p>
															</div>
														</div>
													</div>
												</div>
											)}
											<div className="mt-2 space-y-4">
												<div>
													<label
														htmlFor="name"
														className="block text-sm font-medium text-gray-700"
													>
														Name
													</label>
													<input
														type="text"
														name="name"
														id="name"
														value={editingItem.name}
														disabled
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="category"
														className="block text-sm font-medium text-gray-700"
													>
														Category
													</label>
													<input
														type="text"
														name="category"
														id="category"
														value={editingItem.category}
														onChange={handleInputChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="quantity"
														className="block text-sm font-medium text-gray-700"
													>
														Quantity
													</label>
													<input
														type="number"
														name="quantity"
														id="quantity"
														min="0"
														value={editingItem.quantity}
														onChange={handleInputChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="reorderLevel"
														className="block text-sm font-medium text-gray-700"
													>
														Reorder Level
													</label>
													<input
														type="number"
														name="reorderLevel"
														id="reorderLevel"
														min="0"
														value={editingItem.reorderLevel}
														onChange={handleInputChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="expiryDate"
														className="block text-sm font-medium text-gray-700"
													>
														Expiry Date
													</label>
													<input
														type="date"
														name="expiryDate"
														id="expiryDate"
														value={editingItem.expiryDate}
														onChange={handleInputChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="price"
														className="block text-sm font-medium text-gray-700"
													>
														Price
													</label>
													<input
														type="number"
														name="price"
														id="price"
														min="0"
														step="0.01"
														value={editingItem.price}
														onChange={handleInputChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
									<button
										type="submit"
										className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
									>
										Save Changes
									</button>
									<button
										type="button"
										className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
										onClick={() => {
											setShowEditModal(false);
											setEditingItem(null);
											setUpdateError(null);
										}}
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Add Item Modal */}
			{showAddModal && (
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
							<form onSubmit={handleAddItem}>
								<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
									<div className="sm:flex sm:items-start">
										<div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
											<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
												Add New Inventory Item
											</h3>
											{addError && (
												<div className="mb-4 text-sm text-red-600">
													{addError}
												</div>
											)}
											<div className="mt-2 space-y-4">
												<div>
													<label
														htmlFor="medication_id"
														className="block text-sm font-medium text-gray-700"
													>
														Medication ID
													</label>
													<input
														type="text"
														name="medication_id"
														id="medication_id"
														required
														value={newItem.medication_id}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="name"
														className="block text-sm font-medium text-gray-700"
													>
														Name
													</label>
													<input
														type="text"
														name="name"
														id="name"
														required
														value={newItem.name}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="category"
														className="block text-sm font-medium text-gray-700"
													>
														Category
													</label>
													<input
														type="text"
														name="category"
														id="category"
														value={newItem.category}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label
															htmlFor="quantity"
															className="block text-sm font-medium text-gray-700"
														>
															Quantity
														</label>
														<input
															type="number"
															name="quantity"
															id="quantity"
															required
															min="0"
															value={newItem.quantity}
															onChange={handleNewItemChange}
															className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
														/>
													</div>
													<div>
														<label
															htmlFor="unit"
															className="block text-sm font-medium text-gray-700"
														>
															Unit
														</label>
														<select
															name="unit"
															id="unit"
															required
															value={newItem.unit}
															onChange={handleNewItemChange}
															className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
														>
															<option value="tablets">Tablets</option>
															<option value="capsules">Capsules</option>
															<option value="ml">ML</option>
															<option value="mg">MG</option>
															<option value="units">Units</option>
														</select>
													</div>
												</div>
												<div>
													<label
														htmlFor="expiry_date"
														className="block text-sm font-medium text-gray-700"
													>
														Expiry Date
													</label>
													<input
														type="date"
														name="expiry_date"
														id="expiry_date"
														required
														value={newItem.expiry_date}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="reorder_point"
														className="block text-sm font-medium text-gray-700"
													>
														Reorder Point
													</label>
													<input
														type="number"
														name="reorder_point"
														id="reorder_point"
														required
														min="0"
														value={newItem.reorder_point}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="supplier"
														className="block text-sm font-medium text-gray-700"
													>
														Supplier
													</label>
													<input
														type="text"
														name="supplier"
														id="supplier"
														required
														value={newItem.supplier}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
												<div>
													<label
														htmlFor="price"
														className="block text-sm font-medium text-gray-700"
													>
														Price
													</label>
													<input
														type="number"
														name="price"
														id="price"
														required
														min="0"
														step="0.01"
														value={newItem.price}
														onChange={handleNewItemChange}
														className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
									<button
										type="submit"
										className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
									>
										Add Item
									</button>
									<button
										type="button"
										onClick={() => setShowAddModal(false)}
										className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default InventoryManagement;
