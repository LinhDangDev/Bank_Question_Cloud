import requests

try:
    response = requests.post(
        'http://localhost:3000/cau-hoi/with-answers',
        json={
            'question': {
                'MaPhan': '4f2a4873-890b-4b16-925d-b71de6d35433',
                'MaSoCauHoi': 1234,
                'NoiDung': 'Test question',
                'HoanVi': False,
                'CapDo': 1,
                'SoCauHoiCon': 0
            },
            'answers': [
                {
                    'NoiDung': 'Answer 1',
                    'ThuTu': 1,
                    'LaDapAn': True,
                    'HoanVi': False
                },
                {
                    'NoiDung': 'Answer 2',
                    'ThuTu': 2,
                    'LaDapAn': False,
                    'HoanVi': False
                }
            ]
        }
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
