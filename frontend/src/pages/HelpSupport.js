import React, { useState } from "react";

const HelpSupport = () => {
	const [activeTab, setActiveTab] = useState("faq"); // faq, contact, resources

	const faqs = [
		{
			category: "General",
			questions: [
				{
					question: "How do I reset my password?",
					answer:
						"To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to reset your password.",
				},
				{
					question: "How do I update my profile information?",
					answer:
						"You can update your profile information by clicking on your profile picture in the top right corner and selecting 'Edit Profile' from the dropdown menu.",
				},
			],
		},
		{
			category: "Prescriptions",
			questions: [
				{
					question: "How do I create a new prescription?",
					answer:
						"To create a new prescription, navigate to the Prescription Management page and click the 'Create New Prescription' button. Fill in the required patient and medication information.",
				},
				{
					question: "Can I edit an existing prescription?",
					answer:
						"Yes, you can edit an existing prescription by finding it in the Prescription Management page and clicking the 'Edit' button. Note that some changes may require additional authorization.",
				},
			],
		},
		{
			category: "Inventory",
			questions: [
				{
					question: "How do I add new inventory items?",
					answer:
						"To add new inventory items, go to the Inventory Management page and click the 'Add New Item' button. Fill in the item details including name, quantity, and expiry date.",
				},
				{
					question: "What do the stock level indicators mean?",
					answer:
						"Green indicates healthy stock levels, yellow indicates low stock (below reorder level), and red indicates out of stock. You'll receive notifications for items that need reordering.",
				},
			],
		},
	];

	const supportContacts = [
		{
			department: "Technical Support",
			email: "tech.support@pharmacy.com",
			phone: "+1 (555) 123-4567",
			hours: "24/7",
		},
		{
			department: "Customer Service",
			email: "customer.service@pharmacy.com",
			phone: "+1 (555) 234-5678",
			hours: "Mon-Fri, 9AM-6PM EST",
		},
		{
			department: "Emergency Support",
			email: "emergency@pharmacy.com",
			phone: "+1 (555) 999-8888",
			hours: "24/7",
		},
	];

	const resources = [
		{
			title: "User Guide",
			description:
				"Comprehensive guide to using the pharmacy management system",
			link: "/docs/user-guide",
			icon: "📚",
		},
		{
			title: "Video Tutorials",
			description: "Step-by-step video tutorials for common tasks",
			link: "/docs/video-tutorials",
			icon: "🎥",
		},
		{
			title: "API Documentation",
			description: "Technical documentation for system integration",
			link: "/docs/api",
			icon: "⚙️",
		},
		{
			title: "Training Materials",
			description: "Resources for staff training and onboarding",
			link: "/docs/training",
			icon: "📋",
		},
	];

	const renderFAQ = () => (
		<div className="space-y-8">
			{faqs.map((category) => (
				<div key={category.category} className="bg-white shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							{category.category}
						</h3>
						<div className="space-y-4">
							{category.questions.map((faq, index) => (
								<div
									key={index}
									className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
								>
									<h4 className="text-md font-medium text-gray-900 mb-2">
										{faq.question}
									</h4>
									<p className="text-gray-600">{faq.answer}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);

	const renderContact = () => (
		<div className="space-y-6">
			{/* Contact Information */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Contact Information
					</h3>
					<div className="space-y-6">
						{supportContacts.map((contact) => (
							<div
								key={contact.department}
								className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
							>
								<h4 className="text-md font-medium text-gray-900 mb-2">
									{contact.department}
								</h4>
								<div className="space-y-2">
									<p className="text-gray-600">
										<span className="font-medium">Email:</span>{" "}
										<a
											href={`mailto:${contact.email}`}
											className="text-blue-600 hover:text-blue-800"
										>
											{contact.email}
										</a>
									</p>
									<p className="text-gray-600">
										<span className="font-medium">Phone:</span>{" "}
										<a
											href={`tel:${contact.phone}`}
											className="text-blue-600 hover:text-blue-800"
										>
											{contact.phone}
										</a>
									</p>
									<p className="text-gray-600">
										<span className="font-medium">Hours:</span> {contact.hours}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Contact Form */}
			<div className="bg-white shadow rounded-lg">
				<div className="px-4 py-5 sm:p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Send us a Message
					</h3>
					<form className="space-y-4">
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
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email
							</label>
							<input
								type="email"
								name="email"
								id="email"
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="subject"
								className="block text-sm font-medium text-gray-700"
							>
								Subject
							</label>
							<input
								type="text"
								name="subject"
								id="subject"
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="message"
								className="block text-sm font-medium text-gray-700"
							>
								Message
							</label>
							<textarea
								name="message"
								id="message"
								rows={4}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							></textarea>
						</div>
						<div>
							<button
								type="submit"
								className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Send Message
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);

	const renderResources = () => (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
			{resources.map((resource) => (
				<div
					key={resource.title}
					className="bg-white shadow rounded-lg overflow-hidden"
				>
					<div className="px-4 py-5 sm:p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0 text-3xl">{resource.icon}</div>
							<div className="ml-4">
								<h3 className="text-lg font-medium text-gray-900">
									{resource.title}
								</h3>
								<p className="mt-1 text-sm text-gray-600">
									{resource.description}
								</p>
								<div className="mt-4">
									<a
										href={resource.link}
										className="text-sm font-medium text-blue-600 hover:text-blue-500"
									>
										View Resource
										<span aria-hidden="true"> &rarr;</span>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white shadow rounded-lg">
					{/* Header */}
					<div className="px-4 py-5 border-b border-gray-200 sm:px-6">
						<h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
					</div>

					{/* Tabs */}
					<div className="border-b border-gray-200">
						<nav
							className="-mb-px flex space-x-8 px-4 sm:px-6"
							aria-label="Tabs"
						>
							{["faq", "contact", "resources"].map((tab) => (
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

					{/* Content */}
					<div className="px-4 py-5 sm:p-6">
						{activeTab === "faq" && renderFAQ()}
						{activeTab === "contact" && renderContact()}
						{activeTab === "resources" && renderResources()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default HelpSupport;
