import os
import time
import pandas as pd
from datetime import datetime
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

class PropertyScraper:
    def __init__(self):
        self.base_url = 'https://polaris3g.mecklenburgcountync.gov/'
        self.target_address = '4116 Tipperary Place, Charlotte NC 28215'
        self.radius_miles = 2
        self.results = []
        self.setup_driver()
        self.geolocator = Nominatim(user_agent='property_scraper')

    def setup_driver(self):
        """Initialize Selenium WebDriver with Chrome"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)

    def get_coordinates(self, address):
        """Get latitude and longitude for an address"""
        try:
            location = self.geolocator.geocode(address)
            if location:
                return (location.latitude, location.longitude)
        except Exception as e:
            print(f"Error geocoding address {address}: {e}")
        return None

    def is_within_radius(self, addr1_coords, addr2_coords):
        """Check if two addresses are within the specified radius"""
        if not addr1_coords or not addr2_coords:
            return False
        distance = geodesic(addr1_coords, addr2_coords).miles
        return distance <= self.radius_miles

    def search_property(self, address):
        """Search for a property on Polaris"""
        try:
            self.driver.get(self.base_url)
            # Close disclaimer if present
            try:
                close_button = self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//div[text()='Disclaimer']/..//button"))
                )
                close_button.click()
            except:
                pass

            # Enter address in search box
            search_box = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Enter address / parcel#']"))
            )
            search_box.clear()
            search_box.send_keys(address)

            # Wait for search results dropdown
            time.sleep(2)

            # Click on the first result if available
            try:
                result = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".search-result-item"))
                )
                result.click()
            except TimeoutException:
                print(f"No search results found for address: {address}")
                return False

            # Wait for property details to load
            time.sleep(2)
            return True
        except TimeoutException:
            print(f"Timeout while searching for address: {address}")
            return False
        except Exception as e:
            print(f"Error searching property {address}: {e}")
            return False

    def extract_property_data(self):
        """Extract property data from Polaris"""
        try:
            # Wait for property details to load
            time.sleep(2)

            # Click on property info tab if needed
            try:
                info_tab = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Property Info')]"))
                )
                info_tab.click()
            except:
                pass

            # Extract data from the info panel
            data = {
                'address': self.get_text_by_xpath("//div[contains(text(), 'Address')]/following-sibling::div"),
                'owner': self.get_text_by_xpath("//div[contains(text(), 'Owner')]/following-sibling::div"),
                'parcel_id': self.get_text_by_xpath("//div[contains(text(), 'Parcel ID')]/following-sibling::div"),
                'land_value': self.get_text_by_xpath("//div[contains(text(), 'Land Value')]/following-sibling::div"),
                'building_value': self.get_text_by_xpath("//div[contains(text(), 'Building Value')]/following-sibling::div"),
                'total_value': self.get_text_by_xpath("//div[contains(text(), 'Total Value')]/following-sibling::div"),
                'last_sale_price': self.get_text_by_xpath("//div[contains(text(), 'Sale Price')]/following-sibling::div"),
                'last_sale_date': self.get_text_by_xpath("//div[contains(text(), 'Sale Date')]/following-sibling::div"),
                'year_built': self.get_text_by_xpath("//div[contains(text(), 'Year Built')]/following-sibling::div"),
                'square_feet': self.get_text_by_xpath("//div[contains(text(), 'Square Feet')]/following-sibling::div"),
                'tax_district': self.get_text_by_xpath("//div[contains(text(), 'Tax District')]/following-sibling::div"),
                'scraped_date': datetime.now().strftime('%Y-%m-%d'),
                'coordinates': self.get_coordinates_from_map()
            }

            return data
        except Exception as e:
            print(f"Error extracting property data: {e}")
            return None

    def get_text_by_xpath(self, xpath):
        """Helper method to get text from an element by XPath"""
        try:
            element = self.driver.find_element(By.XPATH, xpath)
            return element.text.strip()
        except:
            return ''

    def get_coordinates_from_map(self):
        """Extract coordinates from the map"""
        try:
            # Switch to map view if needed
            map_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title='Map Tools']"))
            )
            map_button.click()

            # Wait for map to load
            time.sleep(2)

            # Get coordinates from map center
            script = """
            return {
                lat: window.map.getCenter().lat(),
                lng: window.map.getCenter().lng()
            }
            """
            coords = self.driver.execute_script(script)
            lat = coords['lat']
            lng = coords['lng']

            return (float(lat), float(lng))
        except Exception as e:
            print(f"Error getting coordinates: {e}")
            return None

    def find_nearby_properties(self, target_coords):
        """Find properties within radius using map tools"""
        try:
            # Use buffer tool for radius search
            buffer_tool = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title='Buffer']"))
            )
            buffer_tool.click()

            # Set buffer distance to 2 miles
            distance_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='number']"))
            )
            distance_input.clear()
            distance_input.send_keys("2")

            # Select miles as unit
            unit_select = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "select"))
            )
            unit_select.click()
            miles_option = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//option[text()='Miles']"))
            )
            miles_option.click()

            # Apply buffer
            apply_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title='Apply Buffer']"))
            )
            apply_button.click()

            # Get properties within buffer
            time.sleep(2)
            properties = []
            try:
                results_container = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".search-results"))
                )
                property_elements = results_container.find_elements(By.CSS_SELECTOR, ".result-item")
                for elem in property_elements:
                    addr = elem.find_element(By.CSS_SELECTOR, ".address").text
                    if addr != self.target_address:  # Skip target address
                        properties.append(addr)
            except:
                print("No properties found within buffer zone")

            return properties
        except Exception as e:
            print(f"Error finding nearby properties: {e}")
            return []

    def save_results(self):
        """Save scraped data to CSV file"""
        if not self.results:
            print("No results to save")
            return

        df = pd.DataFrame(self.results)
        filename = f'property_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        df.to_csv(filename, index=False)
        print(f"Results saved to {filename}")

    def run(self):
        """Main execution method"""
        print("Starting property data scraping...")

        # Search for target property first
        if self.search_property(self.target_address):
            data = self.extract_property_data()
            if data and data.get('coordinates'):
                self.results.append(data)
                print(f"Found target property at coordinates: {data['coordinates']}")

                # Find and process nearby properties
                nearby_addresses = self.find_nearby_properties(data['coordinates'])
                print(f"Found {len(nearby_addresses)} nearby properties")

                for addr in nearby_addresses:
                    if self.search_property(addr):
                        nearby_data = self.extract_property_data()
                        if nearby_data:
                            self.results.append(nearby_data)
                            print(f"Processed property: {addr}")
                        time.sleep(1)  # Be nice to the server

        self.save_results()
        print(f"Scraping completed. Found {len(self.results)} properties.")

    def cleanup(self):
        """Clean up resources"""
        if hasattr(self, 'driver'):
            self.driver.quit()

if __name__ == '__main__':
    scraper = PropertyScraper()
    try:
        scraper.run()
    finally:
        scraper.cleanup()
