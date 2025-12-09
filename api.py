# api.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from collections import OrderedDict

# ======================================================================
# 1. DATA LOADING AND PROCESSING
# ======================================================================
CSV_FILE_NAME = "Data.csv" 
GLOBAL_QA_DATA = {}

def load_and_structure_data(file_name):
    """Loads data from CSV and structures it once for the API."""
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(BASE_DIR, file_name)
    
    if not os.path.exists(file_path):
        print(f"FATAL ERROR: Data file '{file_name}' not found at {file_path}")
        return {}
    
    try:
        df = pd.read_csv(file_path)
        REQUIRED_COLS = ['subject', 'question', 'answer']
        if not all(col in df.columns for col in REQUIRED_COLS):
            print(f"FATAL ERROR: CSV must contain the columns: {', '.join(REQUIRED_COLS)}")
            return {}
        
        main_menu = OrderedDict() 
        sub_menus = {}
        grouped_data = df.groupby('subject')
        
        for subject, group in grouped_data:
            key = str(len(main_menu) + 1)
            main_menu[key] = subject
            
            sub_menu_questions = list(group['question'].values) 
            sub_menus[subject] = sub_menu_questions

        return {
            'main_menu': list(main_menu.values()), 
            'sub_menus': sub_menus,
            'qa_data_df': df 
        }

    except Exception as e:
        print(f"FATAL ERROR: Failed to load or process CSV data. Error: {e}")
        return {}

GLOBAL_QA_DATA = load_and_structure_data(CSV_FILE_NAME)


# ======================================================================
# 2. FASTAPI APP SETUP
# ======================================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================================
# 3. API ENDPOINTS
# ======================================================================

@app.get("/")
def read_root():
    return {"status": "PlotBot API is running!", "endpoints": ["/menu", "/questions/{subject}", "/answer?question={...}"]}

@app.get("/menu")
def get_main_menu():
    if 'main_menu' not in GLOBAL_QA_DATA:
        raise HTTPException(status_code=500, detail="API Data failed to load.")
    return GLOBAL_QA_DATA['main_menu']

@app.get("/questions/{subject}")
def get_sub_menu(subject: str):
    if 'sub_menus' not in GLOBAL_QA_DATA:
        raise HTTPException(status_code=500, detail="API Data failed to load.")
    
    questions = GLOBAL_QA_DATA['sub_menus'].get(subject)
    
    if questions is None:
        raise HTTPException(status_code=404, detail=f"Subject '{subject}' not found.")
    
    return questions

@app.get("/answer")
def get_fixed_answer(question: str):
    df = GLOBAL_QA_DATA.get('qa_data_df')
    if df is None or df.empty:
        raise HTTPException(status_code=500, detail="API Data failed to load.")
        
    try:
        answer_row = df[df['question'] == question]
        
        if not answer_row.empty:
            return {"question": question, "answer": answer_row.iloc[0]['answer']}
        
        return {"question": question, "answer": "I'm sorry, I could not find a specific answer for that question in my database."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")
