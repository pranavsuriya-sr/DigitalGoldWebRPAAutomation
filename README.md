# Digital Gold Tracker

A modern web application for tracking and visualizing digital gold price trends with real-time Firebase integration.

## Features

### 📊 Entry Page
- **Data Input Form**: Add gold rates with date selection
- **Real-time Validation**: Input validation for gold rates
- **Firebase Integration**: Automatic data storage to Firebase Realtime Database
- **Success/Error Feedback**: Clear user feedback for data operations

### 📈 Graph Page
- **Interactive Charts**: Beautiful area charts using Recharts library
- **Time Period Toggles**: Switch between day, week, and month views
- **Price Change Indicators**: Visual indicators for price increases (green ↗) and decreases (red ↘)
- **Hover Tooltips**: Detailed information on hover including price changes and percentages
- **Current Rate Dialog**: Click on today's rate for detailed information
- **Responsive Design**: Works perfectly on all device sizes

## Technology Stack

- **Frontend**: React 18 with modern hooks
- **Routing**: React Router DOM for navigation
- **Styling**: Modern CSS with glassmorphism effects
- **Charts**: Recharts for beautiful data visualization
- **Database**: Firebase Realtime Database
- **Date Handling**: date-fns for efficient date operations

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd digitalGold
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Firebase Configuration

The application is already configured with the provided Firebase credentials:
- **Project ID**: appdevjaiproj
- **Database URL**: *
- **API Key**: *

The Firebase configuration is located in `src/firebase.js`.

## Usage

### Adding Gold Rate Data
1. Navigate to the "Add Data" page
2. Select a date (defaults to today)
3. Enter the gold rate per gram in Indian Rupees (₹)
4. Click "Save Gold Rate" to store the data

### Viewing Trends
1. Navigate to the "View Trends" page
2. Use the time period toggles (Day/Week/Month) to filter data
3. Hover over chart points to see detailed information
4. Click on today's rate to view detailed information in a dialog

## Project Structure

```
digitalGold/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── EntryPage.js      # Data entry form
│   │   └── GraphPage.js      # Chart visualization
│   ├── firebase.js           # Firebase configuration
│   ├── App.js               # Main app with routing
│   ├── index.js             # React entry point
│   └── index.css            # Global styles
├── package.json
└── README.md
```

## Features in Detail

### Modern UI/UX
- **Glassmorphism Design**: Modern glass-like effects with backdrop blur
- **Gradient Backgrounds**: Beautiful gradient backgrounds
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Works on desktop, tablet, and mobile

### Data Visualization
- **Area Charts**: Smooth area charts with gradient fills
- **Interactive Tooltips**: Rich tooltips with price change information
- **Color-coded Changes**: Green for increases, red for decreases
- **Time-based Filtering**: Filter data by different time periods

### Firebase Integration
- **Real-time Updates**: Data updates in real-time across all users
- **Efficient Storage**: Optimized data structure for quick retrieval
- **Error Handling**: Comprehensive error handling for network issues

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests

## License

This project is open source and available under the MIT License. 