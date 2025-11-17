from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
except ImportError:
    print("Please install: pip install google-generativeai python-dotenv")
    exit(1)

MEDICAL_PROMPT = """You are a medical conversation analyzer. Extract ALL medical information from this conversation.

CRITICAL: Extract even if text is simple like "fever for 2 days" or "cold for 2 days".

Return ONLY valid JSON (no other text):
{
    "diseases_and_conditions": [
        {
            "name": "disease/condition name",
            "severity": "mild/moderate/severe/not specified",
            "mentioned_by": "doctor/patient/both"
        }
    ],
    "symptoms": [
        {
            "symptom": "symptom description",
            "duration": "duration if mentioned",
            "severity": "severity if mentioned"
        }
    ],
    "important_treatment_points": [
        {
            "category": "medication/diagnosis/history/vitals/instructions/lifestyle/other",
            "point": "detailed description",
            "priority": "high/medium/low"
        }
    ],
    "medications": [
        {
            "name": "medication name",
            "dosage": "dosage if mentioned",
            "frequency": "frequency if mentioned",
            "type": "current/prescribed/discontinued"
        }
    ],
    "allergies": [],
    "medical_history": [],
    "follow_up": {
        "required": false,
        "timeframe": "timeframe if mentioned",
        "instructions": "follow-up instructions"
    },
    "red_flags": [],
    "summary": "Brief clinical summary"
}

Conversation:
"""

MEDICINE_VERIFICATION_PROMPT = """You are a SENIOR MEDICAL DOCTOR reviewing a prescription for safety and appropriateness.

PATIENT INFORMATION:
Name: {patient_name}
Age: {patient_age}
Symptoms: {symptoms}
Diagnosed Conditions: {conditions}
Medical History: {medical_history}
Known Allergies: {allergies}

PROPOSED PRESCRIPTION:
{prescribed_medicines}

PERFORM COMPREHENSIVE REVIEW:
1. Age-appropriateness of each medicine and dosage
2. Contraindications with patient's conditions
3. Allergy cross-reactions
4. Drug-drug interactions
5. Dosage safety for patient's age
6. Any red flags or safety concerns

Return ONLY valid JSON (no other text):
{{
    "overall_safety": "safe/caution/unsafe",
    "can_prescribe": true/false,
    "verification_summary": "Brief professional summary",
    "medicine_reviews": [
        {{
            "medicine_name": "medicine name",
            "status": "approved/caution/rejected",
            "reason": "detailed professional reasoning",
            "age_appropriate": true/false,
            "contraindications": [],
            "alternatives_if_rejected": []
        }}
    ],
    "drug_interactions": [
        {{
            "medicines": ["med1", "med2"],
            "interaction_type": "mild/moderate/severe",
            "description": "interaction details",
            "recommendation": "clinical recommendation"
        }}
    ],
    "dosage_concerns": [
        {{
            "medicine": "medicine name",
            "concern": "specific concern",
            "recommended_adjustment": "adjustment needed"
        }}
    ],
    "red_flags": [],
    "recommendations": [],
    "senior_doctor_notes": "Additional clinical guidance"
}}
"""


class MedicalConversationAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in .env file")
        
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
            print("✅ Medical Analyzer initialized")
        except Exception as e:
            print(f"❌ Error initializing Google AI: {e}")
            self.model = None

    def analyze(self, conversation_text: str) -> Dict[str, Any]:
        if not self.model:
            return {
                "error": "AI model not initialized",
                "diseases_and_conditions": [],
                "symptoms": [],
                "important_treatment_points": []
            }

        try:
            if not conversation_text or len(conversation_text.strip()) < 10:
                return {
                    "error": "Conversation text too short",
                    "diseases_and_conditions": [],
                    "symptoms": []
                }

            prompt = MEDICAL_PROMPT + "\n" + conversation_text
            
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            
            result = json.loads(response_text)
            
            print(f"✅ Analysis successful - Found {len(result.get('diseases_and_conditions', []))} diseases")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"Response was: {response_text[:200]}")
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "raw_response": response_text[:500],
                "diseases_and_conditions": [],
                "symptoms": []
            }
        except Exception as e:
            print(f"❌ Analysis Error: {str(e)}")
            return {
                "error": str(e),
                "diseases_and_conditions": [],
                "symptoms": []
            }

    def get_simple_format(self, conversation_text: str) -> Dict[str, Any]:
        full_analysis = self.analyze(conversation_text)
        
        if "error" in full_analysis and full_analysis.get("error"):
            print(f"Analysis had error: {full_analysis['error']}")
        
        return {
            "diseases": [
                disease["name"] 
                for disease in full_analysis.get("diseases_and_conditions", [])
            ],
            "symptoms": [
                symptom["symptom"] 
                for symptom in full_analysis.get("symptoms", [])
            ],
            "key_treatment_points": [
                point["point"] 
                for point in full_analysis.get("important_treatment_points", [])
                if point.get("priority") in ["high", "medium"]
            ],
            "medications_prescribed": [
                f"{med['name']} - {med.get('dosage', 'dosage not specified')}"
                for med in full_analysis.get("medications", [])
                if med.get("type") == "prescribed"
            ],
            "follow_up_required": full_analysis.get("follow_up", {}).get("required", False),
            "follow_up_timeframe": full_analysis.get("follow_up", {}).get("timeframe", ""),
            "red_flags": full_analysis.get("red_flags", []),
            "summary": full_analysis.get("summary", ""),
            "all_medications": [
                f"{med['name']} - {med.get('dosage', 'dosage not specified')}"
                for med in full_analysis.get("medications", [])
            ],
            "medical_history": full_analysis.get("medical_history", []),
            "allergies": full_analysis.get("allergies", [])
        }


class MedicineVerificationAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in .env file")
        
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
            print("✅ Senior Doctor Verification Agent initialized")
        except Exception as e:
            print(f"❌ Error initializing Verification Agent: {e}")
            self.model = None

    def verify_prescription(
        self,
        prescribed_medicines: List[str],
        patient_name: str,
        patient_age: int,
        symptoms: List[str],
        conditions: List[str],
        medical_history: List[str] = None,
        allergies: List[str] = None
    ) -> Dict[str, Any]:
        
        if not self.model:
            return {"error": "AI model not initialized", "can_prescribe": False}

        try:
            medicines_text = "\n".join([f"- {med}" for med in prescribed_medicines])
            symptoms_text = "\n".join([f"- {sym}" for sym in symptoms]) if symptoms else "Not specified"
            conditions_text = "\n".join([f"- {cond}" for cond in conditions]) if conditions else "Not specified"
            history_text = "\n".join([f"- {h}" for h in (medical_history or ["None reported"])])
            allergies_text = "\n".join([f"- {a}" for a in (allergies or ["None known"])])

            prompt = MEDICINE_VERIFICATION_PROMPT.format(
                patient_name=patient_name,
                patient_age=patient_age,
                symptoms=symptoms_text,
                conditions=conditions_text,
                medical_history=history_text,
                allergies=allergies_text,
                prescribed_medicines=medicines_text
            )
            
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            
            result = json.loads(response_text)
            print(f"✅ Verification complete - Safety: {result.get('overall_safety')}")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"Response was: {response_text[:200]}")
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "can_prescribe": False
            }
        except Exception as e:
            print(f"❌ Verification Error: {str(e)}")
            return {"error": str(e), "can_prescribe": False}


_analyzer = None
_verifier = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        _analyzer = MedicalConversationAnalyzer()
    return _analyzer

def get_verifier():
    global _verifier
    if _verifier is None:
        _verifier = MedicineVerificationAgent()
    return _verifier