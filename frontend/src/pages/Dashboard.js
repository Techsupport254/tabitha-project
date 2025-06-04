import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	Row,
	Col,
	Statistic,
	Button,
	Typography,
	Space,
	Spin,
	Alert,
	List,
	Tag,
} from "antd";
import {
	ShoppingOutlined,
	UserOutlined,
	MedicineBoxOutlined,
	FileTextOutlined,
	WarningOutlined,
	ClockCircleOutlined,
	DollarOutlined,
	ArrowRightOutlined,
	TeamOutlined,
	SettingOutlined,
	AuditOutlined,
	SafetyCertificateOutlined,
} from "@ant-design/icons";
import api from "../utils/api";

const { Title, Text } = Typography;

const Dashboard = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userRole, setUserRole] = useState("");
	const [dashboardData, setDashboardData] = useState({
		inventory: {
			totalItems: 0,
			lowStockCount: 0,
			expiringCount: 0,
			totalValue: 0,
		},
		patients: {
			total: 0,
			newThisMonth: 0,
		},
		prescriptions: {
			total: 0,
			pending: 0,
		},
		recentActivity: [],
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

	// Fetch dashboard data
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Only fetch inventory analytics for now since other endpoints are not ready
				const analyticsResponse = await api.get("/api/inventory/analytics");

				setDashboardData({
					inventory: {
						totalItems: analyticsResponse.data.inventory?.totalItems || 0,
						lowStockCount: analyticsResponse.data.inventory?.lowStockCount || 0,
						expiringCount: analyticsResponse.data.inventory?.expiringCount || 0,
						totalValue: analyticsResponse.data.inventory?.totalValue || 0,
					},
					patients: {
						total: 0, // Placeholder until endpoint is ready
						newThisMonth: 0,
					},
					prescriptions: {
						total: 0, // Placeholder until endpoint is ready
						pending: 0,
					},
					recentActivity: [
						...(
							analyticsResponse.data.stockMovements?.recentMovements || []
						).map((movement) => ({
							type: "inventory",
							title: `${
								movement.type === "restock" ? "Restocked" : "Dispensed"
							} ${movement.name}`,
							description: `${movement.quantity} ${movement.unit}`,
							time: new Date(movement.date).toLocaleString(),
							icon: <ShoppingOutlined />,
							color: movement.type === "restock" ? "#52c41a" : "#1890ff",
						})),
					]
						.sort((a, b) => new Date(b.time) - new Date(a.time))
						.slice(0, 5),
				});
			} catch (err) {
				console.error("Error fetching dashboard data:", err);
				if (err.response) {
					if (err.response.status === 401) {
						setError("Please log in to view dashboard");
						navigate("/login");
					} else {
						setError("Some data may not be available at this time");
					}
				} else {
					setError("Network error. Please check your connection");
				}
			} finally {
				setLoading(false);
			}
		};

		if (userRole) {
			fetchDashboardData();
			// Refresh data every 30 seconds
			const refreshInterval = setInterval(fetchDashboardData, 30000);
			return () => clearInterval(refreshInterval);
		}
	}, [userRole, navigate]);

	if (loading) {
		return (
			<div style={{ padding: "50px", textAlign: "center" }}>
				<Spin size="large">
					<div style={{ marginTop: "16px" }}>Loading dashboard...</div>
				</Spin>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error loading dashboard"
					description={error}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	const getQuickAccessItems = () => {
		const baseItems = [
			{
				title: "Inventory Management",
				description:
					"Manage stock levels, view analytics, and handle inventory",
				icon: <ShoppingOutlined style={{ fontSize: "24px" }} />,
				path: "/inventory-management",
				color: "#1890ff",
				show: true,
			},
			{
				title: "Reports & Analytics",
				description: "View detailed reports and system analytics",
				icon: <FileTextOutlined style={{ fontSize: "24px" }} />,
				path: "/reports-analytics",
				color: "#fa8c16",
				show: true,
			},
		];

		const adminItems = [
			{
				title: "User Management",
				description: "Manage system users and their access levels",
				icon: <TeamOutlined style={{ fontSize: "24px" }} />,
				path: "/user-management",
				color: "#722ed1",
				show: userRole === "admin",
			},
			{
				title: "System Settings",
				description: "Configure system parameters and preferences",
				icon: <SettingOutlined style={{ fontSize: "24px" }} />,
				path: "/system-settings",
				color: "#13c2c2",
				show: userRole === "admin",
			},
			{
				title: "Audit Logs",
				description: "View system activity and security logs",
				icon: <AuditOutlined style={{ fontSize: "24px" }} />,
				path: "/audit-logs",
				color: "#eb2f96",
				show: userRole === "admin",
			},
		];

		return [...baseItems, ...adminItems].filter((item) => item.show);
	};

	return (
		<div style={{ padding: "24px" }}>
			<Title level={2}>Dashboard</Title>
			<Text type="secondary">
				{userRole === "admin"
					? "Welcome to the admin dashboard - Manage your pharmacy system"
					: "Welcome to your pharmacy management system"}
			</Text>

			{/* Quick Access Cards */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				{getQuickAccessItems().map((item) => (
					<Col xs={24} sm={12} lg={6} key={item.title}>
						<Card
							hoverable
							onClick={() => navigate(item.path)}
							style={{ height: "100%" }}
						>
							<Space direction="vertical" style={{ width: "100%" }}>
								<div style={{ color: item.color }}>{item.icon}</div>
								<Title level={4} style={{ margin: "8px 0" }}>
									{item.title}
								</Title>
								<Text type="secondary">{item.description}</Text>
								<Button
									type="link"
									icon={<ArrowRightOutlined />}
									style={{ padding: 0, marginTop: "8px" }}
								>
									Access
								</Button>
							</Space>
						</Card>
					</Col>
				))}
			</Row>

			{/* Key Metrics */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Total Inventory Items"
							value={dashboardData.inventory.totalItems}
							prefix={<ShoppingOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Total Inventory Value"
							value={dashboardData.inventory.totalValue}
							precision={2}
							prefix="KSh "
							valueStyle={{ color: "#52c41a" }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Low Stock Items"
							value={dashboardData.inventory.lowStockCount}
							prefix={<WarningOutlined />}
							valueStyle={{ color: "#faad14" }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Expiring Items"
							value={dashboardData.inventory.expiringCount}
							prefix={<ClockCircleOutlined />}
							valueStyle={{ color: "#ff4d4f" }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Admin-specific metrics */}
			{userRole === "admin" && (
				<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
					<Col xs={24} sm={12} lg={8}>
						<Card title="System Status">
							<Space direction="vertical" style={{ width: "100%" }}>
								<Alert
									message="System Health"
									description="All systems operational"
									type="success"
									showIcon
									icon={<SafetyCertificateOutlined />}
								/>
								<Alert
									message="Security Status"
									description="No security alerts"
									type="success"
									showIcon
									icon={<SafetyCertificateOutlined />}
								/>
							</Space>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={8}>
						<Card title="Recent System Activity">
							<List
								dataSource={[
									{
										title: "System Update",
										description: "System updated to version 1.2.3",
										time: "2 hours ago",
									},
									{
										title: "New User Registration",
										description: "New pharmacist account created",
										time: "4 hours ago",
									},
									{
										title: "Security Scan",
										description: "Regular security scan completed",
										time: "6 hours ago",
									},
								]}
								renderItem={(item) => (
									<List.Item>
										<List.Item.Meta
											title={item.title}
											description={
												<Space direction="vertical" size={0}>
													<Text type="secondary">{item.description}</Text>
													<Text type="secondary" style={{ fontSize: "12px" }}>
														{item.time}
													</Text>
												</Space>
											}
										/>
									</List.Item>
								)}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={8}>
						<Card title="Quick Actions">
							<Space direction="vertical" style={{ width: "100%" }}>
								<Button
									type="primary"
									icon={<TeamOutlined />}
									onClick={() => navigate("/user-management")}
									block
								>
									Manage Users
								</Button>
								<Button
									icon={<SettingOutlined />}
									onClick={() => navigate("/system-settings")}
									block
								>
									System Settings
								</Button>
								<Button
									icon={<AuditOutlined />}
									onClick={() => navigate("/audit-logs")}
									block
								>
									View Audit Logs
								</Button>
							</Space>
						</Card>
					</Col>
				</Row>
			)}

			{/* Alerts and Recent Activity */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				{/* Alerts */}
				<Col xs={24} lg={12}>
					<Card title="System Alerts">
						<Space direction="vertical" style={{ width: "100%" }}>
							{dashboardData.inventory.lowStockCount > 0 && (
								<Alert
									message="Low Stock Items"
									description={`${dashboardData.inventory.lowStockCount} items are running low on stock`}
									type="warning"
									showIcon
									icon={<WarningOutlined />}
								/>
							)}
							{dashboardData.inventory.expiringCount > 0 && (
								<Alert
									message="Expiring Items"
									description={`${dashboardData.inventory.expiringCount} items are expiring soon`}
									type="error"
									showIcon
									icon={<ClockCircleOutlined />}
								/>
							)}
							{!dashboardData.inventory.lowStockCount &&
								!dashboardData.inventory.expiringCount && (
									<Alert
										message="All Systems Normal"
										description="No urgent alerts at this time"
										type="success"
										showIcon
									/>
								)}
						</Space>
					</Card>
				</Col>

				{/* Recent Activity */}
				<Col xs={24} lg={12}>
					<Card title="Recent Inventory Activity">
						<List
							dataSource={dashboardData.recentActivity}
							renderItem={(item) => (
								<List.Item>
									<List.Item.Meta
										avatar={
											<div style={{ color: item.color }}>{item.icon}</div>
										}
										title={item.title}
										description={
											<Space direction="vertical" size={0}>
												<Text type="secondary">{item.description}</Text>
												<Text type="secondary" style={{ fontSize: "12px" }}>
													{item.time}
												</Text>
											</Space>
										}
									/>
								</List.Item>
							)}
							locale={{ emptyText: "No recent inventory activity" }}
						/>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default Dashboard;
