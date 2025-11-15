from flask import Flask, request, jsonify
from flask_cors import CORS
from medical_analyzer import get_analyzer, get_verifier
import logging
import json

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/analyze-conversation', methods=['POST'])
def analyze_conversation():
    try:
        data = request.json
        conversation_text = data.get('conversation', '')
        
        logger.info(f"📥 Received conversation: {conversation_text[:100]}...")
        
        if not conversation_text.strip():
            return jsonify({
                "error": "No conversation text provided",
                "diseases": [],
                "symptoms": []
            }), 400
        
        analyzer = get_analyzer()
        result = analyzer.get_simple_format(conversation_text)
        
        logger.info(f"✅ Analysis complete - Diseases: {result.get('diseases', [])}")
        
        print("\n" + "="*60)
        print("MEDICAL ANALYSIS RESULT")
        print("="*60)
        print(json.dumps(result, indent=2))
        print("="*60 + "\n")
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e),
            "diseases": [],
            "symptoms": []
        }), 500

@app.route('/api/verify-prescription', methods=['POST'])
def verify_prescription():
    try:
        data = request.json
        
        prescribed_medicines = data.get('prescribed_medicines', [])
        patient_name = data.get('patient_name', 'Unknown')
        patient_age = data.get('patient_age', 0)
        symptoms = data.get('symptoms', [])
        conditions = data.get('conditions', [])
        medical_history = data.get('medical_history', [])
        allergies = data.get('allergies', [])
        
        logger.info(f"📥 Verification request for {patient_name}, Age: {patient_age}")
        logger.info(f"   Medicines: {prescribed_medicines}")
        
        if not prescribed_medicines:
            return jsonify({
                "error": "No medicines provided",
                "can_prescribe": False
            }), 400
        
        if patient_age < 1 or patient_age > 150:
            return jsonify({
                "error": "Invalid patient age",
                "can_prescribe": False
            }), 400
        
        verifier = get_verifier()
        result = verifier.verify_prescription(
            prescribed_medicines=prescribed_medicines,
            patient_name=patient_name,
            patient_age=patient_age,
            symptoms=symptoms,
            conditions=conditions,
            medical_history=medical_history,
            allergies=allergies
        )
        
        logger.info(f"✅ Verification complete - Can Prescribe: {result.get('can_prescribe')}")
        
        print("\n" + "="*60)
        print("PRESCRIPTION VERIFICATION RESULT")
        print("="*60)
        print(json.dumps(result, indent=2))
        print("="*60 + "\n")
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e),
            "can_prescribe": False
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    try:
        analyzer = get_analyzer()
        verifier = get_verifier()
        if analyzer and analyzer.model and verifier and verifier.model:
            return jsonify({"status": "ok", "analyzer": "ready", "verifier": "ready"}), 200
        else:
            return jsonify({"status": "error", "message": "Services not initialized"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Medical API Starting on port 5001...")
    print("Make sure GOOGLE_API_KEY is set in .env\n")
    app.run(debug=True, port=5001)