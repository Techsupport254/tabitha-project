import React, { useState, useEffect } from "react";
import {
	Table,
	Button,
	Space,
	Modal,
	Form,
	Input,
	Select,
	DatePicker,
	message,
	Card,
	Typography,
	Tag,
	Popconfirm,
	Tooltip,
} from "antd";
import {
	UserAddOutlined,
	EditOutlined,
	DeleteOutlined,
	LockOutlined,
	UnlockOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import api from "../utils/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [form] = Form.useForm();
	const [searchText, setSearchText] = useState("");

	// Fetch users on component mount
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await api.get("/api/users");
			console.log("API Response:", response);
			console.log("Response data type:", typeof response.data);
			console.log("Response data:", response.data);
			if (!Array.isArray(response.data.users)) {
				console.error(
					"Expected array but got:",
					typeof response.data.users,
					response.data.users
				);
				setError("Invalid data format received from server");
				return;
			}
			setUsers(response.data.users);
			setError(null);
		} catch (err) {
			console.error("Error fetching users:", err);
			setError("Failed to load users. Please try again.");
			message.error("Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	const handleAddUser = () => {
		setEditingUser(null);
		form.resetFields();
		setModalVisible(true);
	};

	const handleEditUser = (user) => {
		setEditingUser(user);
		form.setFieldsValue({
			...user,
			dob: user.dob ? dayjs(user.dob) : null,
		});
		setModalVisible(true);
	};

	const handleDeleteUser = async (userId) => {
		try {
			await api.delete(`/api/users/${userId}`);
			message.success("User deleted successfully");
			fetchUsers();
		} catch (err) {
			console.error("Error deleting user:", err);
			message.error("Failed to delete user");
		}
	};

	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();
			const userData = {
				...values,
				dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
			};

			if (editingUser) {
				await api.put(`/api/users/${editingUser.id}`, userData);
				message.success("User updated successfully");
			} else {
				await api.post("/api/users", userData);
				message.success("User created successfully");
			}

			setModalVisible(false);
			fetchUsers();
		} catch (err) {
			console.error("Error saving user:", err);
			message.error("Failed to save user");
		}
	};

	const getRoleColor = (role) => {
		const colors = {
			admin: "red",
			pharmacist: "blue",
			doctor: "green",
			cashier: "orange",
			technician: "purple",
			patient: "cyan",
		};
		return colors[role] || "default";
	};

	const columns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
			filteredValue: searchText ? [searchText] : null,
			onFilter: (value, record) =>
				record.name.toLowerCase().includes(value.toLowerCase()) ||
				record.email.toLowerCase().includes(value.toLowerCase()),
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
		},
		{
			title: "Role",
			dataIndex: "role",
			key: "role",
			render: (role) => (
				<Tag color={getRoleColor(role)}>
					{role.charAt(0).toUpperCase() + role.slice(1)}
				</Tag>
			),
			filters: [
				{ text: "Admin", value: "admin" },
				{ text: "Pharmacist", value: "pharmacist" },
				{ text: "Doctor", value: "doctor" },
				{ text: "Cashier", value: "cashier" },
				{ text: "Technician", value: "technician" },
				{ text: "Patient", value: "patient" },
			],
			onFilter: (value, record) => record.role === value,
		},
		{
			title: "Status",
			key: "active",
			render: () => <Tag color={"success"}>Active</Tag>,
		},
		{
			title: "Created",
			dataIndex: "created_at",
			key: "created_at",
			render: (date) => new Date(date).toLocaleDateString(),
			sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
		},
		{
			title: "Actions",
			key: "actions",
			render: (_, record) => (
				<Space>
					<Tooltip title="Edit User">
						<Button
							icon={<EditOutlined />}
							onClick={() => handleEditUser(record)}
						/>
					</Tooltip>
					<Popconfirm
						title="Are you sure you want to delete this user?"
						onConfirm={() => handleDeleteUser(record.id)}
						okText="Yes"
						cancelText="No"
					>
						<Tooltip title="Delete User">
							<Button
								danger
								icon={<DeleteOutlined />}
								disabled={record.role === "admin"}
							/>
						</Tooltip>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: "24px" }}>
			<Card>
				<div
					style={{
						marginBottom: "16px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div>
						<Title level={2}>User Management</Title>
						<Text type="secondary">
							Manage system users and their access levels
						</Text>
					</div>
					<Space>
						<Input
							placeholder="Search users..."
							prefix={<SearchOutlined />}
							onChange={(e) => setSearchText(e.target.value)}
							style={{ width: 200 }}
						/>
						<Button
							type="primary"
							icon={<UserAddOutlined />}
							onClick={handleAddUser}
						>
							Add User
						</Button>
					</Space>
				</div>

				<Table
					columns={columns}
					dataSource={users}
					rowKey="id"
					loading={loading}
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Total ${total} users`,
					}}
				/>
			</Card>

			<Modal
				title={editingUser ? "Edit User" : "Add New User"}
				open={modalVisible}
				onOk={handleModalOk}
				onCancel={() => setModalVisible(false)}
				width={600}
			>
				<Form form={form} layout="vertical" initialValues={{ active: true }}>
					<Form.Item
						name="name"
						label="Full Name"
						rules={[{ required: true, message: "Please enter the full name" }]}
					>
						<Input />
					</Form.Item>

					<Form.Item
						name="email"
						label="Email"
						rules={[
							{ required: true, message: "Please enter the email" },
							{ type: "email", message: "Please enter a valid email" },
						]}
					>
						<Input />
					</Form.Item>

					{!editingUser && (
						<Form.Item
							name="password"
							label="Password"
							rules={[
								{ required: true, message: "Please enter the password" },
								{ min: 8, message: "Password must be at least 8 characters" },
							]}
						>
							<Input.Password />
						</Form.Item>
					)}

					<Form.Item
						name="role"
						label="Role"
						rules={[{ required: true, message: "Please select a role" }]}
					>
						<Select>
							<Option value="admin">Administrator</Option>
							<Option value="pharmacist">Pharmacist</Option>
							<Option value="doctor">Doctor</Option>
							<Option value="cashier">Cashier</Option>
							<Option value="technician">Technician</Option>
							<Option value="patient">Patient</Option>
						</Select>
					</Form.Item>

					<Form.Item name="dob" label="Date of Birth">
						<DatePicker style={{ width: "100%" }} />
					</Form.Item>

					<Form.Item name="gender" label="Gender">
						<Select>
							<Option value="male">Male</Option>
							<Option value="female">Female</Option>
							<Option value="other">Other</Option>
						</Select>
					</Form.Item>

					<Form.Item name="active" valuePropName="checked">
						<Select>
							<Option value={true}>Active</Option>
							<Option value={false}>Inactive</Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default UserManagement;
