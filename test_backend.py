import requests
import json

def test_backend():
    base_url = "http://localhost:3000/api"
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend returned error")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    # Test 2: Test generate exam endpoint (without auth)
    try:
        test_data = {
            "maMonHoc": "test-subject",
            "tenDeThi": "Test Exam",
            "matrix": [
                {
                    "maPhan": "test-chapter",
                    "clo1": 1,
                    "clo2": 0,
                    "clo3": 0,
                    "clo4": 0,
                    "clo5": 0
                }
            ],
            "hoanViDapAn": False,
            "soLuongDe": 1
        }
        
        response = requests.post(
            f"{base_url}/de-thi/generate-clo",
            json=test_data,
            timeout=10
        )
        print(f"Generate exam test: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 401:
            print("⚠️ Authentication required - this is expected")
        elif response.status_code == 400:
            print("⚠️ Bad request - this might be expected due to test data")
        else:
            print(f"Status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing generate exam: {e}")
    
    return True

if __name__ == "__main__":
    test_backend()
