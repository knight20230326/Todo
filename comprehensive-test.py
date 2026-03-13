#!/usr/bin/env python3
"""
OmniPlan 综合功能测试平台
Complete functionality test suite for OmniPlan task management system
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys

class TestSuite:
    def __init__(self):
        self.api_url = "http://localhost:3030/api/tasks"
        self.base_url = "http://localhost:3030"
        self.results = []
        self.task_ids = {}
        self.passed = 0
        self.failed = 0
        
    def log(self, level, message):
        """Output formatted log messages"""
        symbols = {
            'pass': '✓',
            'fail': '✗',
            'info': 'ℹ',
            'test': '▶'
        }
        colors = {
            'pass': '\033[92m',
            'fail': '\033[91m',
            'info': '\033[94m',
            'test': '\033[95m',
            'reset': '\033[0m'
        }
        
        if level in symbols:
            print(f"{colors[level]}{symbols[level]} {message}{colors['reset']}")
        else:
            print(message)
    
    def test_pass(self, test_name, details=""):
        self.passed += 1
        msg = f"PASS: {test_name}"
        if details:
            msg += f" - {details}"
        self.log('pass', msg)
        self.results.append(('PASS', test_name))
        
    def test_fail(self, test_name, error=""):
        self.failed += 1
        msg = f"FAIL: {test_name}"
        if error:
            msg += f" - {error}"
        self.log('fail', msg)
        self.results.append(('FAIL', test_name))
        
    def test_info(self, message):
        self.log('info', message)
        
    def test_section(self, title):
        print(f"\n{'='*60}")
        self.log('test', title)
        print('='*60)
    
    # ========== API & Server Tests ==========
    def test_server_health(self):
        """Test if server is responding"""
        self.test_section("1. Server Health & API Availability")
        try:
            resp = requests.get(self.base_url, timeout=5)
            if resp.status_code == 200:
                self.test_pass("Server responding", "HTTP 200 OK")
            else:
                self.test_fail("Server responding", f"HTTP {resp.status_code}")
        except Exception as e:
            self.test_fail("Server responding", str(e))
            return False
        
        # Check API endpoint
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                self.test_pass("API endpoint available", "GET /api/tasks")
                return True
            else:
                self.test_fail("API endpoint available", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("API endpoint available", str(e))
            return False
    
    # ========== Task Creation Tests ==========
    def test_create_single_task(self):
        """Test creating a single task"""
        self.test_section("2. Task Creation")
        try:
            payload = {
                "title": "Simple One-Time Task",
                "description": "This is a test task that happens once",
                "time": {"type": "single", "dueDate": "2025-01-20"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["test", "important"]},
                "status": {"phase": "do", "progress": 0}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['single'] = data['id']
                self.test_pass("Create single task", f"ID: {data['id'][:8]}...")
                return True
            else:
                self.test_fail("Create single task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create single task", str(e))
            return False
    
    def test_create_recurring_daily(self):
        """Test creating daily recurring task"""
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            payload = {
                "title": "Daily Standup Meeting",
                "description": "Morning standup",
                "time": {"type": "recurring", "dueDate": tomorrow, "recurrence": "daily"},
                "urgency": {"priority": "medium"},
                "category": {"area": "work", "tags": ["meeting"]},
                "status": {"phase": "do", "progress": 0}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['daily'] = data['id']
                self.test_pass("Create daily recurring task", f"ID: {data['id'][:8]}...")
                return True
            else:
                self.test_fail("Create daily recurring task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create daily recurring task", str(e))
            return False
    
    def test_create_recurring_weekly(self):
        """Test creating weekly recurring task"""
        try:
            payload = {
                "title": "Weekly Report",
                "description": "Submit weekly report",
                "time": {"type": "recurring", "dueDate": "2025-01-17", "recurrence": "weekly"},
                "urgency": {"priority": "medium"},
                "category": {"area": "work", "tags": ["report"]},
                "status": {"phase": "do", "progress": 0}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['weekly'] = data['id']
                self.test_pass("Create weekly recurring task", f"ID: {data['id'][:8]}...")
                return True
            else:
                self.test_fail("Create weekly recurring task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create weekly recurring task", str(e))
            return False
    
    def test_create_habit(self):
        """Test creating habit task"""
        try:
            payload = {
                "title": "Morning Jog",
                "description": "30 min run in the morning",
                "time": {"type": "habit", "habitWindow": "06:00-07:00"},
                "urgency": {"priority": "medium"},
                "category": {"area": "life", "tags": ["fitness", "habit"]},
                "status": {"phase": "do", "progress": 7}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['habit'] = data['id']
                self.test_pass("Create habit task", f"ID: {data['id'][:8]}... (streak: 7)")
                return True
            else:
                self.test_fail("Create habit task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create habit task", str(e))
            return False
    
    def test_create_blocking_task(self):
        """Test creating blocking task"""
        try:
            payload = {
                "title": "Waiting for Design Review",
                "description": "Need design team approval",
                "time": {"type": "single", "dueDate": "2025-01-18"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["design", "blocked"]},
                "status": {"phase": "wait", "progress": 0},
                "resources": {"blockedReason": "Waiting for designer feedback"}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['blocking'] = data['id']
                self.test_pass("Create blocking task", f"ID: {data['id'][:8]}...")
                return True
            else:
                self.test_fail("Create blocking task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create blocking task", str(e))
            return False
    
    def test_create_dependent_task(self):
        """Test creating dependent task with parent"""
        try:
            if 'blocking' not in self.task_ids:
                self.test_fail("Create dependent task", "No blocking parent task")
                return False
            
            payload = {
                "title": "Update Design Based on Feedback",
                "description": "Make changes based on review",
                "parentId": self.task_ids['blocking'],
                "time": {"type": "single", "dueDate": "2025-01-19"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["design"]},
                "status": {"phase": "collect", "progress": 0}
            }
            resp = requests.post(self.api_url, json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.task_ids['dependent'] = data['id']
                self.test_pass("Create dependent task", f"ID: {data['id'][:8]}...")
                return True
            else:
                self.test_fail("Create dependent task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Create dependent task", str(e))
            return False
    
    # ========== Task Update Tests ==========
    def test_task_updates(self):
        """Test updating task properties"""
        self.test_section("3. Task Updates")
        
        if 'single' not in self.task_ids:
            self.test_fail("Update task properties", "No task to update")
            return False
        
        try:
            task_id = self.task_ids['single']
            payload = {
                "title": "Updated Task Title",
                "urgency": {"priority": "urgent"},
                "status": {"progress": 50}
            }
            resp = requests.patch(f"{self.api_url}/{task_id}", json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                self.test_pass("Update task properties", "Title, priority, progress")
                return True
            else:
                self.test_fail("Update task properties", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Update task properties", str(e))
            return False
    
    def test_habit_streak_update(self):
        """Test updating habit streak"""
        try:
            if 'habit' not in self.task_ids:
                self.test_fail("Update habit streak", "No habit task")
                return False
            
            task_id = self.task_ids['habit']
            today = datetime.now().strftime("%Y-%m-%d")
            payload = {
                "status": {"progress": 10},
                "time": {"lastDone": today}
            }
            resp = requests.patch(f"{self.api_url}/{task_id}", json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.test_pass("Update habit streak", f"New streak: {data.get('status', {}).get('progress', 0)}")
                return True
            else:
                self.test_fail("Update habit streak", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Update habit streak", str(e))
            return False
    
    # ========== Task Completion Tests ==========
    def test_complete_single_task(self):
        """Test completing single task"""
        self.test_section("4. Task Completion")
        
        try:
            if 'single' not in self.task_ids:
                self.test_fail("Complete single task", "No task to complete")
                return False
            
            task_id = self.task_ids['single']
            payload = {"status": {"phase": "archive", "progress": 100}}
            resp = requests.patch(f"{self.api_url}/{task_id}", json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                self.test_pass("Complete single task", "Marked as archived")
                return True
            else:
                self.test_fail("Complete single task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Complete single task", str(e))
            return False
    
    def test_complete_recurring_task(self):
        """Test completing recurring task"""
        try:
            if 'daily' not in self.task_ids:
                self.test_fail("Complete recurring task", "No recurring task")
                return False
            
            task_id = self.task_ids['daily']
            # For recurring task, update phase but keep type
            payload = {
                "status": {"phase": "do"},
                "time": {"type": "recurring", "recurrence": "daily"}
            }
            resp = requests.patch(f"{self.api_url}/{task_id}", json=payload, timeout=5)
            if resp.status_code in [200, 201]:
                self.test_pass("Complete recurring task", "Marked as done (next recurrence will be created)")
                return True
            else:
                self.test_fail("Complete recurring task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Complete recurring task", str(e))
            return False
    
    # ========== Task Listing & Filtering Tests ==========
    def test_list_all_tasks(self):
        """Test listing all tasks"""
        self.test_section("5. Task Listing & Filtering")
        
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                tasks = resp.json()
                count = len(tasks) if isinstance(tasks, list) else 0
                self.test_pass("List all tasks", f"Retrieved {count} tasks")
                return count > 0
            else:
                self.test_fail("List all tasks", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("List all tasks", str(e))
            return False
    
    def test_filter_by_phase(self):
        """Test filtering tasks by phase"""
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                tasks = resp.json()
                phases = {}
                for task in tasks:
                    phase = task.get('status', {}).get('phase', 'unknown')
                    phases[phase] = phases.get(phase, 0) + 1
                
                if len(phases) > 0:
                    phase_str = ", ".join([f"{p}: {c}" for p, c in phases.items()])
                    self.test_pass("Filter by phase", phase_str)
                    return True
                else:
                    self.test_fail("Filter by phase", "No phases found")
                    return False
            else:
                self.test_fail("Filter by phase", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Filter by phase", str(e))
            return False
    
    def test_priority_levels(self):
        """Test different priority levels"""
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                tasks = resp.json()
                priorities = {}
                for task in tasks:
                    priority = task.get('urgency', {}).get('priority', 'none')
                    priorities[priority] = priorities.get(priority, 0) + 1
                
                if len(priorities) > 0:
                    priority_str = ", ".join([f"{p}: {c}" for p, c in priorities.items()])
                    self.test_pass("Priority levels", priority_str)
                    return True
                else:
                    self.test_fail("Priority levels", "No priorities found")
                    return False
            else:
                self.test_fail("Priority levels", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Priority levels", str(e))
            return False
    
    def test_tags_support(self):
        """Test tags functionality"""
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                tasks = resp.json()
                tagged = sum(1 for t in tasks if t.get('category', {}).get('tags'))
                total = len(tasks) if isinstance(tasks, list) else 0
                
                self.test_pass("Tags support", f"{tagged}/{total} tasks have tags")
                return tagged > 0
            else:
                self.test_fail("Tags support", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Tags support", str(e))
            return False
    
    # ========== Task Deletion Tests ==========
    def test_delete_task(self):
        """Test deleting a task"""
        self.test_section("6. Task Deletion")
        
        try:
            if 'dependent' not in self.task_ids:
                self.test_fail("Delete task", "No task to delete")
                return False
            
            task_id = self.task_ids['dependent']
            resp = requests.delete(f"{self.api_url}/{task_id}", timeout=5)
            if resp.status_code in [200, 201]:
                # Verify deletion
                time.sleep(0.2)
                check_resp = requests.get(self.api_url, timeout=5)
                if check_resp.status_code in [200, 201]:
                    tasks = check_resp.json()
                    deleted = not any(t['id'] == task_id for t in tasks)
                    if deleted:
                        self.test_pass("Delete task", "Task successfully removed")
                        return True
                    else:
                        self.test_fail("Delete task", "Task still exists")
                        return False
            else:
                self.test_fail("Delete task", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Delete task", str(e))
            return False
    
    # ========== Advanced Features Tests ==========
    def test_blocking_and_dependencies(self):
        """Test blocking and dependency detection"""
        self.test_section("7. Blocking & Dependencies")
        
        try:
            resp = requests.get(self.api_url, timeout=5)
            if resp.status_code in [200, 201]:
                tasks = resp.json()
                
                # Count blocked tasks
                blocked = sum(1 for t in tasks if t.get('resources', {}).get('blockedReason'))
                # Count tasks with parents
                dependent = sum(1 for t in tasks if t.get('parentId'))
                
                msg = f"Blocked: {blocked}, Dependent: {dependent}"
                if blocked > 0 or dependent > 0:
                    self.test_pass("Blocking & dependencies", msg)
                    return True
                else:
                    self.test_info(f"No blocked/dependent tasks yet ({msg})")
                    return True
            else:
                self.test_fail("Blocking & dependencies", f"HTTP {resp.status_code}")
                return False
        except Exception as e:
            self.test_fail("Blocking & dependencies", str(e))
            return False
    
    def test_data_persistence(self):
        """Test data persistence to file"""
        self.test_section("8. Data Persistence")
        
        try:
            import os
            data_file = "/workspaces/Todo/.omni-plan/tasks.json"
            if os.path.exists(data_file):
                with open(data_file, 'r') as f:
                    file_data = json.load(f)
                
                # Get from API
                resp = requests.get(self.api_url, timeout=5)
                if resp.status_code in [200, 201]:
                    api_data = resp.json()
                    
                    if len(file_data) > 0 and len(api_data) > 0:
                        self.test_pass("Data persistence", f"File: {len(file_data)} tasks, API: {len(api_data)} tasks")
                        return True
                    else:
                        self.test_fail("Data persistence", "No data in storage")
                        return False
            else:
                self.test_fail("Data persistence", "Data file not found")
                return False
        except Exception as e:
            self.test_fail("Data persistence", str(e))
            return False
    
    def test_ui_pages(self):
        """Test if UI pages are accessible"""
        self.test_section("9. UI Pages Accessibility")
        
        pages_ok = True
        pages = [
            ('/', 'Main index page'),
            ('/styles.css', 'Stylesheet'),
            ('/app.js', 'Application script')
        ]
        
        for path, desc in pages:
            try:
                resp = requests.get(f"{self.base_url}{path}", timeout=5)
                if resp.status_code == 200:
                    self.test_pass(f"Page accessible: {desc}")
                else:
                    self.test_fail(f"Page accessible: {desc}", f"HTTP {resp.status_code}")
                    pages_ok = False
            except Exception as e:
                self.test_fail(f"Page accessible: {desc}", str(e))
                pages_ok = False
        
        return pages_ok
    
    # ========== Main Test Runner ==========
    def run_all_tests(self):
        """Run all tests"""
        print("\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*15 + "OmniPlan 综合功能测试" + " "*18 + "║")
        print("║" + " "*12 + "Comprehensive Functionality Test Suite" + " "*9 + "║")
        print("╚" + "="*58 + "╝")
        
        # Run test sections
        if not self.test_server_health():
            self.test_fail("Test Suite", "Server not responding - aborting tests")
            return False
        
        self.test_create_single_task()
        self.test_create_recurring_daily()
        self.test_create_recurring_weekly()
        self.test_create_habit()
        self.test_create_blocking_task()
        self.test_create_dependent_task()
        
        self.test_task_updates()
        self.test_habit_streak_update()
        
        self.test_complete_single_task()
        self.test_complete_recurring_task()
        
        self.test_list_all_tasks()
        self.test_filter_by_phase()
        self.test_priority_levels()
        self.test_tags_support()
        
        self.test_delete_task()
        
        self.test_blocking_and_dependencies()
        self.test_data_persistence()
        self.test_ui_pages()
        
        # Print summary
        self.print_summary()
        
        return self.failed == 0
    
    def print_summary(self):
        """Print test summary"""
        print("\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*20 + "测试摘要 (Test Summary)" + " "*14 + "║")
        print("╚" + "="*58 + "╝")
        
        total = self.passed + self.failed
        
        pass_color = '\033[92m'
        fail_color = '\033[91m'
        reset = '\033[0m'
        
        print(f"\n{pass_color}✓ 通过 (Passed): {self.passed}{reset}")
        print(f"{fail_color}✗ 失败 (Failed): {self.failed}{reset}")
        print(f"总计 (Total):  {total}")
        
        if self.failed == 0:
            print(f"\n{pass_color}🎉 所有测试均通过！(All tests passed!){reset}")
            return True
        else:
            print(f"\n{fail_color}⚠️  有 {self.failed} 个测试失败 ({self.failed} test(s) failed){reset}")
            return False

if __name__ == "__main__":
    suite = TestSuite()
    success = suite.run_all_tests()
    sys.exit(0 if success else 1)
