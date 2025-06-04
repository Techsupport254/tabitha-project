import React, { useState } from "react";
import {
	FaPhone,
	FaEnvelope,
	FaMapMarkerAlt,
	FaClock,
	FaFacebook,
	FaTwitter,
	FaInstagram,
	FaLinkedin,
} from "react-icons/fa";

const Contact = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitStatus(null);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setSubmitStatus("success");
			setFormData({
				name: "",
				email: "",
				subject: "",
				message: "",
			});
		} catch (error) {
			setSubmitStatus("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Hero Section */}
			<div className="bg-blue-600 text-white py-16">
				<div className="container mx-auto px-4">
					<h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
						Contact Us
					</h1>
					<p className="text-xl text-center text-blue-100 max-w-2xl mx-auto">
						We're here to help! Get in touch with our team for any questions or
						concerns.
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					{/* Contact Information */}
					<div className="space-y-8">
						<div className="bg-white rounded-lg shadow-sm p-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">
								Get in Touch
							</h2>
							<div className="space-y-6">
								<div className="flex items-start space-x-4">
									<div className="bg-blue-100 p-3 rounded-lg">
										<FaPhone className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">Phone</h3>
										<p className="text-gray-600">+1 (555) 123-4567</p>
										<p className="text-gray-600">+1 (555) 987-6543</p>
									</div>
								</div>
								<div className="flex items-start space-x-4">
									<div className="bg-blue-100 p-3 rounded-lg">
										<FaEnvelope className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">Email</h3>
										<p className="text-gray-600">support@newchem.com</p>
										<p className="text-gray-600">info@newchem.com</p>
									</div>
								</div>
								<div className="flex items-start space-x-4">
									<div className="bg-blue-100 p-3 rounded-lg">
										<FaMapMarkerAlt className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">Address</h3>
										<p className="text-gray-600">
											123 Pharmacy Street
											<br />
											Medical District
											<br />
											New York, NY 10001
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-4">
									<div className="bg-blue-100 p-3 rounded-lg">
										<FaClock className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-900">Hours</h3>
										<p className="text-gray-600">
											Monday - Friday: 8:00 AM - 8:00 PM
										</p>
										<p className="text-gray-600">Saturday: 9:00 AM - 6:00 PM</p>
										<p className="text-gray-600">Sunday: 10:00 AM - 4:00 PM</p>
									</div>
								</div>
							</div>
						</div>

						{/* Social Media */}
						<div className="bg-white rounded-lg shadow-sm p-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">
								Follow Us
							</h2>
							<div className="flex space-x-4">
								<a
									href="#"
									className="bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors"
								>
									<FaFacebook className="w-6 h-6 text-blue-600" />
								</a>
								<a
									href="#"
									className="bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors"
								>
									<FaTwitter className="w-6 h-6 text-blue-600" />
								</a>
								<a
									href="#"
									className="bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors"
								>
									<FaInstagram className="w-6 h-6 text-blue-600" />
								</a>
								<a
									href="#"
									className="bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors"
								>
									<FaLinkedin className="w-6 h-6 text-blue-600" />
								</a>
							</div>
						</div>
					</div>

					{/* Contact Form */}
					<div className="bg-white rounded-lg shadow-sm p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Send us a Message
						</h2>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Full Name
								</label>
								<input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="John Doe"
								/>
							</div>
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Email Address
								</label>
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									required
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="john@example.com"
								/>
							</div>
							<div>
								<label
									htmlFor="subject"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Subject
								</label>
								<input
									type="text"
									id="subject"
									name="subject"
									value={formData.subject}
									onChange={handleChange}
									required
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="How can we help?"
								/>
							</div>
							<div>
								<label
									htmlFor="message"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Message
								</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleChange}
									required
									rows="4"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Your message here..."
								></textarea>
							</div>
							<button
								type="submit"
								disabled={isSubmitting}
								className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ${
									isSubmitting ? "opacity-75 cursor-not-allowed" : ""
								}`}
							>
								{isSubmitting ? "Sending..." : "Send Message"}
							</button>
							{submitStatus === "success" && (
								<p className="text-green-600 text-center">
									Message sent successfully! We'll get back to you soon.
								</p>
							)}
							{submitStatus === "error" && (
								<p className="text-red-600 text-center">
									Something went wrong. Please try again later.
								</p>
							)}
						</form>
					</div>
				</div>

				{/* Map Section */}
				<div className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden">
					<div className="h-96 w-full bg-gray-200">
						{/* Replace with actual map component */}
						<div className="w-full h-full flex items-center justify-center text-gray-500">
							Map will be displayed here
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Contact;
