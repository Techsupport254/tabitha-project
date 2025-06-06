# Expanded symptom synonym dictionary with more terms, layperson, medical, slang, and misspellings
symptom_synonyms = {
    'fever': {'fever', 'high temperature', 'pyrexia', 'hot', 'burning up', 'temperature', 'febrile', 'temp', 'feaver', 'running a fever', 'feverish'},
    'cough': {'cough', 'coughing', 'dry cough', 'wet cough', 'hacking cough', 'couph', 'koff', 'barking cough', 'persistent cough', 'tickle in throat'},
    'fatigue': {'fatigue', 'tiredness', 'exhaustion', 'lethargy', 'weakness', 'worn out', 'drained', 'sleepy', 'fatige', 'fatiguee', 'no energy', 'sluggish', 'wiped out', 'burned out'},
    'headache': {'headache', 'head pain', 'migraine', 'head ache', 'head hurts', 'head hurting', 'headach', 'head ake', 'pressure in head', 'pounding head', 'splitting headache'},
    'sore throat': {'sore throat', 'throat pain', 'throat soreness', 'pharyngitis', 'scratchy throat', 'raw throat', 'throat hurts', 'sorethroat', 'pain swallowing', 'difficulty swallowing', 'throat irritation'},
    'body ache': {'body ache', 'muscle pain', 'body pain', 'myalgia', 'aches', 'aching', 'muscle ache', 'muscle soreness', 'body hurts', 'body aching', 'all over pain', 'generalized pain'},
    'chills': {'chills', 'shivering', 'cold chills', 'rigors', 'goosebumps', 'shivers', 'chill', 'cold sweats', 'shaky', 'trembling'},
    'nausea': {'nausea', 'queasiness', 'sick feeling', 'upset stomach', 'nauseous', 'nauseaous', 'want to vomit', 'feeling sick', 'stomach turning'},
    'vomiting': {'vomiting', 'throwing up', 'puking', 'emesis', 'vomit', 'barfing', 'barf', 'retching', 'spitting up', 'heaving'},
    'diarrhea': {'diarrhea', 'loose stools', 'watery stools', 'bowel movement', 'runs', 'diarhea', 'diarrhoea', 'diarreah', 'frequent stools', 'liquid stool', 'bowel urgency'},
    'shortness of breath': {'shortness of breath', 'breathing difficulty', 'dyspnea', 'breathlessness', "can't breathe", 'hard to breathe', 'out of breath', 'short of breath', 'winded', 'gasping', 'labored breathing'},
    'chest pain': {'chest pain', 'chest discomfort', 'chest tightness', 'pain in chest', 'tight chest', 'chest hurts', 'pressure in chest', 'squeezing chest', 'chest burning'},
    'loss of taste': {'loss of taste', 'taste loss', 'ageusia', "can't taste", 'no taste', 'lost taste', 'food tastes bland', 'taste gone'},
    'loss of smell': {'loss of smell', 'smell loss', 'anosmia', "can't smell", 'no smell', 'lost smell', 'smell gone', "can't detect odors"},
    'congestion': {'congestion', 'nasal congestion', 'stuffy nose', 'blocked nose', 'congested', 'nose blocked', 'nose stuffed', 'sinus congestion', 'clogged nose'},
    'runny nose': {'runny nose', 'rhinorrhea', 'nasal discharge', 'nose running', 'runny', 'drippy nose', 'nose drip', 'leaky nose'},
    'sneezing': {'sneezing', 'sneezes', 'sneeze', 'sneezing fits', 'achoo', "can't stop sneezing"},
    'red eyes': {'red eyes', 'bloodshot eyes', 'conjunctivitis', 'pink eye', 'eye redness', 'red eye', 'irritated eyes', 'watery eyes'},
    'rash': {'rash', 'skin rash', 'eruption', 'hives', 'skin spots', 'skin bumps', 'rashes', 'itchy skin', 'red spots', 'welts'},
    'joint pain': {'joint pain', 'arthralgia', 'joint ache', 'pain in joints', 'aching joints', 'joint hurts', 'joint hurting', 'stiff joints', 'swollen joints'},
    'appetite loss': {'loss of appetite', 'no appetite', 'appetite loss', 'not hungry', "can't eat", "don't want to eat", 'skipping meals', 'eating less'},
    'bloating': {'bloating', 'bloated', 'swollen belly', 'swollen stomach', 'abdominal swelling', 'gassy', 'distended abdomen'},
    'abdominal pain': {'abdominal pain', 'stomach pain', 'belly pain', 'pain in abdomen', 'tummy ache', 'stomach ache', 'cramps', 'cramping', 'gut pain'},
    'burning urination': {'burning urination', 'burning when urinating', 'painful urination', 'dysuria', 'pee burns', 'burns to pee', 'pain peeing', 'stinging pee'},
    'constipation': {'constipation', 'hard stools', "can't poop", 'difficulty pooping', 'no bowel movement', 'infrequent stools', 'straining'},
    'weight loss': {'weight loss', 'losing weight', 'lost weight', 'unintentional weight loss', 'clothes loose', 'dropping pounds'},
    'night sweats': {'night sweats', 'sweating at night', 'sweat at night', 'nighttime sweating', 'wake up sweaty'},
    'swollen glands': {'swollen glands', 'swollen lymph nodes', 'lumps in neck', 'swollen neck', 'gland swelling', 'enlarged glands'},
    'dizziness': {'dizziness', 'dizzy', 'lightheaded', 'vertigo', 'faint', 'woozy', 'off balance', 'spinning'},
    'palpitations': {'palpitations', 'heart racing', 'heart pounding', 'skipped beats', 'fluttering heart', 'irregular heartbeat'},
    'swelling': {'swelling', 'swollen', 'edema', 'puffy', 'fluid retention', 'swollen ankles', 'swollen feet'},
    'bruising': {'bruising', 'bruises', 'easy bruising', 'purple marks', 'black and blue', 'hematoma'},
    'itching': {'itching', 'itchy', 'pruritus', 'scratchy', 'skin itching', 'need to scratch'},
    'bleeding': {'bleeding', 'bleed', 'blood loss', 'hemorrhage', 'bloody', 'bleeding out'},
    'tingling': {'tingling', 'pins and needles', 'numbness', 'prickling', 'tingly', 'asleep limb'},
    'blurred vision': {'blurred vision', 'blurry vision', 'vision loss', "can't see clearly", 'fuzzy vision', 'double vision'},
    'ear pain': {'ear pain', 'earache', 'pain in ear', 'ear hurts', 'ear infection'},
    'hearing loss': {'hearing loss', "can't hear", 'deafness', 'hard of hearing', 'lost hearing'},
    'back pain': {'back pain', 'pain in back', 'backache', 'sore back', 'stiff back', 'lower back pain'},
    'frequent urination': {'frequent urination', 'peeing a lot', 'urinating often', 'polyuria', 'going to bathroom often'},
    'incontinence': {'incontinence', 'leaking urine', "can't hold urine", 'urine leakage', 'wetting'},
    'hot flashes': {'hot flashes', 'hot flushes', 'sudden warmth', 'flushing', 'feeling hot suddenly'},
    'cold intolerance': {'cold intolerance', 'sensitive to cold', "can't stand cold", 'chilled easily'},
    'sensitivity to light': {'sensitivity to light', 'photophobia', 'light hurts eyes', "can't stand bright light"},
    'anxiety': {'anxiety', 'nervous', 'worried', 'panic', 'anxious', 'on edge', 'uneasy'},
    'depression': {'depression', 'depressed', 'sad', 'down', 'hopeless', 'blue', 'low mood'},
    'memory loss': {'memory loss', 'forgetful', "can't remember", 'amnesia', 'lost memory'},
    'confusion': {'confusion', 'confused', 'disoriented', "can't think clearly", 'mixed up'},
    'hallucinations': {'hallucinations', 'seeing things', 'hearing voices', 'delusions', 'false beliefs'},
    'seizures': {'seizures', 'fits', 'convulsions', 'epilepsy', 'shaking spells'},
    'fainting': {'fainting', 'passed out', 'blackout', 'lost consciousness', 'syncope'},
    'difficulty swallowing': {'difficulty swallowing', 'dysphagia', 'trouble swallowing', "can't swallow"},
    'hoarseness': {'hoarseness', 'hoarse voice', 'raspy voice', 'lost voice', 'voice change'},
    'mouth sores': {'mouth sores', 'canker sores', 'ulcers in mouth', 'mouth ulcers', 'sore in mouth'},
    'bad breath': {'bad breath', 'halitosis', 'smelly breath', 'breath smells'},
    'dry mouth': {'dry mouth', 'xerostomia', 'mouth feels dry', 'cotton mouth'},
    'excessive thirst': {'excessive thirst', 'very thirsty', 'polydipsia', "can't get enough to drink"},
    'excessive hunger': {'excessive hunger', 'very hungry', 'polyphagia', "can't stop eating"},
    'sweating': {'sweating', 'sweaty', 'perspiring', 'clammy', 'sweat a lot', 'profuse sweating'},
    'enlarged liver': {'enlarged liver', 'hepatomegaly', 'big liver', 'liver swelling'},
    'enlarged spleen': {'enlarged spleen', 'splenomegaly', 'big spleen', 'spleen swelling'},
    'jaundice': {'jaundice', 'yellow skin', 'yellow eyes', 'icterus'},
    'dark urine': {'dark urine', 'tea colored urine', 'brown urine', 'cola colored urine'},
    'pale stools': {'pale stools', 'clay colored stools', 'light stools', 'white stools'},
    'hair loss': {'hair loss', 'losing hair', 'balding', 'alopecia', 'thinning hair'},
    'swollen legs': {'swollen legs', 'leg swelling', 'puffy legs', 'edema in legs'},
    'swollen feet': {'swollen feet', 'foot swelling', 'puffy feet', 'edema in feet'},
    'swollen hands': {'swollen hands', 'hand swelling', 'puffy hands', 'edema in hands'},
    'swollen face': {'swollen face', 'face swelling', 'puffy face', 'edema in face'},
    'swollen abdomen': {'swollen abdomen', 'abdominal swelling', 'ascites', 'big belly'},
} 