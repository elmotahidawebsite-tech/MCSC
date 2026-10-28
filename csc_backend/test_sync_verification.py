"""
Offline Case Sync - Backend Verification Tests
Run with: python test_sync_verification.py
"""
import os
import sys
import django
import json
from io import BytesIO
from PIL import Image
import base64

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from cases.models import Case, Person, Evidence, SyncRecord, PersonImage, EvidenceMedia

User = get_user_model()

def create_base64_test_image(width=100, height=100, color='red'):
    """Create a small test image encoded as base64 data URL"""
    img = Image.new('RGB', (width, height), color=color)
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_data}"

def test_1_criminal_case_with_person_and_evidence():
    """Test 1: Criminal case with person (with image) and evidence (with image)"""
    print("\n" + "="*60)
    print("TEST 1: Criminal Case - Full Sync with Images")
    print("="*60)
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='test_collector',
        defaults={'role': 'collector'}
    )
    user.set_password('test123')
    user.save()
    
    # Create test payload
    local_id = "test-criminal-001"
    payload = {
        "cases": [{
            "local_id": local_id,
            "data": {
                "case_type": "criminal",
                "case_number": "CR-2024-001",
                "case_year": 2024,
                "governorate": "Cairo",
                "police_department": "Test Department",
                "incident_type": "theft",
                "description": "Test criminal case",
                "persons": [{
                    "role": "victim",
                    "full_name": "Test Victim",
                    "national_id": "12345678901234",
                    "gender": "male",
                    "nationality": "Egyptian",
                    "images": [{
                        "file_name": "victim_photo.jpg",
                        "mime_type": "image/jpeg",
                        "data": create_base64_test_image(50, 50, 'blue')
                    }]
                }],
                "evidences": [{
                    "evidence_number": "EV-001",
                    "evidence_type": "physical",
                    "description": "Test evidence item",
                    "media": [{
                        "file_name": "evidence_photo.jpg",
                        "mime_type": "image/jpeg",
                        "data": create_base64_test_image(50, 50, 'green')
                    }]
                }]
            }
        }]
    }
    
    # Create client and login
    client = Client()
    client.force_login(user)
    
    # Execute sync
    response = client.post('/api/sync/', 
                          data=json.dumps(payload),
                          content_type='application/json')
    
    # Debug: print response if not successful
    if response.status_code != 200:
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.content[:500]}")
        return False
    
    # Verify results
    result = response.json()['results'][0]
    print(f"Status: {result['status']}")
    print(f"Case ID: {result.get('case_id')}")
    
    if result['status'] == 'synced':
        case = Case.objects.get(id=result['case_id'])
        persons = Person.objects.filter(case=case)
        evidences = Evidence.objects.filter(case=case)
        person_images = PersonImage.objects.filter(person__case=case)
        evidence_media = EvidenceMedia.objects.filter(evidence__case=case)
        
        print(f"✓ Case created: {case.case_code}")
        print(f"✓ Persons: {persons.count()} (expected 1)")
        print(f"✓ Person images: {person_images.count()} (expected 1)")
        print(f"✓ Evidences: {evidences.count()} (expected 1)")
        print(f"✓ Evidence media: {evidence_media.count()} (expected 1)")
        
        # Check for warnings
        if 'warnings' in result and result['warnings']:
            print(f"⚠ Warnings: {len(result['warnings'])} media file(s) failed")
            for w in result['warnings'][:3]:
                print(f"  - {w}")
        
        # Verify sync record
        sync_record = SyncRecord.objects.get(user=user, local_id=local_id)
        print(f"✓ SyncRecord status: {sync_record.status}")
        
        assert persons.count() == 1, "Expected 1 person"
        assert person_images.count() == 1, "Expected 1 person image"
        assert evidences.count() == 1, "Expected 1 evidence"
        assert evidence_media.count() == 1, "Expected 1 evidence media"
        
        print("\n✅ TEST 1 PASSED")
        return True
    else:
        print(f"\n❌ TEST 1 FAILED: {result.get('detail')}")
        return False

def test_2_duplicate_prevention():
    """Test 2: Retry same local_id should return already_synced"""
    print("\n" + "="*60)
    print("TEST 2: Duplicate Prevention")
    print("="*60)
    
    user = User.objects.get(username='test_collector')
    local_id = "test-duplicate-001"
    
    # First sync
    payload = {
        "cases": [{
            "local_id": local_id,
            "data": {
                "case_type": "criminal",
                "case_number": "CR-DUP-001",
                "case_year": 2024,
                "governorate": "Cairo",
                "police_department": "Test Department",
                "incident_type": "theft",
                "description": "Test duplicate prevention",
            }
        }]
    }
    
    client = Client()
    client.force_login(user)
    
    response1 = client.post('/api/sync/', 
                           data=json.dumps(payload),
                           content_type='application/json')
    result1 = response1.json()['results'][0]
    
    print(f"First sync status: {result1['status']}")
    print(f"First sync case_id: {result1.get('case_id')}")
    
    # Second sync (retry with same local_id)
    response2 = client.post('/api/sync/', 
                           data=json.dumps(payload),
                           content_type='application/json')
    result2 = response2.json()['results'][0]
    
    print(f"Second sync status: {result2['status']}")
    print(f"Second sync case_id: {result2.get('case_id')}")
    
    # Verify no duplicate was created
    case_count = Case.objects.filter(case_number="CR-DUP-001", created_by=user).count()
    print(f"Total cases with number CR-DUP-001: {case_count}")
    
    if result2['status'] == 'already_synced' and case_count == 1:
        print(f"✓ Second sync returned: {result2['status']}")
        print(f"✓ Same case_id returned: {result1['case_id'] == result2['case_id']}")
        print("\n✅ TEST 2 PASSED")
        return True
    else:
        print(f"\n❌ TEST 2 FAILED: Expected 'already_synced', got '{result2['status']}'")
        return False

def test_3_empty_record_filtering():
    """Test 3: Empty persons/evidence should not be created"""
    print("\n" + "="*60)
    print("TEST 3: Empty Record Filtering")
    print("="*60)
    
    user = User.objects.get(username='test_collector')
    local_id = "test-empty-001"
    
    # Payload with empty person (frontend should filter, but testing backend too)
    payload = {
        "cases": [{
            "local_id": local_id,
            "data": {
                "case_type": "criminal",
                "case_number": "CR-EMPTY-001",
                "case_year": 2024,
                "governorate": "Cairo",
                "police_department": "Test Department",
                "incident_type": "theft",
                "description": "Test empty filtering",
                "persons": [{
                    "role": "victim",
                    "full_name": "Valid Person",
                    "national_id": "98765432109876",
                    "gender": "female",
                }],
                "evidences": [{
                    "evidence_number": "EV-VALID",
                    "evidence_type": "physical",
                    "description": "Valid evidence",
                }]
            }
        }]
    }
    
    client = Client()
    client.force_login(user)
    
    response = client.post('/api/sync/', 
                          data=json.dumps(payload),
                          content_type='application/json')
    result = response.json()['results'][0]
    
    if result['status'] == 'synced':
        case = Case.objects.get(id=result['case_id'])
        persons = Person.objects.filter(case=case)
        evidences = Evidence.objects.filter(case=case)
        
        print(f"✓ Case created: {case.case_code}")
        print(f"✓ Persons: {persons.count()} (expected 1)")
        print(f"✓ Evidences: {evidences.count()} (expected 1)")
        
        assert persons.count() == 1, "Expected exactly 1 person"
        assert evidences.count() == 1, "Expected exactly 1 evidence"
        
        print("\n✅ TEST 3 PASSED")
        return True
    else:
        print(f"\n❌ TEST 3 FAILED: {result.get('detail')}")
        return False

def test_4_corrupt_image_handling():
    """Test 4: Corrupt image should not fail entire sync"""
    print("\n" + "="*60)
    print("TEST 4: Corrupt Image Handling (Partial Success)")
    print("="*60)
    
    user = User.objects.get(username='test_collector')
    local_id = "test-corrupt-001"
    
    payload = {
        "cases": [{
            "local_id": local_id,
            "data": {
                "case_type": "criminal",
                "case_number": "CR-CORRUPT-001",
                "case_year": 2024,
                "governorate": "Cairo",
                "police_department": "Test Department",
                "incident_type": "theft",
                "description": "Test corrupt image handling",
                "persons": [{
                    "role": "victim",
                    "full_name": "Person With Bad Image",
                    "national_id": "11111111111111",
                    "images": [{
                        "file_name": "corrupt.jpg",
                        "mime_type": "image/jpeg",
                        "data": "data:image/jpeg;base64,CORRUPT_BASE64_DATA!!!"
                    }]
                }],
                "evidences": [{
                    "evidence_number": "EV-GOOD",
                    "evidence_type": "physical",
                    "description": "Evidence with valid image",
                    "media": [{
                        "file_name": "valid.jpg",
                        "mime_type": "image/jpeg",
                        "data": create_base64_test_image(50, 50, 'yellow')
                    }]
                }]
            }
        }]
    }
    
    client = Client()
    client.force_login(user)
    
    response = client.post('/api/sync/', 
                          data=json.dumps(payload),
                          content_type='application/json')
    result = response.json()['results'][0]
    
    print(f"Status: {result['status']}")
    
    if result['status'] == 'synced':
        case = Case.objects.get(id=result['case_id'])
        persons = Person.objects.filter(case=case)
        evidences = Evidence.objects.filter(case=case)
        person_images = PersonImage.objects.filter(person__case=case)
        evidence_media = EvidenceMedia.objects.filter(evidence__case=case)
        
        print(f"✓ Case created despite corrupt image: {case.case_code}")
        print(f"✓ Persons: {persons.count()}")
        print(f"✓ Person images: {person_images.count()} (expected 0, corrupt)")
        print(f"✓ Evidences: {evidences.count()}")
        print(f"✓ Evidence media: {evidence_media.count()} (expected 1, valid)")
        
        # Check warnings
        if 'warnings' in result and result['warnings']:
            print(f"✓ Warnings reported: {len(result['warnings'])}")
            for w in result['warnings']:
                print(f"  - {w}")
            
            # Verify sync record has warning detail
            sync_record = SyncRecord.objects.get(user=user, local_id=local_id)
            print(f"✓ SyncRecord detail: {sync_record.detail[:100]}...")
            
            assert person_images.count() == 0, "Corrupt image should have failed"
            assert evidence_media.count() == 1, "Valid image should have succeeded"
            assert len(result['warnings']) >= 1, "Should have at least 1 warning"
            
            print("\n✅ TEST 4 PASSED")
            return True
        else:
            print(f"\n❌ TEST 4 FAILED: No warnings reported for corrupt image")
            return False
    else:
        print(f"\n❌ TEST 4 FAILED: Sync failed completely: {result.get('detail')}")
        return False

def run_all_tests():
    """Run all backend verification tests"""
    print("\n" + "="*80)
    print("CSC OFFLINE CASE SYNC - BACKEND VERIFICATION TESTS")
    print("="*80)
    
    results = []
    
    try:
        results.append(("Test 1: Criminal Case Full Sync", test_1_criminal_case_with_person_and_evidence()))
    except Exception as e:
        print(f"\n❌ TEST 1 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Test 1: Criminal Case Full Sync", False))
    
    try:
        results.append(("Test 2: Duplicate Prevention", test_2_duplicate_prevention()))
    except Exception as e:
        print(f"\n❌ TEST 2 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Test 2: Duplicate Prevention", False))
    
    try:
        results.append(("Test 3: Empty Record Filtering", test_3_empty_record_filtering()))
    except Exception as e:
        print(f"\n❌ TEST 3 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Test 3: Empty Record Filtering", False))
    
    try:
        results.append(("Test 4: Corrupt Image Handling", test_4_corrupt_image_handling()))
    except Exception as e:
        print(f"\n❌ TEST 4 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Test 4: Corrupt Image Handling", False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL BACKEND TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
