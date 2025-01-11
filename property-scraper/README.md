# Mecklenburg County Property Scraper

A Python script to scrape property tax data from the Mecklenburg County tax office website (https://cao.mecknc.gov/) for properties within a 2-mile radius of 4116 Tipperary Place, Charlotte NC 28215.

## Features

- Uses Selenium for web scraping
- Calculates property distances using geopy
- Saves results to CSV file
- Runs in headless browser mode
- Handles errors gracefully

## Setup

1. Install Python 3.8 or higher

2. Install Chrome browser if not already installed

3. Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

4. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

Run the script:
```bash
python scraper.py
```

The script will:
1. Search for the target address
2. Calculate coordinates
3. Scrape property data
4. Save results to a CSV file named `property_data_[timestamp].csv`

## Output Data

The script collects the following data points for each property:
- Address
- Owner
- Parcel ID
- Land Value
- Building Value
- Total Value
- Last Sale Price
- Last Sale Date
- Year Built
- Square Feet
- Tax District
- Scrape Date

## Notes

- Please be respectful of the website's resources and avoid making too many requests in a short time
- This tool is for educational purposes only
- Some properties may not have complete data available
