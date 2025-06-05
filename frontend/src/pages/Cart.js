import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api from "../utils/api";
import {
	Layout,
	Card,
	Button,
	Typography,
	Row,
	Col,
	Spin,
	message,
	Empty,
	Divider,
} from "antd";

const { Content } = Layout;
const { Title, Text } = Typography;

const Cart = () => {
	const [cartItems, setCartItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		fetchCartItems();
	}, []);

	const fetchCartItems = async () => {
		try {
			const response = await api.get("/api/cart");
			setCartItems(response.data);
			setLoading(false);
		} catch (err) {
			console.error("Error fetching cart items:", err);
			setError("Failed to load cart items. Please try again later.");
			message.error("Failed to load cart items. Please try again later.");
			setLoading(false);
		}
	};

	const handleCheckout = async () => {
		try {
			const response = await api.post("/api/purchase");
			if (response.data.purchase_id) {
				navigate(`/purchase/${response.data.purchase_id}`);
			}
		} catch (err) {
			console.error("Error creating purchase:", err);
			setError("Failed to process checkout. Please try again later.");
			message.error("Failed to process checkout. Please try again later.");
		}
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat("en-KE", {
			style: "currency",
			currency: "KES",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(price);
	};

	const subtotal = cartItems.reduce(
		(total, item) => total + item.price * item.quantity,
		0
	);
	const shipping = 200;
	const total = subtotal + shipping;

	if (loading) {
		return (
			<Layout style={{ minHeight: "100vh" }}>
				<Content style={{ padding: "40px 20px", textAlign: "center" }}>
					<Spin size="large" tip="Loading Cart..." />
				</Content>
			</Layout>
		);
	}

	if (error) {
		return (
			<Layout style={{ minHeight: "100vh" }}>
				<Content style={{ padding: "40px 20px", textAlign: "center" }}>
					<Card title="Error" style={{ width: 300, margin: "0 auto" }}>
						<Title level={4} type="danger">
							{error}
						</Title>
						<Button
							type="primary"
							onClick={fetchCartItems}
							style={{ marginTop: 16 }}
						>
							Try Again
						</Button>
					</Card>
				</Content>
			</Layout>
		);
	}

	return (
		<Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
			<Content
			className="container mx-auto px-4 py-8 max-w-7xl"
			>
				<Row gutter={[32, 32]}>
					<Col span={24} style={{ marginBottom: 24 }}>
						<Link
							to="/"
							style={{
								color: "#1677ff",
								display: "inline-flex",
								alignItems: "center",
								fontSize: 16,
							}}
						>
							<FaArrowLeft style={{ marginRight: 8 }} /> Continue Shopping
						</Link>
					</Col>
					<Col xs={24} lg={16}>
						<Title level={2} style={{ marginBottom: 24 }}>
							Shopping Cart
						</Title>
						{cartItems.length === 0 ? (
							<Card style={{ textAlign: "center", padding: "40px 20px" }}>
								<Empty description="Your cart is empty">
									<Link to="/prescriptions">
										<Button type="primary" size="large">
											View Prescriptions
										</Button>
									</Link>
								</Empty>
							</Card>
						) : (
							<div>
								{cartItems.map((item) => (
									<Card
										key={item.prescription_id}
										style={{ marginBottom: 16 }}
										bodyStyle={{ padding: "24px" }}
									>
										<Row
											justify="space-between"
											align="middle"
											gutter={[16, 16]}
										>
											<Col xs={24} sm={16}>
												<Title level={4} style={{ marginBottom: 4 }}>
													{item.medicine_name}
												</Title>
												<Text type="secondary">{item.generic_name}</Text>
												<div style={{ marginTop: 12 }}>
													<Text>
														<Text strong>Frequency:</Text> {item.frequency}
													</Text>
													<br />
													<Text>
														<Text strong>Prescribed by:</Text> Dr.{" "}
														{item.doctor_name}
													</Text>
													<br />
													<Text>
														<Text strong>Prescribed on:</Text>{" "}
														{new Date(item.prescribed_at).toLocaleDateString()}
													</Text>
												</div>
											</Col>
											<Col xs={24} sm={8} style={{ textAlign: "right" }}>
												<Title level={5} style={{ marginBottom: 4 }}>
													{formatPrice(item.price * item.quantity)}
												</Title>
												<Text type="secondary">
													{formatPrice(item.price)} each × {item.quantity}
												</Text>
											</Col>
										</Row>
									</Card>
								))}
							</div>
						)}
					</Col>
					<Col xs={24} lg={8}>
						<Card
							style={{ position: "sticky", top: 24 }}
							bodyStyle={{ padding: "24px" }}
						>
							<Title level={4} style={{ marginBottom: 24 }}>
								Order Summary
							</Title>
							<Row justify="space-between" style={{ marginBottom: 12 }}>
								<Col>Subtotal</Col>
								<Col>{formatPrice(subtotal)}</Col>
							</Row>
							<Row justify="space-between" style={{ marginBottom: 24 }}>
								<Col>Shipping</Col>
								<Col>{formatPrice(shipping)}</Col>
							</Row>
							<Divider style={{ margin: "0 0 24px 0" }} />
							<Row justify="space-between">
								<Col>
									<Text strong>Total</Text>
								</Col>
								<Col>
									<Text strong>{formatPrice(total)}</Text>
								</Col>
							</Row>
							<Button
								type="primary"
								size="large"
								block
								onClick={handleCheckout}
								style={{ marginTop: 24 }}
							>
								Proceed to Checkout
							</Button>
							<div style={{ marginTop: 16, textAlign: "center" }}>
								<Text type="secondary">
									We accept: M-Pesa • Visa • Mastercard
								</Text>
							</div>
						</Card>
					</Col>
				</Row>
			</Content>
		</Layout>
	);
};

export default Cart;
