import React from "react";
import { Link } from "react-router-dom";
import {
	FaPills,
	FaFileMedical,
	FaChartLine,
	FaClock,
	FaShieldAlt,
	FaMobileAlt,
	FaHeadset,
} from "react-icons/fa";

const Home = () => {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
				{/* Background Pattern */}
				<div className="absolute inset-0 opacity-10">
					<svg
						className="h-full w-full"
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
					>
						<defs>
							<pattern
								id="grid"
								width="10"
								height="10"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 10 0 L 0 0 0 10"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.5"
								/>
							</pattern>
						</defs>
						<rect width="100" height="100" fill="url(#grid)" />
					</svg>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-6">
							Modern Pharmacy Management
							<br />
							<span className="text-blue-200">Simplified</span>
						</h1>
						<p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
							Streamline your pharmacy operations with our comprehensive
							management system. From prescription handling to inventory
							control, we've got you covered.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/create-account"
								className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
							>
								Get Started
							</Link>
							<Link
								to="/symptom-ai"
								className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 transition-colors duration-200"
							>
								Try Symptom AI
							</Link>
						</div>
					</div>

					{/* Feature Highlights */}
					<div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
								<FaPills className="text-white text-2xl" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Smart Inventory</h3>
							<p className="text-blue-100">
								Automated stock tracking and low inventory alerts
							</p>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
								<FaFileMedical className="text-white text-2xl" />
							</div>
							<h3 className="text-xl font-semibold mb-2">
								Digital Prescriptions
							</h3>
							<p className="text-blue-100">
								Secure and efficient prescription management
							</p>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
								<FaChartLine className="text-white text-2xl" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Analytics</h3>
							<p className="text-blue-100">
								Comprehensive reports and business insights
							</p>
						</div>
					</div>
				</div>

				{/* Wave Divider */}
				<div className="absolute bottom-0 left-0 right-0">
					<svg
						className="w-full h-16 text-white"
						viewBox="0 0 1440 100"
						preserveAspectRatio="none"
					>
						<path
							fill="currentColor"
							d="M0,50 C150,100 350,0 500,50 C650,100 850,0 1000,50 C1150,100 1350,0 1440,50 L1440,100 L0,100 Z"
						></path>
					</svg>
				</div>
			</section>

			{/* Additional Content Sections */}
			<section className="py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Why Choose Our System?
						</h2>
						<p className="text-xl text-gray-600">
							Designed for modern pharmacies, built for efficiency
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<FaClock className="text-blue-600 text-2xl" />
							</div>
							<h3 className="text-lg font-semibold mb-2">Time Saving</h3>
							<p className="text-gray-600">
								Automate routine tasks and focus on patient care
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<FaShieldAlt className="text-blue-600 text-2xl" />
							</div>
							<h3 className="text-lg font-semibold mb-2">Secure</h3>
							<p className="text-gray-600">
								HIPAA compliant with advanced security features
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<FaMobileAlt className="text-blue-600 text-2xl" />
							</div>
							<h3 className="text-lg font-semibold mb-2">Mobile Ready</h3>
							<p className="text-gray-600">
								Access your pharmacy data anywhere, anytime
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<FaHeadset className="text-blue-600 text-2xl" />
							</div>
							<h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
							<p className="text-gray-600">
								Round-the-clock technical support and assistance
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Home;
