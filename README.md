# 📅 DTU SlotWise

![React](https://img.shields.io/badge/React-19-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css) ![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)

**DTU SlotWise** is a specialized tool designed to transform cluttered university timetable images or PDFs into a clean, personalized schedule. By leveraging the **Google Gemini Pro Vision** model, it extracts raw grid data and filters it specifically for your course codes and lab groups.

## 🚀 Features

-   **AI Extraction**: Automatically parses complex, multi-row university timetable grids using Google's Generative AI.
-   **Smart Filtering**: Input your specific courses (e.g., `PE302, HU302`) and group (e.g., `G3`) to isolate only your relevant classes.
-   **Vertical & Horizontal Awareness**: Correctively handles multi-hour labs (horizontal spans) and stacked class information (vertical stacks).
-   **Export Ready**: Download your personalized schedule as an Excel sheet or PDF for offline access.
-   **Privacy First**: Processing happens in-browser with your own API key.

## 🛠️ Tech Stack

-   **Frontend**: React 19 with Vite for lightning-fast HMR.
-   **Styling**: Tailwind CSS 4 for a modern, responsive UI.
-   **Intelligence**: `@google/genai` for multi-modal image-to-JSON extraction.
-   **File Processing**: `pdfjs-dist` for PDF parsing and `xlsx` for spreadsheet generation.

## ⚙️ Installation & Setup

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/your-username/dtuslotwise.git
    cd dtuslotwise
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Usage**
    -   Obtain a free API Key from [Google AI Studio](https://aistudio.google.com/).
    -   Upload your timetable image or PDF.
    -   List your subjects and group identifier.
    -   Let Gemini do the heavy lifting!

## 📁 Project Structure

-   `src/utils/geminiProcessor.js`: Contains the logic for the AI prompt engineering and raw extraction.
-   `src/utils/timetableFilter.js`: Core logic for matching user course codes and group IDs (G1, P1, etc.) against extracted data.
-   `src/components/`: Modular UI components including `TimetableView` and `LandingPage`.

## 🧠 How it Works

1.  **Raw Extraction**: The `geminiProcessor` sends the images to Gemini with a strict system prompt to convert the visual grid into a standardized JSON array.
2.  **Normalization**: The system handles "|| " separators for multiple items in a single slot and replicates entries for spanned time slots (e.g., 10-12 becomes 10-11 and 11-12).
3.  **Regex Filtering**: The `timetableFilter` uses case-insensitive regular expressions to find matches for specific course codes and lab groups within the extracted text.

--- 
*Developed with ❤️ for students struggling with 100-page timetable PDFs.*
