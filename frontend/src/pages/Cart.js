import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaMinus, FaPlus, FaArrowLeft } from "react-icons/fa";

const Cart = () => {
	const [cartItems, setCartItems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Simulate loading cart items
		setTimeout(() => {
			setCartItems([
				{
					id: 1,
					name: "Paracetamol 500mg",
					price: 150,
					quantity: 2,
					image: "https://placehold.co/100x100",
					prescription: false,
				},
				{
					id: 2,
					name: "Vitamin C 1000mg",
					price: 350,
					quantity: 1,
					image: "https://placehold.co/100x100",
					prescription: true,
				},
				{
					id: 3,
					name: "Ibuprofen 400mg",
					price: 200,
					quantity: 3,
					image: "https://placehold.co/100x100",
					prescription: false,
				},
			]);
			setLoading(false);
		}, 1000);
	}, []);

	const updateQuantity = (id, change) => {
		setCartItems((prevItems) =>
			prevItems.map((item) =>
				item.id === id
					? {
							...item,
							quantity: Math.max(1, item.quantity + change),
					  }
					: item
			)
		);
	};

	const removeItem = (id) => {
		setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
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
			<div className="container mx-auto px-4 py-8">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-24 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<div className="mb-8">
				<Link
					to="/"
					className="text-blue-600 hover:text-blue-800 flex items-center"
				>
					<FaArrowLeft className="mr-2" />
					Continue Shopping
				</Link>
			</div>

			<h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

			{cartItems.length === 0 ? (
				<div className="text-center py-12">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">
						Your cart is empty
					</h2>
					<p className="text-gray-600 mb-8">
						Looks like you haven't added any items to your cart yet.
					</p>
					<Link
						to="/"
						className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Start Shopping
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Cart Items */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg shadow-sm">
							{cartItems.map((item) => (
								<div
									key={item.id}
									className="p-6 border-b border-gray-200 last:border-b-0"
								>
									<div className="flex items-center">
										<img
											src={item.image}
											alt={item.name}
											className="w-20 h-20 object-cover rounded-lg"
										/>
										<div className="ml-6 flex-1">
											<div className="flex justify-between">
												<div>
													<h3 className="text-lg font-medium text-gray-900">
														{item.name}
													</h3>
													{item.prescription && (
														<span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
															Prescription Required
														</span>
													)}
												</div>
												<button
													onClick={() => removeItem(item.id)}
													className="text-gray-400 hover:text-red-500 transition-colors"
												>
													<FaTrash />
												</button>
											</div>
											<div className="mt-4 flex items-center justify-between">
												<div className="flex items-center">
													<button
														onClick={() => updateQuantity(item.id, -1)}
														className="text-gray-500 hover:text-blue-600 p-1"
													>
														<FaMinus />
													</button>
													<span className="mx-4 text-gray-900">
														{item.quantity}
													</span>
													<button
														onClick={() => updateQuantity(item.id, 1)}
														className="text-gray-500 hover:text-blue-600 p-1"
													>
														<FaPlus />
													</button>
												</div>
												<div className="text-right">
													<p className="text-lg font-medium text-gray-900">
														{formatPrice(item.price * item.quantity)}
													</p>
													<p className="text-sm text-gray-500">
														{formatPrice(item.price)} each
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order Summary */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
							<h2 className="text-xl font-semibold text-gray-900 mb-6">
								Order Summary
							</h2>
							<div className="space-y-4">
								<div className="flex justify-between text-gray-600">
									<span>Subtotal</span>
									<span>{formatPrice(subtotal)}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Shipping</span>
									<span>{formatPrice(shipping)}</span>
								</div>
								<div className="border-t border-gray-200 pt-4">
									<div className="flex justify-between text-lg font-semibold text-gray-900">
										<span>Total</span>
										<span>{formatPrice(total)}</span>
									</div>
								</div>
							</div>
							<button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
								Proceed to Checkout
							</button>
							<div className="mt-4">
								<span className="text-sm text-gray-500">We accept:</span>
								<div className="mt-2 flex justify-center space-x-2">
									<span className="text-gray-400">M-Pesa</span>
									<span className="text-gray-400">•</span>
									<span className="text-gray-400">Visa</span>
									<span className="text-gray-400">•</span>
									<span className="text-gray-400">Mastercard</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Cart;
