import React, { useState } from "react";

const ReportsAnalytics = () => {
	const [activeTab, setActiveTab] = useState("overview"); // overview, sales, inventory, prescriptions

	// Mock data - replace with actual API data
	const analyticsData = {
		overview: {
			totalSales: 12500,
			totalPrescriptions: 450,
			totalPatients: 280,
			averageOrderValue: 27.78,
			topSellingCategories: [
				{ name: "Antibiotics", sales: 3200, percentage: 25.6 },
				{ name: "Pain Relief", sales: 2800, percentage: 22.4 },
				{ name: "Vitamins", sales: 2100, percentage: 16.8 },
				{ name: "Diabetes", sales: 1800, percentage: 14.4 },
				{ name: "Others", sales: 2600, percentage: 20.8 },
			],
			recentActivity: [
				{
					type: "Sale",
					description: "New sale recorded",
					amount: 45.5,
					time: "2 mins ago",
				},
				{
					type: "Prescription",
					description: "New prescription added",
					patient: "John Doe",
					time: "15 mins ago",
				},
				{
					type: "Inventory",
					description: "Low stock alert",
					item: "Amoxicillin 500mg",
					time: "1 hour ago",
				},
				{
					type: "Sale",
					description: "New sale recorded",
					amount: 32.75,
					time: "2 hours ago",
				},
			],
		},
		sales: {
			dailySales: [
				{ date: "2024-03-10", amount: 850 },
				{ date: "2024-03-11", amount: 920 },
				{ date: "2024-03-12", amount: 780 },
				{ date: "2024-03-13", amount: 950 },
				{ date: "2024-03-14", amount: 890 },
				{ date: "2024-03-15", amount: 1020 },
				{ date: "2024-03-16", amount: 880 },
			],
			topProducts: [
				{ name: "Paracetamol 500mg", units: 250, revenue: 1250 },
				{ name: "Amoxicillin 500mg", units: 180, revenue: 900 },
				{ name: "Omeprazole 20mg", units: 150, revenue: 1125 },
				{ name: "Metformin 500mg", units: 120, revenue: 960 },
			],
		},
		inventory: {
			stockLevels: [
				{ category: "Antibiotics", current: 450, reorder: 200 },
				{ category: "Pain Relief", current: 380, reorder: 150 },
				{ category: "Vitamins", current: 520, reorder: 200 },
				{ category: "Diabetes", current: 280, reorder: 100 },
			],
			expiringSoon: [
				{ name: "Amoxicillin 500mg", quantity: 50, expiryDate: "2024-04-15" },
				{ name: "Paracetamol 500mg", quantity: 75, expiryDate: "2024-04-20" },
				{ name: "Omeprazole 20mg", quantity: 30, expiryDate: "2024-04-25" },
			],
		},
		prescriptions: {
			monthlyTrends: [
				{ month: "Jan", count: 85 },
				{ month: "Feb", count: 92 },
				{ month: "Mar", count: 78 },
				{ month: "Apr", count: 95 },
				{ month: "May", count: 88 },
				{ month: "Jun", count: 102 },
			],
			commonMedications: [
				{ name: "Amoxicillin", prescriptions: 45 },
				{ name: "Paracetamol", prescriptions: 38 },
				{ name: "Omeprazole", prescriptions: 32 },
				{ name: "Metformin", prescriptions: 28 },
			],
		},
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	const renderOverview = () => (
		<div className="space-y-6">
			{/* Key Metrics */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<dt className="text-sm font-medium text-gray-500 truncate">
							Total Sales
						</dt>
						<dd className="mt-1 text-3xl font-semibold text-gray-900">
							{formatCurrency(analyticsData.overview.totalSales)}
						</dd>
					</div>
				</div>
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<dt className="text-sm font-medium text-gray-500 truncate">
							Total Prescriptions
						</dt>
						<dd className="mt-1 text-3xl font-semibold text-gray-900">
							{analyticsData.overview.totalPrescriptions}
						</dd>
					</div>
				</div>
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<dt className="text-sm font-medium text-gray-500 truncate">
							Total Patients
						</dt>
						<dd className="mt-1 text-3xl font-semibold text-gray-900">
							{analyticsData.overview.totalPatients}
						</dd>
					</div>
				</div>
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<dt className="text-sm font-medium text-gray-500 truncate">
							Average Order Value
						</dt>
						<dd className="mt-1 text-3xl font-semibold text-gray-900">
							{formatCurrency(analyticsData.overview.averageOrderValue)}
						</dd>
					</div>
				</div>
			</div>

			{/* Top Selling Categories */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Top Selling Categories
					</h3>
					<div className="mt-5">
						<div className="space-y-4">
							{analyticsData.overview.topSellingCategories.map((category) => (
								<div key={category.name} className="relative">
									<div className="flex items-center justify-between">
										<div className="text-sm font-medium text-gray-900">
											{category.name}
										</div>
										<div className="text-sm text-gray-500">
											{formatCurrency(category.sales)}
										</div>
									</div>
									<div className="mt-2">
										<div className="relative pt-1">
											<div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
												<div
													style={{ width: `${category.percentage}%` }}
													className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
												></div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Recent Activity */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Recent Activity
					</h3>
					<div className="mt-5">
						<div className="flow-root">
							<ul className="-mb-8">
								{analyticsData.overview.recentActivity.map(
									(activity, index) => (
										<li key={index}>
											<div className="relative pb-8">
												{index !==
													analyticsData.overview.recentActivity.length - 1 && (
													<span
														className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
														aria-hidden="true"
													></span>
												)}
												<div className="relative flex space-x-3">
													<div>
														<span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
															<svg
																className="h-5 w-5 text-white"
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
																	clipRule="evenodd"
																/>
															</svg>
														</span>
													</div>
													<div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
														<div>
															<p className="text-sm text-gray-500">
																{activity.description}
																{activity.amount &&
																	` - ${formatCurrency(activity.amount)}`}
																{activity.patient && ` for ${activity.patient}`}
																{activity.item && ` - ${activity.item}`}
															</p>
														</div>
														<div className="text-right text-sm whitespace-nowrap text-gray-500">
															<time dateTime={activity.time}>
																{activity.time}
															</time>
														</div>
													</div>
												</div>
											</div>
										</li>
									)
								)}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderSales = () => (
		<div className="space-y-6">
			{/* Daily Sales Chart */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Daily Sales
					</h3>
					<div className="mt-5">
						<div className="h-64 flex items-end space-x-2">
							{analyticsData.sales.dailySales.map((day) => (
								<div key={day.date} className="flex-1">
									<div
										className="bg-blue-500 rounded-t"
										style={{
											height: `${(day.amount / 1200) * 100}%`,
										}}
									></div>
									<div className="text-xs text-center text-gray-500 mt-2">
										{new Date(day.date).toLocaleDateString("en-US", {
											weekday: "short",
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Top Products */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Top Products
					</h3>
					<div className="mt-5">
						<div className="flex flex-col">
							<div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
								<div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
									<div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Product
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Units Sold
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Revenue
													</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{analyticsData.sales.topProducts.map((product) => (
													<tr key={product.name}>
														<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
															{product.name}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{product.units}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{formatCurrency(product.revenue)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderInventory = () => (
		<div className="space-y-6">
			{/* Stock Levels */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Stock Levels by Category
					</h3>
					<div className="mt-5">
						<div className="space-y-4">
							{analyticsData.inventory.stockLevels.map((category) => (
								<div key={category.category}>
									<div className="flex items-center justify-between">
										<div className="text-sm font-medium text-gray-900">
											{category.category}
										</div>
										<div className="text-sm text-gray-500">
											{category.current} / {category.reorder} units
										</div>
									</div>
									<div className="mt-2">
										<div className="relative pt-1">
											<div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
												<div
													style={{
														width: `${
															(category.current / (category.reorder * 2)) * 100
														}%`,
													}}
													className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
												></div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Expiring Soon */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Items Expiring Soon
					</h3>
					<div className="mt-5">
						<div className="flex flex-col">
							<div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
								<div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
									<div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
														Quantity
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Expiry Date
													</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{analyticsData.inventory.expiringSoon.map((item) => (
													<tr key={item.name}>
														<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
															{item.name}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{item.quantity}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
															{item.expiryDate}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderPrescriptions = () => (
		<div className="space-y-6">
			{/* Monthly Trends */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Monthly Prescription Trends
					</h3>
					<div className="mt-5">
						<div className="h-64 flex items-end space-x-2">
							{analyticsData.prescriptions.monthlyTrends.map((month) => (
								<div key={month.month} className="flex-1">
									<div
										className="bg-green-500 rounded-t"
										style={{
											height: `${(month.count / 120) * 100}%`,
										}}
									></div>
									<div className="text-xs text-center text-gray-500 mt-2">
										{month.month}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Common Medications */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						Common Medications
					</h3>
					<div className="mt-5">
						<div className="space-y-4">
							{analyticsData.prescriptions.commonMedications.map(
								(medication) => (
									<div key={medication.name} className="relative">
										<div className="flex items-center justify-between">
											<div className="text-sm font-medium text-gray-900">
												{medication.name}
											</div>
											<div className="text-sm text-gray-500">
												{medication.prescriptions} prescriptions
											</div>
										</div>
										<div className="mt-2">
											<div className="relative pt-1">
												<div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
													<div
														style={{
															width: `${
																(medication.prescriptions / 50) * 100
															}%`,
														}}
														className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
													></div>
												</div>
											</div>
										</div>
									</div>
								)
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white shadow rounded-lg">
					{/* Header */}
					<div className="px-4 py-5 border-b border-gray-200 sm:px-6">
						<h1 className="text-2xl font-bold text-gray-900">
							Reports & Analytics
						</h1>
					</div>

					{/* Tabs */}
					<div className="border-b border-gray-200">
						<nav
							className="-mb-px flex space-x-8 px-4 sm:px-6"
							aria-label="Tabs"
						>
							{["overview", "sales", "inventory", "prescriptions"].map(
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
										{tab.replace("-", " ")}
									</button>
								)
							)}
						</nav>
					</div>

					{/* Content */}
					<div className="px-4 py-5 sm:p-6">
						{activeTab === "overview" && renderOverview()}
						{activeTab === "sales" && renderSales()}
						{activeTab === "inventory" && renderInventory()}
						{activeTab === "prescriptions" && renderPrescriptions()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ReportsAnalytics;
