"""
Test cases for the disease prediction model.
Each test case includes:
- Description: Natural language description of symptoms
- Expected symptoms: Set of symptoms that should be detected
- Expected diseases: List of expected diseases (optional)
"""

TEST_CASES = [
    {
        "description": "I've had a high fever for the past 3 days, along with a severe headache and body aches. My throat is sore and I'm coughing a lot. I feel extremely tired and have no energy.",
        "expected_symptoms": {'fever', 'headache', 'body ache', 'sore throat', 'cough', 'fatigue'},
        "expected_diseases": ['flu', 'common cold', 'COVID-19']
    },
    {
        "description": "I'm experiencing shortness of breath and chest pain. My heart is racing and I feel dizzy. I've also been sweating a lot.",
        "expected_symptoms": {'shortness of breath', 'chest pain', 'palpitations', 'dizziness', 'sweating'},
        "expected_diseases": ['heart failure', 'anxiety', 'pulmonary fibrosis']
    },
    {
        "description": "I've been having severe abdominal pain and bloating. I feel nauseous and have been vomiting. I can't eat anything and I'm losing weight.",
        "expected_symptoms": {'abdominal pain', 'bloating', 'nausea', 'vomiting', 'appetite loss', 'weight loss'},
        "expected_diseases": ['gastritis', 'ulcer', 'gastroenteritis']
    },
    {
        "description": "My joints are really hurting, especially my knees and wrists. I feel stiff in the morning and I'm always tired. I've also noticed some swelling in my hands.",
        "expected_symptoms": {'joint pain', 'fatigue', 'swollen hands'},
        "expected_diseases": ['rheumatoid arthritis', 'osteoarthritis', 'lupus']
    },
    {
        "description": "I've been having trouble sleeping and I'm always anxious. I feel depressed and can't concentrate. I've lost interest in things I used to enjoy.",
        "expected_symptoms": {'anxiety', 'depression', 'memory loss'},
        "expected_diseases": ['depression', 'anxiety disorder', 'bipolar disorder']
    },
    {
        "description": "I've been having frequent urination and burning when I pee. I also have a fever and feel tired. My lower back hurts.",
        "expected_symptoms": {'frequent urination', 'burning urination', 'fever', 'fatigue', 'back pain'},
        "expected_diseases": ['urinary tract infection', 'prostatitis', 'kidney infection']
    },
    {
        "description": "I've been having severe headaches and sensitivity to light. I feel nauseous and sometimes vomit. The pain is usually on one side of my head.",
        "expected_symptoms": {'headache', 'sensitivity to light', 'nausea', 'vomiting'},
        "expected_diseases": ['migraine', 'cluster headache', 'tension headache']
    },
    {
        "description": "I've been having trouble breathing and a persistent cough. I feel tired and have lost my appetite. I've also been having night sweats.",
        "expected_symptoms": {'shortness of breath', 'cough', 'fatigue', 'appetite loss', 'night sweats'},
        "expected_diseases": ['tuberculosis', 'pneumonia', 'lung cancer']
    },
    {
        "description": "I've been having severe stomach pain and diarrhea. I feel bloated and gassy. I've lost my appetite and I'm losing weight.",
        "expected_symptoms": {'abdominal pain', 'diarrhea', 'bloating', 'appetite loss', 'weight loss'},
        "expected_diseases": ['irritable bowel syndrome', 'celiac disease', 'inflammatory bowel disease']
    },
    {
        "description": "I've been having trouble swallowing and my voice is hoarse. I've lost my appetite and I'm losing weight. I feel tired all the time.",
        "expected_symptoms": {'difficulty swallowing', 'hoarseness', 'appetite loss', 'weight loss', 'fatigue'},
        "expected_diseases": ['esophageal cancer', 'thyroid disorder', 'gastroesophageal reflux disease']
    }
]

# Test cases with negation
NEGATION_TEST_CASES = [
    {
        "description": "I have a headache and fatigue, but no fever or cough. I'm not experiencing any shortness of breath.",
        "expected_symptoms": {'headache', 'fatigue'},
        "expected_diseases": ['migraine', 'tension headache', 'depression']
    },
    {
        "description": "I'm feeling nauseous and have abdominal pain, but I haven't been vomiting. I don't have a fever or diarrhea.",
        "expected_symptoms": {'nausea', 'abdominal pain'},
        "expected_diseases": ['gastritis', 'ulcer', 'gastroesophageal reflux disease']
    }
]

# Test cases with misspellings and colloquial language
CASUAL_TEST_CASES = [
    {
        "description": "I got a real bad hedake and my throte hurts. I'm feelin real tired and my body aches all over.",
        "expected_symptoms": {'headache', 'sore throat', 'fatigue', 'body ache'},
        "expected_diseases": ['flu', 'common cold', 'COVID-19']
    },
    {
        "description": "My tummy hurts and I feel like I'm gonna throw up. I got the runs real bad and I'm feelin weak.",
        "expected_symptoms": {'abdominal pain', 'nausea', 'diarrhea', 'fatigue'},
        "expected_diseases": ['gastroenteritis', 'food poisoning', 'irritable bowel syndrome']
    }
]

# Test cases with multiple symptoms and complex descriptions
COMPLEX_TEST_CASES = [
    {
        "description": "For the past week, I've been experiencing a combination of symptoms. I have a persistent dry cough that's worse at night, along with shortness of breath when I try to exercise. I've also noticed that I'm more tired than usual and have lost my appetite. Sometimes I wake up in the middle of the night sweating, and I've lost about 5 pounds without trying. My chest feels tight, and I occasionally feel dizzy when I stand up quickly.",
        "expected_symptoms": {'cough', 'shortness of breath', 'fatigue', 'appetite loss', 'night sweats', 'weight loss', 'chest pain', 'dizziness'},
        "expected_diseases": ['tuberculosis', 'pneumonia', 'lung cancer']
    },
    {
        "description": "I've been having a really rough time lately. My joints, especially my knees and wrists, are constantly hurting and feel stiff, particularly in the morning. I'm always exhausted, even after a full night's sleep, and I've noticed some swelling in my hands and feet. I've been having trouble concentrating at work, and I feel depressed most of the time. I've also been experiencing frequent headaches and sensitivity to light. My appetite has decreased, and I've lost about 10 pounds in the last month.",
        "expected_symptoms": {'joint pain', 'fatigue', 'swollen hands', 'swollen feet', 'memory loss', 'depression', 'headache', 'sensitivity to light', 'appetite loss', 'weight loss'},
        "expected_diseases": ['rheumatoid arthritis', 'lupus', 'fibromyalgia']
    }
] 