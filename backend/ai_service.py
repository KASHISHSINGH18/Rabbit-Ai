import os
import pandas as pd
import google.generativeai as genai

def generate_summary(df: pd.DataFrame) -> str:
    """
    Takes a pandas DataFrame with sales data, converts a sample of it to string,
    and sends it to the Gemini API to get an executive summary.
    """
    # Configure Gemini API
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY environment variable not set. Returning dummy summary.")
        return "This is a dummy summary. To get an actual AI summary, provide a GEMINI_API_KEY environment variable."

    genai.configure(api_key=api_key)

    # Convert the DataFrame to a string representation for the AI context
    # Use head() or sample to reduce payload size to avoid blowing up token limits
    data_sample = df.head(100).to_string(index=False)
    
    # We create a prompt to instruct the AI
    prompt = f"""
    Analyze the following sales dataset and generate a short executive summary including:
    - top performing product category
    - best performing region
    - revenue insights
    - trends or anomalies
    
    Sales Data Sample:
    {data_sample}
    """
    
    # Initialize the generative model
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {str(e)}")
