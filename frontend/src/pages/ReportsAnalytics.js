import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	Row,
	Col,
	Statistic,
	Table,
	Progress,
	Spin,
	Alert,
	Tag,
	Typography,
	Space,
	Input,
} from "antd";
import {
	ShoppingOutlined,
	WarningOutlined,
	ClockCircleOutlined,
	DollarOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import api from "../utils/api";

const { Title, Text } = Typography;
const { Search } = Input;

const ReportsAnalytics = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userRole, setUserRole] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [analytics, setAnalytics] = useState({
		inventory: {
			totalItems: 0,
			lowStockCount: 0,
			expiringCount: 0,
			totalValue: 0,
			categories: [],
		},
		stockMovements: {
			recentMovements: [],
			lowStockAlerts: [],
		},
		expiryAnalysis: {
			expiringSoon: [],
		},
		valueAnalysis: {
			topItems: [],
		},
	});

	// Fetch user role on component mount
	useEffect(() => {
		const fetchUserInfo = async () => {
			try {
				const response = await api.get("/api/user");
				setUserRole(response.data.role);
			} catch (err) {
				console.error("Error fetching user info:", err);
				if (err.response && err.response.status === 401) {
					navigate("/login");
				}
			}
		};
		fetchUserInfo();
	}, [navigate]);

	// Fetch analytics data
	useEffect(() => {
		const fetchAnalytics = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await api.get("/api/inventory/analytics");
				console.log("Analytics data received:", response.data);

				if (response.data) {
					// Transform the data to match our display format
					const formattedData = {
						inventory: {
							totalItems: response.data.inventory?.totalItems || 0,
							lowStockCount: response.data.inventory?.lowStockCount || 0,
							expiringCount: response.data.inventory?.expiringCount || 0,
							totalValue: response.data.inventory?.totalValue || 0,
							categories: (response.data.inventory?.categories || []).map(
								(cat) => ({
									name: cat.name || "Other",
									count: cat.count || 0,
									value: cat.value || 0,
								})
							),
						},
						stockMovements: {
							recentMovements: (
								response.data.stockMovements?.recentMovements || []
							).map((movement) => ({
								id: movement.id,
								name: movement.name,
								type: movement.type,
								quantity: movement.quantity,
								unit: movement.unit || "units",
								date: movement.date,
							})),
							lowStockAlerts: (
								response.data.stockMovements?.lowStockAlerts || []
							).map((alert) => ({
								id: alert.id,
								name: alert.name,
								quantity: alert.quantity,
								unit: alert.unit || "units",
								reorderPoint: alert.reorderPoint || 20,
							})),
						},
						expiryAnalysis: {
							expiringSoon: (
								response.data.expiryAnalysis?.expiringSoon || []
							).map((item) => ({
								id: item.id,
								name: item.name,
								expiryDate: item.expiryDate,
								daysUntilExpiry: item.daysUntilExpiry,
							})),
						},
						valueAnalysis: {
							topItems: (response.data.valueAnalysis?.topItems || []).map(
								(item) => ({
									id: item.id,
									name: item.name,
									quantity: item.quantity,
									unit: item.unit || "units",
									totalValue: item.totalValue || 0,
									lastRestocked: item.lastRestocked,
								})
							),
						},
					};
					console.log("Formatted analytics data:", formattedData);
					setAnalytics(formattedData);
				}
			} catch (err) {
				console.error("Error fetching analytics:", err);
				if (err.response) {
					if (err.response.status === 401) {
						setError("Please log in to view analytics");
						navigate("/login");
					} else if (err.response.status === 403) {
						setError(
							"You don't have permission to view analytics. Please contact your administrator."
						);
					} else {
						setError(
							err.response.data?.error ||
								"Failed to load analytics data. Please try again later."
						);
					}
				} else if (err.request) {
					setError(
						"Network error. Please check your connection and try again."
					);
				} else {
					setError("An unexpected error occurred. Please try again later.");
				}
			} finally {
				setLoading(false);
			}
		};

		// Only fetch analytics if user has appropriate role
		if (userRole && ["admin", "pharmacist", "doctor"].includes(userRole)) {
			fetchAnalytics();
			// Set up auto-refresh every 30 seconds
			const refreshInterval = setInterval(fetchAnalytics, 30000);
			return () => clearInterval(refreshInterval);
		} else if (userRole) {
			setError(
				"You don't have permission to view analytics. Please contact your administrator."
			);
			setLoading(false);
		}
	}, [userRole, navigate]);

	// Filter data based on search term
	const filteredData = {
		...analytics,
		stockMovements: {
			...analytics.stockMovements,
			lowStockAlerts: analytics.stockMovements.lowStockAlerts.filter((item) =>
				item.name.toLowerCase().includes(searchTerm.toLowerCase())
			),
			recentMovements: analytics.stockMovements.recentMovements.filter((item) =>
				item.name.toLowerCase().includes(searchTerm.toLowerCase())
			),
		},
		expiryAnalysis: {
			...analytics.expiryAnalysis,
			expiringSoon: analytics.expiryAnalysis.expiringSoon.filter((item) =>
				item.name.toLowerCase().includes(searchTerm.toLowerCase())
			),
		},
		valueAnalysis: {
			...analytics.valueAnalysis,
			topItems: analytics.valueAnalysis.topItems.filter((item) =>
				item.name.toLowerCase().includes(searchTerm.toLowerCase())
			),
		},
	};

	if (loading) {
		return (
			<div style={{ padding: "50px", textAlign: "center" }}>
				<Spin size="large">
					<div style={{ marginTop: "16px" }}>Loading analytics data...</div>
				</Spin>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error loading analytics"
					description={error}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	// Table columns definitions
	const lowStockColumns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Current Stock",
			dataIndex: "quantity",
			key: "quantity",
			render: (text, record) => `${text} ${record.unit}`,
			sorter: (a, b) => a.quantity - b.quantity,
		},
		{
			title: "Reorder Level",
			dataIndex: "reorderPoint",
			key: "reorderPoint",
			render: (text) => (
				<Tag color="warning" icon={<WarningOutlined />}>
					{text}
				</Tag>
			),
			sorter: (a, b) => a.reorderPoint - b.reorderPoint,
		},
	];

	const expiringColumns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Expiry Date",
			dataIndex: "expiryDate",
			key: "expiryDate",
			render: (text) => (text ? new Date(text).toLocaleDateString() : "N/A"),
			sorter: (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
		},
		{
			title: "Status",
			dataIndex: "daysUntilExpiry",
			key: "daysUntilExpiry",
			render: (text) =>
				text ? (
					<Tag
						color={text <= 7 ? "error" : "warning"}
						icon={<ClockCircleOutlined />}
					>
						{text} days left
					</Tag>
				) : (
					"N/A"
				),
			sorter: (a, b) => a.daysUntilExpiry - b.daysUntilExpiry,
		},
	];

	const movementsColumns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Type",
			dataIndex: "type",
			key: "type",
			render: (text) =>
				text ? (
					<Tag color={text === "restock" ? "success" : "processing"}>
						{text === "restock" ? "Restocked" : "Dispensed"}
					</Tag>
				) : (
					"N/A"
				),
			filters: [
				{ text: "Restocked", value: "restock" },
				{ text: "Dispensed", value: "dispense" },
			],
			onFilter: (value, record) => record.type === value,
		},
		{
			title: "Quantity",
			dataIndex: "quantity",
			key: "quantity",
			render: (text, record) => (text ? `${text} ${record.unit}` : "N/A"),
			sorter: (a, b) => a.quantity - b.quantity,
		},
		{
			title: "Date",
			dataIndex: "date",
			key: "date",
			render: (text) => (text ? new Date(text).toLocaleDateString() : "N/A"),
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
		},
	];

	const topItemsColumns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Stock",
			dataIndex: "quantity",
			key: "quantity",
			render: (text, record) => `${text} ${record.unit}`,
			sorter: (a, b) => a.quantity - b.quantity,
		},
		{
			title: "Value",
			dataIndex: "totalValue",
			key: "totalValue",
			render: (text) => (
				<Tag color="success" icon={<DollarOutlined />}>
					KSh {Number(text || 0).toFixed(2)}
				</Tag>
			),
			sorter: (a, b) => a.totalValue - b.totalValue,
		},
	];

	return (
		<div style={{ padding: "24px" }}>
			<Title level={2}>Reports & Analytics</Title>
			<Text type="secondary">
				Comprehensive insights into your pharmacy's inventory and operations
			</Text>

			{/* Search Bar */}
			<div style={{ marginTop: "24px", marginBottom: "24px" }}>
				<Search
					placeholder="Search by medication name..."
					allowClear
					enterButton={<SearchOutlined />}
					size="large"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					style={{ maxWidth: "500px" }}
				/>
			</div>

			{/* Summary Statistics */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Total Inventory Items"
							value={analytics.inventory?.totalItems || 0}
							prefix={<ShoppingOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Low Stock Items"
							value={analytics.inventory?.lowStockCount || 0}
							valueStyle={{ color: "#faad14" }}
							prefix={<WarningOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Expiring Soon"
							value={analytics.inventory?.expiringCount || 0}
							valueStyle={{ color: "#ff4d4f" }}
							prefix={<ClockCircleOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Total Inventory Value"
							value={analytics.inventory?.totalValue || 0}
							precision={2}
							prefix="KSh "
							valueStyle={{ color: "#52c41a" }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Main Content Grid */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				{/* Low Stock Alerts */}
				<Col xs={24} lg={12}>
					<Card
						title="Low Stock Alerts"
						extra={
							<Tag color="warning">
								{filteredData.stockMovements.lowStockAlerts.length} items
							</Tag>
						}
					>
						<Table
							dataSource={filteredData.stockMovements.lowStockAlerts}
							columns={lowStockColumns}
							rowKey="id"
							pagination={{ pageSize: 5 }}
							size="small"
							locale={{ emptyText: "No low stock alerts" }}
						/>
					</Card>
				</Col>

				{/* Expiring Items */}
				<Col xs={24} lg={12}>
					<Card
						title="Expiring Soon"
						extra={
							<Tag color="error">
								{filteredData.expiryAnalysis.expiringSoon.length} items
							</Tag>
						}
					>
						<Table
							dataSource={filteredData.expiryAnalysis.expiringSoon}
							columns={expiringColumns}
							rowKey="id"
							pagination={{ pageSize: 5 }}
							size="small"
							locale={{ emptyText: "No expiring items" }}
						/>
					</Card>
				</Col>

				{/* Recent Stock Movements */}
				<Col xs={24} lg={12}>
					<Card
						title="Recent Stock Movements"
						extra={
							<Tag color="processing">
								{filteredData.stockMovements.recentMovements.length} movements
							</Tag>
						}
					>
						<Table
							dataSource={filteredData.stockMovements.recentMovements}
							columns={movementsColumns}
							rowKey="id"
							pagination={{ pageSize: 5 }}
							size="small"
							locale={{ emptyText: "No recent movements" }}
						/>
					</Card>
				</Col>

				{/* Top Items by Value */}
				<Col xs={24} lg={12}>
					<Card
						title="Top Items by Value"
						extra={
							<Tag color="success">
								{filteredData.valueAnalysis.topItems.length} items
							</Tag>
						}
					>
						<Table
							dataSource={filteredData.valueAnalysis.topItems}
							columns={topItemsColumns}
							rowKey="id"
							pagination={{ pageSize: 5 }}
							size="small"
							locale={{ emptyText: "No items found" }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Category Analysis */}
			<Card
				title="Inventory by Category"
				style={{ marginTop: "24px" }}
				extra={
					<Tag color="blue">
						{analytics.inventory?.categories.length || 0} categories
					</Tag>
				}
			>
				<Row gutter={[16, 16]}>
					{(analytics.inventory?.categories || []).map((category) => (
						<Col xs={24} sm={12} lg={8} key={category.name}>
							<Card size="small">
								<Space direction="vertical" style={{ width: "100%" }}>
									<Text strong>{category.name}</Text>
									<Text type="secondary">
										Items: {category.count} | Value: KSh{" "}
										{Number(category.value || 0).toFixed(2)}
									</Text>
									<Progress
										percent={Math.round(
											((category.count || 0) /
												(analytics.inventory?.totalItems || 1)) *
												100
										)}
										size="small"
										status="active"
									/>
								</Space>
							</Card>
						</Col>
					))}
				</Row>
			</Card>
		</div>
	);
};

export default ReportsAnalytics;
