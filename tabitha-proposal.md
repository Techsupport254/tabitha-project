DEVELOPING AN A.I ASSISTED MEDICINE PRESCRIPTION SYSTEM FOR UZURI CHEM PHARMACY
PROJECT PROPOSAL
BY: TABITHA MUTISO

REGISTRATION NO: SCT221-D1-0012/2022

SUPERVISED BY DON. DENNIS NJAGI

A proposal submitted to the Department of Information Technology in the School of computing and information technology and College of Pure and Applied Sciences in partial fulfilment of the requirement for the award of the degree of Bachelor of Science in Information Technology Jomo Kenyatta University of Agriculture and Technology.

NOVEMBER, 2024

Declaration
I, Tabitha Mutiso, declare that this project proposal is my original work and has not be used or presented in any institution for the award of any academic qualifications. In that case no part of this document shall be duplicated without my consent.

29/11/2022
………………………………………………… ……………………………………………………………
Signature Date

This project proposal has been submitted for examination with my approval as university Supervisor

……………………………………………… ……………………………………………………………
Signature Date

Acknowledgement
I take this Opportunity to express my gratitude towards all the people who helped me make this project successful.
I extend my sincere gratitude to my project supervisor Don. Dennis Njagi, who has constantly remained helpful in suggesting directions and providing me with valuable guidance throughout this project.  
I would like to whole heartedly thank all my friends and Family who motivated and guided me in writing this project.

Abstract
Accurate reading and comprehension of medical prescriptions are crucial for healthcare providers to ensure appropriate treatment for the patients. However, with the growing volume of prescriptions and increasingly complex medication regimens, errors can occur, which can result in severe consequences. To mitigate this issue, Artificial Intelligence (AI) can automate tasks such as medication identification, dosage calculation, and drug interaction checks, potentially improving the accuracy and efficiency of prescription analysis.
This study proposes the development of an AI-Assisted Medicine Prescription System to address these issues. The system is designed to empower pharmacist by allowing them to input symptoms and receive AI-driven predictions of potential diseases, alongside personalized medication recommendations.
The system would utilize client server and will be implemented using open source solutions that include Python as the programming language and Flask as the framework, MySQL as the database. An extensive evaluation should determine the project achievement and its major limitations in the scope. This innovative solution seeks to bridge the gap between patients and informed medical decision-making, reduce the risks associated with self-diagnosis, and support healthcare professionals with readily accessible data-driven recommendations. Ultimately, the project aspires to enhance the quality of healthcare delivery, making it more precise, accessible, and patient-centric in an era of increasing medical complexity.

Table of Contents
Declaration ii
Acknowledgement iii
Abstract iv
List of Figures viii
List of Tables ix
Acronyms x
Definition of Terms xi
CHAPTER 1 1
1.0 Introduction 1
1.1 Project Overview 2
1.1.1 Global Perspective 2
1.1.2 Local Perspective 2
1.2 Problem Statement 3
1.3 Proposed Solution 3
1.3.1 Key Features of Proposed System 4
1.4 Objectives 5
1.4.1 General Objective 5
1.4.2 Specific Objectives 5
1.5 Research Questions 5
1.6 Justification 5
1.7 Proposed Research and Methodology 6
1.7.1 Research Methodology 6
1.7.2 System Development Methodology 6
1.7.3 Justification for the Agile Methodology 7
1.8 Scope 8
1.8.1 Limitations of the Study: 8
CHAPTER 2: LITERATURE REVIEW 9
2.1 Introduction 9
2.2 Theoretical Review 9
2.2.1 Key Theoretical Concepts 10
2.2.2 Theoretical Frameworks 13
2.3 Case Study Review 14
2.3.1 Case Study 1: Kenyatta National Hospital 14
2.3.2 Case Study 2: Mater Hospital 14
2.3.3 Case Study 3: Pharm Access Foundation 14
2.4 Application of AI in Medicine Prescription 14
2.5 Integration and Architecture 15
2.5.1 Integration Options for AI assisted medicine prescription System 16
2.5.2 Possible Design Architectures 18
2.5.3 Possible Design Frameworks 20
2.6 Summary of The Literature Review 21
2.7 Research Gaps 22
References 25
Appendices 26
Project Requirements 26
Project Schedule 27
Gantt Chart 28
CHAPTER 3: SYSTEM DESIGN &ANALYSIS 30
3.1 Introduction 30
3.2 Systems Development Methodology 30
3.3 Feasibility Study 30
• Economic Feasibility 30
• Technical Feasibility 30
• Operational Feasibility 31
3.4 Requirements Elicitation 31
• Interviews 31
• Questionnaires 31
• Observation 31
3.5 Data Analysis 31
3.6 System Specification 32
Functional Requirements 32
• Non-Functional Requirements 32
3.7 Requirements Analysis and Modeling 32
• Activity Diagrams 33
• Use Case Diagrams 34
3.8 Logical Design 35
• 3.8.1 System Architecture 35
• 3.8.2 Control Flow and Process Design 35
• 3.8.3 Design for Non-Functional Requirements 35
3.9 Physical Design 35
• 3.9.1 Database Design 35
• 3.9.2 User Interface Design 36
Index Page 36
Login Page 37
Home Page 37
Admin Page 38

List of Figures
Figure 1: Agile methodology 7

List of Tables
Table 1 Project Objectives and Corresponding Work packages (16 weeks) …………………………………………………………………………………….27
Table 2 Gantt Chart (Timeline Overview) ………………………………………...28
Table 3 Budget for research Project ……………………………………………….29

Acronyms

DR. – DOCTOR
ML – MACHINE LEARNING
PMRS – Personalized Medicine Recommendation System
AI – Artificial Intelligence
IBM - International Business Machines.
UI – User Interface
UX- User Experience
UAT- User Acceptance Testing
SSD- Solid State Drive.
IDE- Integrated Development Environment.

Definition of Terms
Machine Learning - a subset of AI where systems learn patterns from data and improve performance over time without being explicitly programmed.
Artificial Intelligence - creating machines or systems that can perform tasks that typically require human intelligence

CHAPTER 1
1.0 Introduction
In today`s world healthcare faces a lot of challenges. Doctors and pharmacist often find it hard to figure out what is wrong with someone once they get sick because there are too many diseases and many of them have similar symptoms which is hard for the doctors to keep track. Usually, doctors depend on tests, information that is given to them by the patient, historical records of the patient and any family disease so as to make decision on the kind of prescription to administer, but mistakes can happen especially if the doctor is overwhelmed with too much work or they do not have full information of the patient. These mix-ups can lead to the wrong diagnosis therefore offering the wrong treatment to the patient and instead of the patient to feel better they end getting worse. These leads to the loss of trust between patients and doctors since they cannot fully trust them to offer the proper treatment.
Artificial Intelligence (AI) has emerged as a powerful tool with the potential to revolutionize various aspects of healthcare, including drug discovery, diagnostics, and treatment planning. Its ability to analyze vast amounts of data, identify patterns, and provide intelligent insights makes it a promising technology for enhancing the accuracy, efficiency, and safety of medicine prescription.  
The client that I am developing the proposed system is Uzuri Chem Pharmacy, it is located in Thika. It serves an average of 150 patients in a day. They offer good medical services to patients and since they are very busy daily the doctors get to be overwhelmed with pressure of the job and sometimes, they are not able to get full access to patients records thus getting wrong diagnosis and therefore not being able to treat the patient.
This project, aims to develop a Medicine Prescription System, that will fix these problems by creating a system that helps patients and doctors at Uzuri Chem Pharmacy. The system lets people type in their symptoms, predicts what illness they might have, and suggests the right medicines, precautions, and diet tips. By using AI and a simple website, it cuts down on guesswork, speeds up care, and reduces the need for patients to treat themselves or wait too long for help. It's all about making healthcare at Uzuri Chem Pharmacy easier, faster, and safer for everyone.
1.1 Project Overview
The world keeps growing in the area of mobile and smart technologies has reshaped industries like healthcare, thus providing better ways to tackle challenges such as diagnosing diseases and finding the right treatments. This project, the Medicine Recommendation System, builds a smart system to help patients and doctors at Uzuri Chem Pharmacy in Thika. It uses two key ideas Artificial Intelligence to guess illnesses from symptoms and data analysis to give personalized advice as the main tools (research areas) to make healthcare more accurate. By combining these into an easy-to-use system with a Flask-based web platform, it aims to accurately treat patients according to the disease thus avoiding wrong diagnosis
1.1.1 Global Perspective
The integration of AI into healthcare is a rapidly evolving field globally, with significant research and development efforts underway in various countries like North America and Europe which are at the forefront of AI research and development in Healthcare. They are actively exploring AI applications for drug discovery, diagnostics, and treatment optimization, including prescription support systems.
This project, the Medicine Recommendation System, fits into this global shift. It uses Artificial Intelligence to predict diseases from symptoms and data analysis to suggest personalized medicines, precautions, and diet tips. It helps doctors make better decisions thus creating better trust between doctors and patients and also saving lives.
1.1.2 Local Perspective
The adoption of digital health technologies, including AI, in Kenya is gaining momentum, driven by the need to improve healthcare access, efficiency, and quality. While the application of AI in medicine prescription is still in its nascent stages, it faces a lot of challenges patients wait a long time to be attended to, reliance on manual records also the lack of reliable tools to proper diagnose makes it difficult to treat the patients.
The purpose of this project is to develop an AI Medicine Prescription System using AI so as to ensure the right treatment is offered to patients.
1.2 Problem Statement
Healthcare is an essential service that impacts the lives of people worldwide. It is critical to provide the right treatment to patients as fast as possible, and the success of such treatment depends on the accuracy of the medication prescribed. Over the years, the healthcare industry has made significant progress in medical research, diagnostic equipment, and other medical technologies. However, one area that has been overlooked is the AI Medicine Recommendation System, which can improve healthcare outcomes and reduce healthcare costs.
The healthcare industry has traditionally used a one-size-fits-all approach to medication recommendations. Medical professionals prescribe medication based on clinical trials, symptoms, and the patient's medical history. While this method can be effective, it is not tailored to each patient's individual needs, leading to trial-and-error approaches to medication. This approach can result in the prescription of unnecessary or ineffective medications, leading to additional costs and delays in treatment
In the Case of Uzuri Chem Pharmacy which is located in Thika handles over 150 patients daily. The patients are located along Thika road and some even come from Muranga to receive treatment. This is exhausting for doctors to handle all these patients in a day and to retrieve medical records is sometimes slow which can delay how fast a patient receives treatment. Sometimes doctors can mix up medical records which can cause a confusion which will lead misdiagnosis and giving the wrong treatment to patients which can harm them or even cause death in some cause. Over time patients have lost trust in doctors due to wrong medication and therefore causing some to self-medicate.
1.3 Proposed Solution
This project has an aim to develop an AI Medicine Prescription System, which has the potential to revolutionize how patients are diagnosed and offered treatment. By using machine learning and a web-based platform the solution aims to enhance how patients receive treatment quickly without delay, the right treatment preventing misdiagnosis, and the right medication to avoid advance effects of giving the wrong medication.
Optimized medicine selection is a critical process that aims to ensure the best possible treatment outcome for individual patients. It involves a comprehensive evaluation of numerous factors, including the patient's medical conditions, symptoms, medical history, genetic factors, demographic information, potential drug interactions, and possible side effects.20 Doctors analyze all these data and then can make decisions to minimize the risks associated with medication and maximize therapeutic benefits. This individualized approach acknowledges that patients have different responses to the medications due to factors such as genetic variations, pre-existing conditions, and polypharmacy.21 Doctors are part of this process because they are medication expertise and prevent medication errors by ensuring the right drug, frequency, dose, and dosage form.22 So how can Artificial intelligence aid doctors in optimizing medicine? AI-based systems can provide doctors with advanced decision-support tools. These tools analyze vast amounts of patient data from various sources, including electronic health records (EHR), genomic sequencing, medical reports, and lifestyle information.23-25 The more comprehensive and diverse the data, the better AI can understand individual patients' unique characteristics and medication needs. Doctors can take advantage of AI models to generate predictions and recommendations made specifically for individual patients. These models know historical patients' data, treatment outcomes, and medical knowledge to outlook the disease progression, treatment response, and potential adverse effects.26-27
1.3.1 Key Features of Proposed System

The AI Medicine Prescription System will include the following key operations:

1. Symptom Input and Collection: The system will allow doctors at Uzuri Chem Pharmacy to enter symptoms through a simple Flask-based web interface.
2. Disease Prediction with Machine Learning: Using a trained machine learning model, the system will analyze the entered symptoms and predict possible diseases.
3. Personalized Recommendation Generation: After predicting a disease, the system will create a detailed report.
4. Real-Time Data Checking and Updates: The system will use data analysis to check its predictions and recommendations in real-time, making sure they're safe and correct.
5. Secure Access and Health Data Protection: To keep patient information safe, the system will use encryption techniques, protecting symptoms, reports, and personal details from unauthorized access.
   1.4 Objectives
   1.4.1 General Objective
   • To develop an AI Medicine Prescription System for Uzuri Chem Pharmacy.
   1.4.2 Specific Objectives
6. To analyze existing AI medicine prescription systems.
7. To design an AI medicine prescription system.
8. To implement an AI medicine Prescription system for Uzuri chem Pharmacy.
9. To evaluate the model

1.5 Research Questions

1. What are the strengths and limitations of existing AI medicine prescription systems in terms of accuracy, safety, efficiency, and user experience?

2. What are the optimal system architecture and components for an AI medicine prescription system tailored to the needs of Uzuri Chem Pharmacy?
3. What are the practical steps and resources required to implement the designed AI medicine prescription system within the operational environment of Uzuri Chem Pharmacy?
4. How can the performance and effectiveness of the implemented AI medicine prescription system be evaluated in the context of Uzuri Chem Pharmacy?
   1.6 Justification
   This research is being conducted to address a growing challenge in modern healthcare misdiagnosis and ineffective treatment caused by symptom variability, incomplete data, and over-reliance on traditional diagnostic methods. The proposed solution involves developing an AI Medicine Prescription System that uses machine learning and a Flask-based web interface to deliver accurate disease predictions and medical guidance based on user-inputted symptoms.

1.7 Proposed Research and Methodology
1.7.1 Research Methodology
To thoroughly evaluate the AI Medicine Prescription System's effectiveness, this research will employ a mixed-methods strategy, combining both qualitative and quantitative data collection and analysis. The methodology will include:

1. Literature Review: Investigate the influence of individualized recommendations on enhancing diagnostic precision and the quality of patient care.
2. Surveys and Interviews: Administer questionnaires and conduct interviews with healthcare practitioners (physicians, nurses) to elicit their perspectives on the current limitations of medical recommendation systems.
3. Data Collection and Preprocessing: Gather information from diverse healthcare repositories to serve as training data for the recommendation model.
4. Data Analysis: Examine the collected data using statistical methods and machine learning algorithms to discern significant trends, relationships between symptoms and illnesses, and the efficacy of personalized recommendations.
   1.7.2 System Development Methodology
   I will be using Agile methodology for system development due to its phased approach, ensuring each stage is completed before moving to the next. This methodology is time-efficient and flexible.
5. Requirements Gathering:
   o Based on the research findings, define both functional and non-functional requirements for the AI medicine Prescription System.
   o Establish system features like user authentication, secure data handling, and real-time processing of medical data.
6. System Design:
   o Design the system architecture, ensuring seamless integration between the machine learning model and Flask-based web interface.
   o Create the user interface (UI) and user experience (UX) elements focused on providing an intuitive, user-friendly experience for both patients and healthcare professionals.
7. Development:
   o Develop the system using appropriate technologies like Flask for the web framework, machine learning libraries (e.g., scikit-learn, TensorFlow).
8. Testing and Validation:
   o Conduct unit testing, integration testing, and system testing to ensure the accuracy of medication suggestions, and user interface.
   o Perform user acceptance testing (UAT) to validate the system's usability and performance with real-world data.
9. Deployment and Maintenance:
   o Deploy the system in a real-world healthcare environment for testing with both medical professionals and patients.
   o Continuously collect feedback to improve system features, model accuracy, and data handling. Regular updates and maintenance will be performed to ensure ongoing optimization.

Figure 1: Agile methodology
1.7.3 Justification for the Agile Methodology

The Agile methodology is chosen for this project because of its adaptability and iterative nature, making it well-suited for developing a system that evolves based on feedback from both healthcare professionals and patients. The iterative approach will enable continuous refinement of the recommendation system, ensuring it meets user needs, accommodates changes in medical data, and allows for quick responses to any emerging challenges during the development cycle.
1.8 Scope
The scope of this research and system development project will focus on the development of an AI assisted Medicine Prescription System, specifically targeting healthcare settings in Kenya. The system will provide disease predictions, and medication recommendations based on symptoms and historical health data. The system will serve both patients and healthcare professionals, aiming to improve diagnosis accuracy and reduce misdiagnosis of often complex diseases that have common symptoms with other diseases in health care settings.
1.8.1 Limitations of the Study:

1. Data Availability: Limited access to medical data for training the recommendation model that could affect the accuracy of disease predictions and consistently the system's performance.
2. Technological Constraints: The study is constrained to using Flask for web application development, machine learning algorithms for prediction, and MySQL for backend data storage.
3. Geographical Focus: The research will focus on healthcare within Kenya, and findings may not be directly applicable to regions with different healthcare infrastructures or practices.
4. Time and Resource Constraints: Due to a constrained timeline of six months, only a functional prototype of the recommendation system will be developed, and large-scale testing or full implementation may be limited.

CHAPTER 2: LITERATURE REVIEW
2.1 Introduction
This chapter explores existing literature on the use of AI and machine learning in healthcare, focusing on disease prediction, personalized medical recommendations, and data-driven treatment systems. Emphasis is placed on global and local implementations of similar systems, evaluating their effectiveness, usability, and limitations, particularly in the context of web-based platforms such as Flask. The review highlights the role of symptom analysis, real-time data integration, and secure data handling in enhancing healthcare delivery.
This chapter presents a comprehensive literature review on the development of an AI-Assisted Medicine Prescription System for Uzuri Chem Pharmacy. It highlights the increasing application of AI technology within the healthcare setting, emphasizing its relevance and potential benefits. The purpose of this literature review is to provide a theoretical foundation for the research, explore key concepts and applications, and identify existing research gaps.

2.2 Theoretical Review

The integration of AI into healthcare medicine prescription encompasses several critical concepts and variables. At the core of AI are data, which consists of raw information collected from various sources and is crucial for training AI models. Features which are specific attributes or pieces of information extracted from this data, which are used to train machine learning models. Labels represent the outcome variables or target values that the AI system aims to predict or classify.
Key theoretical divisions within AI in healthcare medicine prescription include Predictive Analytics, which uses historical data to forecast future trends such as inventory needs; Natural Language Processing (NLP), which enables AI to understand and process human language for tasks like prescription verification; and Machine Learning (ML), which involves developing algorithms that allow computers to learn from data and make decisions autonomously.
Each division has its advantages and limitations. For example, predictive analytics can optimize inventory management but may struggle with unexpected events. NLP can improve communication but may misinterpret complex medical terminology. Machine learning can enhance decision-making but requires large datasets and significant computational power.
2.2.1 Key Theoretical Concepts
This section outlines the fundamental concepts underpinning the development of our AI Assisted Medicine Prescription System.
Data Integrity
In the context of healthcare, maintaining the accuracy and consistency of patient data – including symptoms, medical history, and prescriptions – is paramount. Any erosion of data integrity can have severe consequences, potentially leading to incorrect diagnoses and inappropriate treatment recommendations. Several crucial elements contribute to robust data integrity:
• Accuracy
Ensuring that both the patient-provided information and the system's predictive outputs genuinely reflect the patient's actual health status.
• Consistency
Guaranteeing that data remains uniform and synchronized across the entire database and user interface, preventing discrepancies.
• Security
Implementing robust measures to safeguard patient data against unauthorized access, modification, or disclosure, upholding patient privacy.
• Validation
Rigorously checking all input data for correctness and adherence to predefined formats before it is processed or stored within the system.
Machine Learning-Based Prediction
The integration of machine learning empowers our system to generate automated, data-driven predictions based on presented patient symptoms. The system uses XGBoost, a gradient boosting framework, which offers several advantages:
• Efficient Training: XGBoost's optimized implementation allows for fast model training and prediction.
• Feature Importance: Built-in feature importance analysis helps understand which symptoms are most predictive.
• Handling Imbalanced Data: Effective handling of imbalanced disease classes through weighted sampling.
• Model Interpretability: Provides insights into prediction decisions through feature importance and probability scores.

Key aspects of this component include:
• Training
The process of feeding the machine learning model with meticulously labeled data, linking specific symptoms to their corresponding diagnosed diseases. The model uses:

- Binary symptom features
- Multi-class disease prediction
- Early stopping (10 rounds)
- Evaluation metric: mlogloss
- Hyperparameter tuning through grid search
  • Inference
  The application of the trained model to analyze new sets of patient symptoms and generate predictions regarding potential medical conditions, with confidence scores for each prediction.
  • Model Accuracy
  A critical metric ensuring the model's reliability, characterized by:
- Cross-validation scores
- Classification metrics (precision, recall, F1-score)
- Confusion matrix analysis
- Symptom detection performance
  • Explainability
  Providing transparency into the model's predictions through:
- Feature importance visualization
- Confidence scores for predictions
- Symptom-disease relationship mapping
  Personalized Recommendation Systems
  A core feature of our system is the ability to deliver tailored recommendations for medication, and precautionary measures, specifically adapted to each individual patient's needs. This personalization is crucial for optimizing treatment outcomes and patient well-being. Key characteristics include:
  • Adaptiveness
  The system's capacity to learn from patient feedback, treatment outcomes, and evolving medical knowledge to continuously refine and improve its suggestions over time.
  • User Profiling
  The incorporation of comprehensive patient information, such as medical history, age, and existing comorbidities, to ensure the accuracy and relevance of personalized recommendations.
  Flask Web Interface and Usability
  A seamless and responsive web interface is indispensable for ensuring user adoption and effective utilization of the system. The Flask microframework facilitates rapid development and robust integration with the machine learning backend. Essential elements of this aspect include:
  • UI/UX Design
  The creation of an intuitive user interface that simplifies symptom input and presents results in a clear, concise, and easily understandable manner.
  • API Integration
  Ensuring smooth and reliable communication between the frontend user interface, the backend machine learning model, and the underlying database.
  • Security Features
  Implementing robust security measures, including secure user authentication, encrypted data transmission, and effective session management, to protect sensitive information.
  2.2.2 Theoretical Frameworks
  This section delves into the theoretical frameworks underpinning the critical aspect of data integrity within the proposed system.
  Data Integrity Frameworks
  • Transactional Data Integrity
  This framework focuses on ensuring the accuracy of data inputs (e.g., symptoms, user credentials) and outputs (e.g., predictions, prescriptions) throughout all system operations. Techniques such as ACID (Atomicity, Consistency, Isolation, Durability) compliant databases, rigorous input validation procedures, and rollback mechanisms are employed to maintain data consistency, particularly in scenarios involving concurrent user access.
  o Strength: Offers a high degree of data reliability and consistency during transactions.
  o Limitation: May experience performance bottlenecks when dealing with very large datasets or high-frequency real-time queries.
  • End-to-End Integrity
  This comprehensive approach aims to guarantee data correctness throughout its entire lifecycle, from initial input to final prediction and output. It encompasses measures such as data storage encryption, checksum validation to detect data corruption, and the use of secure Application Programming Interfaces (APIs) for data transfer.
  o Strength: Provides robust protection for data throughout its entire journey within the system.
  o Limitation: Can introduce increased complexity during the system development and implementation phases.
  2.3 Case Study Review
  This section provides an analysis of relevant case studies focusing on the implementation and impact of machine learning, medical prescriptions systems, and broader digital healthcare technologies. These real-world examples offer valuable insights into the successes, challenges, and lessons learned from similar initiatives, both globally and within local contexts. The review of these case studies will inform the development of our Personalized Medical Recommendation System by highlighting effective strategies, potential pitfalls to avoid, and promising avenues for innovation.
  2.3.1 Case Study 1: Kenyatta National Hospital
  Kenyatta National Hospital introduced an AI-driven prescription verification system. This implementation has resulted in a notable decrease in prescription errors and improved patient safety. The system cross-references patient data with prescribed medications, flagging potential drug interactions and allergies (Kumar & Shah, 2020).
  2.3.2 Case Study 2: Mater Hospital
  Mater Hospital in Nairobi implemented an AI-based inventory management system. This system has helped predict drug requirements more accurately, reducing instances of stockouts and overstocking. The AI system has significantly improved operational efficiency and reduced costs associated with emergency orders and wastage due to expired drugs (Patel & Agrawal, 2021).
  2.3.3 Case Study 3: Pharm Access Foundation
  The Pharm-Access Foundation has been working with various community pharmacies in Kenya to implement AI-based tools for better data management and security. These tools help in maintaining accurate patient records, secure storage of sensitive information, and efficient retrieval of patient history (Angraal et al., 2020).

2.4 Application of AI in Medicine Prescription

The application of AI in Medicine Prescription spans various domains:
Predictive Inventory Management
AI algorithms analyze historical data, current trends, and seasonal variations to predict stock levels, ensuring optimal inventory management and reducing wastage.
Automated Prescription Verification
AI verifies prescriptions for accuracy and potential drug interactions, reducing the workload on pharmacists and enhancing patient safety.
Intelligent Data Retrieval
AI facilitates quick and accurate retrieval of patient history, reducing wait times and improving service efficiency.
Enhanced Data Security
AI-driven security protocols protect sensitive patient information through advanced encryption and real-time threat detection.

2.5 Integration and Architecture

Integrating AI into medicine prescription systems involves several options and considerations:
System Integration
AI modules can be integrated with existing healthcare systems to enhance their capabilities without disrupting current operations.
Design Architectures
The architecture typically includes a front-end user interface, a back-end server, and AI modules for specific tasks such as predictive inventory management, automated prescription verification, and enhanced security.
Frameworks
Frameworks like Tensor Flow and PyTorch can be used to develop and deploy AI models, while secure APIs facilitate communication between different system components.
2.5.1 Integration Options for AI assisted medicine prescription System
Integrating new digital tools with existing hospital infrastructure and workflows is crucial for successful implementation and adoption. Several integration approaches can be considered:

1. Electronic Health Records (EHR) Integration
   • Deep Integration: This involves a seamless, bidirectional exchange of data between the AI system and the EHR.
   o Input from EHR to AI: Accessing patient demographics, medical history, allergies, existing medications, lab results, diagnoses, and past prescriptions. This comprehensive data fuels the AI's analysis and recommendations.
   o Output from AI to EHR: Writing AI-generated prescription suggestions, alerts for drug interactions or allergies, and potentially even the final prescription directly into the patient's EHR. This streamlines the workflow for the prescriber.
   o Benefits: Enhanced accuracy due to access to complete patient data, reduced manual data entry, improved workflow efficiency, and better clinical decision support within the familiar EHR environment.
   o Considerations: Requires robust APIs and data interoperability standards (e.g., FHIR), significant development effort, stringent security and privacy compliance, and collaboration with EHR vendors.
   • Looser Integration (API-Based): The AI system and EHR communicate through APIs, allowing for data exchange without being deeply embedded.
   o Input: The prescriber might manually trigger the AI system from within the EHR, sending relevant patient data via API.
   o Output: The AI system returns recommendations that the prescriber can review and then manually enter or approve within the EHR.
   o Benefits: Less complex to implement initially compared to deep integration, allows for flexibility in choosing AI vendors, and can be implemented incrementally.
   o Considerations: May involve more manual steps for the prescriber, potentially slowing down the workflow and increasing the risk of transcription errors.
2. Pharmacy Systems Integration
   • Direct e-Prescribing: The AI system, once a prescription is finalized by the prescriber, can directly transmit it electronically to the patient's preferred pharmacy.
   o Benefits: Reduces prescription errors associated with handwriting, speeds up the dispensing process, improves patient convenience, and allows for real-time checks for formulary compliance and insurance coverage.
   o Considerations: Requires compliance with e-prescribing standards and integration with pharmacy software systems.
   • Recommendation Sharing: The AI system might provide pharmacists with additional information or alerts related to the prescribed medication, potential interactions, or patient-specific considerations.
   o Benefits: Enhances pharmacist oversight, improves medication safety, and facilitates better communication between prescribers and pharmacists.
   o Considerations: Requires secure communication channels and clear presentation of information to the pharmacist.
3. Laboratory Information Systems (LIS) Integration
   • Automated Data Retrieval: The AI system can automatically access and analyze relevant laboratory results (e.g., blood tests, imaging reports) to inform its diagnostic and treatment recommendations.
   o Benefits: Provides a more holistic view of the patient's condition, reduces the need for manual retrieval of lab data, and can identify patterns or anomalies that might influence prescribing decisions.
   o Considerations: Requires secure access to LIS data and the ability to interpret various data formats.
4. Patient Portals and Mobile Health Applications
   • Patient Access to Recommendations: Patients could potentially access AI-generated information related to their prescribed medications, including dosage instructions, potential side effects, and educational materials, through patient portals or dedicated mobile apps.
   o Benefits: Improves patient understanding and adherence to treatment plans, empowers patients to be more involved in their care.
   o Considerations: Requires clear and understandable language, careful consideration of information sensitivity, and secure access controls.
   • Patient-Reported Outcomes (PROs): Integrating with patient portals or apps can allow patients to report their symptoms, medication adherence, and any side effects, which can then be fed back into the AI system to refine recommendations over time.
   o Benefits: Enables a more patient-centric and adaptive approach to medication management.
   o Considerations: Requires user-friendly interfaces for data input and mechanisms to ensure data accuracy and reliability.
   2.5.2 Possible Design Architectures
   Several architectural patterns and frameworks can guide the design and implementation of integrated AI assisted Medicine Prescription systems:
5. Monolithic Architecture - All components of the AI system (user interface, application logic, AI models, database) are tightly coupled and deployed as a single unit. A single application would handle user interactions (likely a web interface), process user input, run the AI models for predictions and recommendations, and manage the prescription data in a local database. It is simpler to develop and deploy initially, especially for smaller-scale applications. Can be easier to manage in the early stages. However, it can become complex and difficult to scale or maintain as the system grows. Changes in one component can impact the entire system. Technology stack is often uniform, limiting flexibility. Less resilient to failures.
6. Microservices Architecture - The system is broken down into small, independent services that communicate with each other over a network (typically using APIs). Each service focuses on a specific business capability (e.g., user authentication, symptom analysis, drug interaction checking, prescription generation, database management).
   • How it applies:
   o API Gateway: A single entry point for all client requests.
   o User Interface Service: Handles user interactions (web interface built with Flask or another framework).
   o Symptom Analysis Service: Contains the AI model for predicting potential diseases based on symptoms.
   o Drug Recommendation Service: Houses the AI model and logic for suggesting medications, considering patient history, allergies, and interactions.
   o Drug Interaction Service: A separate service responsible for checking potential drug-drug and drug-allergy interactions.
   o Prescription Generation Service: Creates the final prescription details.
   o Data Storage Service: Manages the database (e.g., MySQL) and data access.
   o Authentication and Authorization Service: Handles user login and permission management.
   It is highly scalable (individual services can be scaled independently), more maintainable (changes in one service are less likely to affect others), technology diversity (different services can use the most appropriate technology), more resilient (failure of one service doesn't necessarily bring down the entire system). It is however, more complex to develop and deploy initially due to distributed nature, requires robust inter-service communication mechanisms, can be more challenging to monitor and debug.
7. Model-View-Controller (MVC) or Model-View-View-Model (MVVM) Architecture (within a Monolith or a Microservice) - These are architectural patterns primarily focused on the user interface and application logic within a single service or a monolithic application.
   o MVC (Model-View-Controller): Separates the application into three interconnected parts: The Model (data), the View (user interface), and the Controller (handles user input and updates the Model and View).
   o MVVM (Model-View-View-Model): Similar to MVC but introduces a View-Model that acts as an intermediary between the View and the Model, exposing data and commands that the View can bind to.
   Within the Flask-based web interface service (in a microservices architecture) or within the monolithic application, MVC or MVVM can be used to structure the frontend code, making it more organized and maintainable. It offers improved code organization, separation of concerns, easier to test the UI logic but can add complexity for very simple applications.
8. Event-Driven Architecture:
   Services communicate through asynchronous events. When a significant event occurs (e.g., a new patient record is created, a prescription is issued), a message is published to an event bus, and other interested services can subscribe to and react to that event. For example, when a prescription is generated, the "PrescriptionGenerated" event could trigger notifications to the pharmacy system, update patient records, and potentially initiate adherence monitoring workflows. It is highly scalable and decoupled, improves responsiveness, better handling of asynchronous tasks. It can be more complex to design and debug due to the non-linear flow of events, requires a reliable message broker.
   2.5.3 Possible Design Frameworks
   • Backend:
   o Flask (Python): As already mentioned, Flask is a lightweight and flexible microframework well-suited for building web applications and APIs. Its simplicity and extensive libraries make it a strong contender, especially if the development team has Python expertise.
   • Frontend:
   o React.js
   • Machine Learning:
   o XGBoost: A powerful gradient boosting framework used for the disease prediction model, providing efficient and accurate classification capabilities.
   o scikit-learn: Used for data preprocessing, model evaluation, and utility functions like train-test splitting and cross-validation.
   o spaCy: Natural Language Processing library used for symptom extraction and text processing.
   o MLflow: An open-source platform for managing the machine learning lifecycle, including experiment tracking, model packaging, and deployment.
   • Database:
   o MySQL: A widely used, open-source relational database management system (RDBMS). Suitable for storing structured data like patient records, prescriptions, and drug information.
   • API Development: Flask itself is excellent for building RESTful APIs for communication between microservices or the frontend and backend.
   The choice of integration strategy and architecture will depend on various factors, including the existing infrastructure, budget, technical expertise, scalability requirements, and the specific needs of the hospital and the target population. A well-planned integration and a robust architectural framework are essential for building effective and sustainable AI assisted prescription systems.
   2.6 Summary of The Literature Review
   This literature review synthesizes existing knowledge on medical recommendation systems, machine learning in healthcare, and predictive disease models. It highlights the potential of AI to enhance diagnostic accuracy and patient care by analyzing vast datasets and providing tailored treatment suggestions. However, the review also acknowledges challenges such as data privacy concerns, the need for robust validation, and the importance of explainability in AI-driven medical decisions.
   Studies on these recommendation systems emphasize the benefits of tailoring interventions to individual patient profiles, considering factors like medical history, genetics, and lifestyle. Machine learning in healthcare literature showcases the application of various algorithms for disease prediction, drug discovery, and treatment optimization. The review examines the strengths and limitations of different AI techniques, including supervised learning, deep learning, and natural language processing, in the context of medical prescription.
   Furthermore, the review analyzes case studies of existing AI-powered healthcare systems, such as Mater Hospital, Kenyatta National Hospital, and PharmAccess Foundation. These examples provide insights into successful implementations, common pitfalls, and user acceptance factors. The importance of seamless integration with Electronic Health Records (EHRs) and pharmacy systems is underscored, along with the need for user-friendly interfaces for both healthcare professionals and patients.
   The literature also addresses ethical considerations, regulatory frameworks, and the potential impact of AI on the healthcare workforce. It emphasizes the necessity of rigorous testing and validation to ensure the safety and efficacy of AI-assisted prescription systems, particularly in diverse healthcare settings like Uzuri Chem Pharmacy in Juja, Kenya, where local context and data availability are crucial considerations. The review identifies gaps in current research, such as the need for more studies in low-resource settings and the development of culturally sensitive AI models, thus justifying the proposed research.
   This literature review also highlights the growing application of AI in pharmacy management, emphasizing its potential to improve inventory management, prescription verification, data retrieval, and security. Theoretical divisions within AI, such as predictive analytics, NLP, and ML, offer various advantages and limitations. Successful case studies from Kenya, such as those at Mater Hospital, Kenyatta National Hospital, and PharmAccess Foundation, demonstrate the effectiveness of AI-enhanced systems, but challenges remain in terms of integration and ongoing staff training.

2.7 Research Gaps

Despite the advancements in AI for medicine prescriptions, several research gaps persist. This research aims to address these gaps by developing a comprehensive AI-assisted Medicine Prescription System, focusing on robust data management, seamless system integration, ongoing staff training, and enhanced security protocols. They include:
Need for more studies in low-resource settings
Low- resource settings have limited research and AI models may not be tailored to prevalent local diseases, resource constraints (e.g., limited internet), and unique patient demographics, hindering effectiveness.
Development of culturally sensitive AI models
Medical beliefs, communication styles, and dietary habits vary culturally. AI lacking this sensitivity could lead to mistrust, misinterpretations, and ineffective or unacceptable recommendations.
Data Quality and Standardization
Ensuring high-quality, standardized data for training AI models is essential. This includes accurate patient records, prescription histories, and inventory data. Establishing protocols for data entry and maintenance is crucial to minimize errors and inconsistencies (Li & Li, 2022).
System Integration and Interoperability
Seamless integration of AI modules with existing systems is challenging. For Chem Pharmacy, transitioning from manual to digital systems requires careful planning to ensure compatibility and minimize disruptions. Strategies for interoperability with other healthcare systems, such as hospitals and insurance providers, are necessary to facilitate comprehensive patient care (Smith & Nguyen, 2023).
Staff Training and Adoption
Continuous training for pharmacy staff is essential for the successful implementation of AI-enhanced systems. This includes understanding how to interact with the new system, interpreting AI-generated insights, and troubleshooting potential issues. Comprehensive training programs are needed to help staff effectively use the new technologies and integrate them into their daily workflows (Gupta & Ghafir, 2021).
Privacy and Security of Patient Information
Protecting sensitive patient data is a paramount concern, especially with increasing cybersecurity threats. Ensuring robust security measures, such as advanced encryption and real-time threat detection, is critical. Establishing protocols that comply with local and international data protection regulations is essential for safeguarding patient trust and the pharmacy's reputation (Kumar & Shah, 2020; Zhang & Wang, 2020).

References
Angraal, S., Krumholz, H. M., & Schulz, W. L. (2020). Blockchain technology: applications in health care. Circulation: Cardiovascular Quality and Outcomes, 10(9), e003800.
Bahl, R., & Venkatesh, S. (2021). Artificial Intelligence in Healthcare: Applications and Challenges. Journal of Medical Systems, 45(7), 1-10.
Brown, A. M., & Roberts, N. (2019). Predictive analytics in healthcare: emerging insights and applications. International Journal of Medical Informatics, 132, 103-110.
Dabbagh, M., & Kitsios, F. (2022). Natural language processing in healthcare: current trends and challenges. Journal of Biomedical Informatics, 117, 103-110.
Gupta, A., & Ghafir, I. (2021). An overview of machine learning in healthcare. Computational and Structural Biotechnology Journal, 19, 3921-3935.
Kumar, S., & Shah, S. (2020). AI-driven security systems for healthcare: trends and future directions. IEEE Access, 8, 19845-19860.
Li, X., & Li, W. (2022). Machine learning applications in healthcare: a systematic review. Health Information Science and Systems, 10(1), 1-17.
Patel, V., & Agrawal, R. (2021). AI in Pharmacy: Potential and Challenges. Pharmacy Journal, 34(4), 234-246.
Smith, J. A., & Nguyen, H. T. (2023). Enhancing pharmacy operations with artificial intelligence: a review of current trends. Journal of Pharmacy Technology, 39(2), 45-58.
Zhang, Y., & Wang, H. (2020). Secure and privacy-preserving AI in healthcare: a review. Journal of Biomedical Informatics, 108, 103-115.

Appendices

Project Requirements
Hardware Requirements
• Processor: Multi-core processor with a minimum of 2.5GHz speed.
• RAM: 8GB RAM or higher, recommended for handling AI computations and multiple concurrent users.
• Resolution: Minimum resolution of 1920x1080 (Full HD); support for 24-bit color.
• Hard Disk: At least 1TB SSD for faster data access and storage of large datasets.
• Keyboard: Standard 105-key keyboard.
• Flash Drive: 64GB or higher for backup and portable storage.
• Laptop/Workstation: A modern laptop or desktop workstation with robust cooling, adequate ports, and support for external monitors.
Software Requirements
• Operating System: Microsoft Windows 10 or higher, for enhanced security and compatibility with open-source AI tools.
• Server: MySQL for reliable database management; MongoDB for handling unstructured data if needed.
• Programming Languages: Python for AI and machine learning model development; PHP for backend development and integration.
• Network: Network card with support for gigabit speeds (1000 Mbps) for fast data transfer and network communication.
• Web Browser: Google Chrome, Mozilla Firefox, or Microsoft Edge, with support for modern web standards and developer tools.
• Integrated Development Environment (IDE): Visual Studio Code for coding
• AI Frameworks: Tensor Flow or PyTorch for AI model training and deployment.
• Web Server: Apache or Nginx for hosting web applications and APIs.
• Security Tools: SSL/TLS certificates for secure communication, and firewalls for network protection.

Project Schedule

Activities Duration (HRS) Expected Start Date Expected End Date Actual Start Date Actual End Date Deliverables

1. Project ID 24 01/10/2024 01/11/2024 01/10/2024 01/11/2024 Proposed solution
2. Proposal Writing 48 2/11/2024 28/11/2024 2/11/2024 28/11/2024 Draft proposal
   3.1. Data Collection

- Tools preparation 46 5/11/2024 9/11/2024 Draft questionnaires
  3.2. Tools Deployment 20 12/11/2024 14/11/2024 Completed report
  3.3. Analysis 22 15/11/2024 22/11/2024 Requirement specification report
  3.4. Collation 7 23/11/2024 25/11/2024

4. Design 30 26/11/2024 5/12/2024 System Framework
5. Testing & Maintenance 22 6/09/2024 12/09/2024 Error-free system
6. Project Documentation 24 13/12/2024 15/12/2024 Project document

Gantt Chart

Task Week 1-2 Week 3-4 Week 5-6 Week 7-8 Week 9-10 Week 11-12 Week 13-14 Week 15-16
Literature Review ████ ████
Case Study Analysis ████ ████
Conceptual Framework Development ████ ████
Research Methodology ████ ████
Data Collection & Analysis ████ ████
Report Writing ████ ████
Review & Submission ████ ████

BUDGET
ITEM COST
(Kshs) JUSTIFICATION
Internet and
Communication 2000 For accessing online research material, cloud services, and communication with stakeholders
Printing and Stationery 1500 For reports and search related documents.
Travel costs 2500 For traveling to research sites and interviewing participants
Server hosting 5000 Cost for cloud services or local servers to host the system during development
Miscellaneous Expenses 3500 To cover unforeseen expenses (e.g., extra testing, additional resources, emergency travel).
Laptop 47000 To run codes and design systems and partly storage
SUBTOTAL 61,500

CHAPTER 3: SYSTEM DESIGN &ANALYSIS
3.1 Introduction
This chapter focuses on the analysis and design phases of the AI-Assisted Medicine Prescription System for Uzuri Chem Pharmacy. It covers the system development methodology, feasibility studies, requirements elicitation, data analysis, system specification, requirement analysis and modeling, logical design and the system's physical design. In the system development methodology, the system development techniques are discussed, they are introduced before the actual implementation of the system begins. The feasibility study is conducted to assess the viability of the proposed system. The political, economic, social, technical, environmental, and legal feasibility are widely discussed. Requirement elicitation focuses on where and how the data was collected in addition to the sampling of the data collected and the techniques applied. The data collected will then be analyzed to format it, this is largely discussed in data analysis. Under the system specification, both functional and nonfunctional requirements are well presented in order to identify at what rate that the system offer what it offers. The requirements are analyzed and modeled to find out the conflicts and redundancies and to resolve them. Use Case diagrams to capture system interactions with users, Low-Level DFDs to illustrate data flow through system processes and class diagrams to define object relationships and attributes were modeled. In the logical design of the system, the system architecture (3 tier; user interface, business logic and database), control flow and process design (flowcharts, activity diagrams and sequence diagrams) and design for non-functional requirements (security strategies, error and exception handling) are captured. The physical design sector focuses on the design of the physical structure of the database, the user interface and the business logic. It involves making decisions about the hardware and software platforms, database, networking, deployment environments and other physical aspects of the system.
3.2 Systems Development Methodology
Agile is an ideal methodology for developing an AI- Assisted Medicine Prescription system due to its structured and iterative approach, which ensures continuous improvement. The process starts with understanding the business and data, followed by data preparation, crucial for handling sensitive pharmacy data. It enables experimenting with various AI models to forecast demand, recommend personalized medications, and detect fraud, all while maintaining security. The methodology's evaluation phase helps refine predictions and ensure the system meets real-world needs. Finally, agile flexibility and scalability also allow the system to evolve as data grows and new security challenges arise.
Agile has an iterative and incremental development that promotes; short development cycles to deliver working components, frequent reassessment and adaptation, which is crucial as new medical data or algorithms become available, the ability to incrementally introduce AI features which could become a bottleneck if introduced at once due to its complexity. With agile, one can create a system that meets the needs of the diverse users such as doctors, pharmacists and patients since it enhances close collaboration with stakeholders and continuous engagement of users to ensure the system remains usable, safe and compliant with the medical protocols. AI models are often probabilistic and may evolve over time, agile not only accommodates the changing requirements and unexpected outcomes for the AI model behavior of the system proposed but also allows developers to test and validate assumptions early, reducing the risk of building a system that doesn't align with the medical realities. Agile encourages learning from the past iterations, which is essential for fine tuning AI algorithms that the system will use. Furthermore, the teams can respond to new findings in medical research or emerging regulations without derailing the project. It also allows early deployment of minimum viable AI features like symptom checkers, which can evolve into full prescription support system. This promotes rapid delivery and feedback while ensuring a quicker time-to-value which in turn helps to build trust with end users.
In conclusion, Agile is ideal for an AI-Assisted Medicine Prescription system because it aligns with the dynamic, high-stakes, and user-sensitive nature of healthcare technology. It ensures flexibility, quality, and ongoing alignment with user needs and medical standards, making it a practical choice for managing both software and AI development challenges.
3.3 Feasibility Study
To assess the feasibility of implementing the AI Assisted Medicine Prescription System, PESTEL was examined:
• Political Feasibility
Government Regulations like policies on healthcare data usage, AI governance, and electronic health record (EHR) integration may influence development and deployment.
Public Healthcare Priorities, if national health priorities focus on digital transformation and AI, funding and support may be favorable.
Trade and Import Laws which govern importation of hardware (e.g., servers, diagnostic devices) for running AI infrastructure may be affected by tariffs and trade regulations.
• Economic Feasibility
The cost-effectiveness of the system was evaluated by comparing the expenses related to the current manual processes against the costs of implementing the AI-Assisted Medicine Prescription system. Although there is an initial investment in hardware, software, and training, the long-term benefits of improved efficiency, reduced labor costs, and minimized errors justify the expenditure.
• Social Feasibility
Public Trust and Acceptance because patients and healthcare providers must trust AI recommendations; skepticism may slow adoption.
Doctor-AI Collaboration as successful systems must respect the role of physicians and be seen as augmentative, not replacement tools.
Ethical Concerns, social debate around machine involvement in human health decisions may influence public opinion and regulation.
• Technical Feasibility
The technical feasibility of the project was evaluated based on the availability of the required technology. Uzuri Chem Pharmacy has access to modern hardware and software that can support AI algorithms, predictive analytics, and data management systems. The integration of machine learning tools such as TensorFlow and backend databases like MySQL was also considered viable.
• Environmental Feasibility
Data Center Energy Usage as hosting AI systems may increase energy consumption, especially when dealing with large datasets or real-time processing.
Sustainability Policies because organizations may need to align with green IT initiatives when deploying large AI systems.

• Legal Feasibility
Data Protection Laws especially compliance with regulations like GDPR, HIPAA, or local data sovereignty laws is mandatory.
Liability and Accountability to clarifying who is responsible if an AI-based prescription causes harm—developer, doctor, or institution—is a key legal challenge.
Intellectual Property (IP) to control ownership of proprietary AI models or datasets can affect collaboration and commercialization.

3.4 Requirements Elicitation
Data collection for system requirements was conducted using a combination of interviews, observations, and questionnaires:
• Interviews
This was conducted with pharmacy staff to understand the current challenges they face with the manual system. Key personnel such as doctors and pharmacist into operational inefficiencies, privacy concerns, and data management needs.
• Questionnaires
They were distributed among staff to collect feedback on what features they would like to see in the new system, particularly concerning patient diagnosis, patient data retrieval, and security.
• Observation
Daily operations were observed to identify workflow bottlenecks, such as long retrieval times for patient records and frequent stockouts due to poor inventory management.
Samples were taken to help during the data collection, model training and evaluation phases including testing to ensure the AI system is accurate, reliable and generalizable. The key sampling techniques applied were Stratified Sampling with Simple Random Sampling (SRS) and Systematic Sampling.
• Stratified Sampling
Data is divided into distinct strata (e.g., age groups, disease types, or gender) to reduce variability, and samples are drawn from each stratum proportionally using SRS. This technique ensures that minority and high-risk subgroups (e.g., elderly patients or patients with chronic diseases) are adequately represented. It is used to create balanced datasets to avoid bias toward commonly occurring conditions.
• Systematic Sampling

The population is divided into n groups of size k and in each group, one is picked systematically. From each group, choose one using SRS and apply it through the other groups to select systematically. It is efficient when data is uniformly distributed; however, it may introduce bias if there's an underlying pattern in the dataset. It can be applied in areas like sampling electronic health records from a time-ordered list (e.g., every 10th patient visit).

The data collected addressed the core research objectives and user needs. It formed the basis for defining system requirements, ensuring alignment with user expectations and system goals.
3.5 Data Analysis
Data collected from the pharmacy's existing manual records was analyzed using statistical tools like Microsoft Excel. The analysis revealed trends such as frequent medication shortages, delays in retrieving patient prescription history, and inaccuracies in monthly financial reconciliations. These findings informed the design of the AI system, specifically the need for predictive disease diagnosis and intelligent data retrieval functionalities.
The data collected from various tools was systematically analyzed using Microsoft Excel. To facilitate clear interpretation and insight extraction, results were visualized through different graphical formats:
• Pie Charts were used to represent user preferences, providing a quick overview of distribution and proportions across different options.

• Bar Graphs illustrated the frequency of issues encountered within the current system, making it easy to identify the most common problems.

• Line Graphs tracked trends in system performance metrics over time, helping to reveal patterns and shifts in performance.

These visualizations enabled stakeholders to make data-driven decisions for system improvements.

3.6 System Specification
The system requirements for the AI Pharmacy Management System can be classified into functional and non-functional requirements:
Functional Requirements

1. The system must enable accurate diagnosis, therefore offering the right medication.
2. The system must support automated prescription verification, ensuring accuracy and flagging potential drug interactions.
3. The system must allow for quick and accurate retrieval of patient history.
4. The system must provide secure storage for patient data, accessible only through authenticated credentials.

• Non-Functional Requirements

1. The system must be highly scalable to accommodate increasing data as the pharmacy grows.
2. Data security is paramount, and the system should employ encryption and real-time threat detection protocols.
3. The user interface must be intuitive and require minimal training to use.
4. The system must be reliable, with an uptime of 99.9%.

3.7 Requirements Analysis and Modeling
The gathered requirements were analyzed to identify dependencies, conflicts, and solutions. Various tools were used to model the requirements:
• Activity Diagrams
These diagrams helped visualize how data flows through the system, from doctor, pharmacist and patient.

• Use Case Diagrams
Use case diagrams illustrated interactions between users (pharmacy staff) and the system. Each use case depicted specific functionalities, such as patient record retrieval or prescription verification.

3.8 Logical Design
The logical design defines the essential structure and behavior of the system:
3.8.1 System Architecture

The AI Pharmacy Management System follows a client-server architecture where client terminals (used by pharmacists and cashiers) interact with a central server that hosts the AI modules and database. Major components include:
Client Interface: User-friendly interface for accessing patient records, managing inventory, and generating reports. React.js was preferred because it offers;
• Clear and Intuitive Interface
React can help build a user-friendly interface for doctors to input patient information, view AI-generated suggestions, review potential drug interactions, and ultimately generate prescriptions.  
• Real-time Feedback
React.js is efficient updates can provide real-time feedback to users, such as instant validation of input fields or immediate display of potential drug interactions as medications are selected.  
• Data Visualization
React can be used with charting libraries to visualize patient data, treatment history, or AI model confidence levels in an easily understandable format.
React.js provides the ideal framework for building a robust, performant, user-friendly, and maintainable interface that allows healthcare professionals to effectively interact with and leverage the AI's capabilities.
AI Modules: Algorithms for predictive inventory management and prescription verification. TensorFlow and PyTorch (Python), Powerful deep learning frameworks that can be used for more complex AI models if needed in the future. Might be overkill for initial symptom-disease prediction. TensorFlow and PyTorch enable the development of:
• Diagnostic Support Tools
AI models that analyze patient data to assist doctors in making accurate diagnoses.
• Personalized Medicine Solutions
Systems that predict individual patient responses to medications, enabling tailored treatment plans and minimizing adverse effects.  
• Drug Interaction Prediction Systems
Models that identify potential harmful interactions between drugs, improving patient safety.
• Dosage Optimization Systems
AI that calculates the optimal dosage for each patient based on their specific characteristics.  
By leveraging the power and flexibility of TensorFlow and PyTorch, developers can create AI-driven systems that have the potential to revolutionize medicine prescription, leading to more accurate, safe, and effective healthcare.
Database Layer: A MySQL-based backend for storing patient records, inventory data, and financial transactions.
MySQL was choice for this system for several reasons, especially because it was used as part of a broader tech stack. Here's why it was considered ideal:
• Structured Data Storage
Medical prescriptions, patient records, and drug information are highly structured data. MySQL, being a relational database, is well-suited to store and manage this type of structured data efficiently using tables and relationships.

• Reliability and Maturity
MySQL is a mature, stable, and widely used database system. Its reliability is crucial in healthcare systems where data integrity and availability are critical.

• Fast Query Performance
For AI systems to make real-time or near-real-time decisions (e.g., recommending a prescription), fast data retrieval is essential. MySQL is optimized for quick read operations, especially when indexing is properly used.

• Integration with AI Tools
MySQL integrates easily with programming languages like Python, which is commonly used in AI development. AI models can fetch data from MySQL for training or inference, and then write back predictions or recommendations.
Backend: Flask (Python): As already mentioned, Flask is a lightweight and flexible microframework well-suited for building web applications and APIs. Its simplicity and extensive libraries make it a strong contender, especially if the development team has Python expertise.
Flask is used to develop the backend of this system. Flask is a lightweight web framework written in python. It is ideal for this system because it provides the right balance of simplicity, flexibility, and extensibility needed to develop a secure, responsive, and intelligent backend for an AI-assisted medicine prescription system. It also provides;

1. Seamless AI/ML Integration:
   Flask is written in Python, which is the dominant language for AI and machine learning. This makes it easy to integrate trained models from libraries like TensorFlow, PyTorch directly into the backend, enabling real-time predictions and recommendations.
2. Microframework Flexibility:
   Flask is a microframework, meaning it provides the core tools needed to build a web application without imposing strict architectural patterns. This is especially useful in prototyping and scaling medical AI systems, where flexibility and quick iteration are critical.
3. RESTful API Support:
   Flask excels at building RESTful APIs, which are essential for enabling communication between the AI model, frontend interfaces (web/mobile apps), and external EHR (Electronic Health Record) systems. Flask-RESTful or Flask-RESTX can help structure API endpoints cleanly.
4. Testing and Debugging:
   Flask provides robust support for unit testing and has a built-in debugger, which is vital for ensuring the accuracy and reliability of an AI prescription system where mistakes can be life-threatening.
5. Ecosystem and Community:
   Flask has a large, active community and rich ecosystem of extensions (e.g., Flask-SQLAlchemy for ORM, Flask-CORS for cross-origin access), which speeds up development and ensures long-term support.

• 3.8.2 Control Flow and Process Design
Flowcharts and activity diagrams were used to detail the processes within the system, such as data entry, inventory management, and patient data retrieval. Sequence diagrams illustrated the interaction between different components, showing how data moves from user input through the AI modules to the database.
• 3.8.3 Design for Non-Functional Requirements
The system incorporates security strategies such as encryption for data at rest and in transit. Error-handling mechanisms ensure that any discrepancies in data input or system operations are logged and resolved automatically. Scalability was also considered, allowing for future upgrades without major overhauls.
3.9 Physical Design
The physical design focuses on the specific hardware, software, and network platforms used:
• 3.9.1 Database Design
The physical structure of the database was designed using MySQL. Key tables include:
o Customer Table: Stores patient information, including personal details and prescription history.
o Inventory Table: Tracks the stock of medications, along with predictive analytics data for restocking.
o Transactions Table: Logs sales, prescriptions filled, and inventory updates.
• 3.9.2 User Interface Design
The user interface was designed with simplicity in mind. Wireframes were created to visualize the layout of the user dashboard, patient record screens, and inventory management pages. Tools like Adobe XD and InVision were used to prototype the interface.
Index Page

Login Page

Home Page

Admin Page

Table Data Results

Section 1: Personal and Professional Information
Role in Pharmacy Number of Respondents
Pharmacist 15
Cashier 10
Administrator 5
Other (e.g., Technician) 8
Years of Experience Number of Respondents
0–2 years 12
3–5 years 18
6+ years 8

Section 2: Current System Usage
Record Management Method Number of Respondents
Manually (paper-based) 20
Digitally (computerized) 10
Combination of both 8
Inventory Management Method Number of Respondents
Manual tracking 18
Using software tools 12
Other (e.g., hybrid) 8

Issue Frequency (Scale 1–5) 1 2 3 4 5
Prescription errors 5 8 12 10 3
Stockouts or overstocking 4 6 14 10 4
Slow patient record retrieval 6 7 10 12 3
Data duplication or loss 8 10 10 8 2

Major Challenges Mentioned Frequency
Prescription errors 12
Time-consuming record management 15
Stock management issues 14
Data security concerns 8

Section 3: Features and Expectations
Desired Features Number of Respondents
Automated inventory management 25
Prescription verification 20
Patient history retrieval 18
Predictive analytics for stock management 15
Secure data storage and encryption 22
Automated reporting 18
Importance of Real-time Data Access Number of Respondents
Not important 3
Moderately important 15
Very important 20
System Aspects Importance (Scale 1–5) 1 2 3 4 5
Ease of use 3 5 10 12 8
System reliability 2 4 8 14 10
Data security 1 3 5 10 19
Integration with existing systems 2 5 7 13 11

Section 4: Training and Support
Training Requirement Number of Respondents
Yes 25
No 5
Not sure 8
Preferred Training Type Number of Respondents
Hands-on workshops 20
Online tutorials and documentation 15
One-on-one sessions 8
Comfort with Technology Number of Respondents
Very comfortable 18
Somewhat comfortable 15
Not comfortable 5

Section 5: Feedback and Suggestions
Concerns About Implementation Frequency
Cost 15
Training and onboarding time 12
System reliability 10
Data migration challenges 8
Suggested Workflow Improvements Frequency
Streamlining inventory management 18
Faster record retrieval 15
Better security measures 10
Automated error detection 12
Additional Comments or Suggestions Frequency
Need for user-friendly interfaces 18
Emphasis on training and support 15
Scalability for future needs 10

Bar graphs Representing Data
