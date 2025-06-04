import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		"Quick Links": [
			{ name: "Home", path: "/" },
			{ name: "Dashboard", path: "/dashboard" },
			{ name: "Symptom AI", path: "/symptom-ai" },
			{ name: "Patient Records", path: "/patient-records" },
		],
		Services: [
			{ name: "Prescription Management", path: "/prescription-management" },
			{ name: "Inventory Management", path: "/inventory-management" },
			{ name: "Reports & Analytics", path: "/reports-analytics" },
			{ name: "Help & Support", path: "/help-support" },
		],
		Company: [
			{ name: "About Us", path: "/about" },
			{ name: "Contact", path: "/contact" },
			{ name: "Privacy Policy", path: "/privacy" },
			{ name: "Terms of Service", path: "/terms" },
		],
	};

	return (
		<footer className="bg-gray-900 text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{/* Company Info */}
					<div className="space-y-4">
						<h3 className="text-xl font-bold">Pharmacy Management</h3>
						<p className="text-gray-400">
							Streamlining healthcare management with innovative solutions for
							pharmacies and healthcare providers.
						</p>
						<div className="flex space-x-4">
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<i className="fab fa-facebook-f"></i>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<i className="fab fa-twitter"></i>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<i className="fab fa-linkedin-in"></i>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
							>
								<i className="fab fa-instagram"></i>
							</a>
						</div>
					</div>

					{/* Footer Links */}
					{Object.entries(footerLinks).map(([category, links]) => (
						<div key={category}>
							<h3 className="text-lg font-semibold mb-4">{category}</h3>
							<ul className="space-y-2">
								{links.map((link) => (
									<li key={link.name}>
										<Link
											to={link.path}
											className="text-gray-400 hover:text-white transition-colors"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-gray-800 mt-12 pt-8">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<p className="text-gray-400 text-sm">
							© {currentYear} Pharmacy Management System. All rights reserved.
						</p>
						<div className="flex space-x-6 mt-4 md:mt-0">
							<Link
								to="/privacy"
								className="text-gray-400 hover:text-white text-sm transition-colors"
							>
								Privacy Policy
							</Link>
							<Link
								to="/terms"
								className="text-gray-400 hover:text-white text-sm transition-colors"
							>
								Terms of Service
							</Link>
							<Link
								to="/contact"
								className="text-gray-400 hover:text-white text-sm transition-colors"
							>
								Contact Us
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
