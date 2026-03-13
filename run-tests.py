#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime, timedelta

API_URL = "http://localhost:3030/api/tasks"

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.task_ids = {}
        
    def log_pass(self, test_name):
        print(f"✓ PASS: {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, reason=""):
        print(f"✗ FAIL: {test_name}" + (f" - {reason}" if reason else ""))
        self.failed += 1
        
    def test_create_single_task(self):
        print("\n=== Test 1: Create Single Task ===")
        try:
            response = requests.post(API_URL, json={
                "title": "测试单次任务",
                "description": "这是一个单次任务的测试",
                "time": {"type": "single", "dueDate": "2025-01-20"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["测试", "重要"]},
                "status": {"phase": "do", "progress": 0}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['single'] = data['id']
                self.log_pass("Create single task")
                print(f"  Task ID: {data['id']}")
            else:
                self.log_fail("Create single task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create single task", str(e))
    
    def test_create_recurring_task(self):
        print("\n=== Test 2: Create Recurring Task (Daily) ===")
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            response = requests.post(API_URL, json={
                "title": "每日站会",
                "description": "每天上午10点的站会",
                "time": {"type": "recurring", "dueDate": tomorrow, "recurrence": "daily"},
                "urgency": {"priority": "medium"},
                "category": {"area": "work", "tags": ["会议"]},
                "status": {"phase": "do", "progress": 0}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['recurring'] = data['id']
                assert data['time']['type'] == 'recurring'
                assert data['time']['recurrence'] == 'daily'
                self.log_pass("Create recurring task (daily)")
                print(f"  Task ID: {data['id']}")
            else:
                self.log_fail("Create recurring task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create recurring task", str(e))
    
    def test_create_weekly_task(self):
        print("\n=== Test 3: Create Recurring Task (Weekly) ===")
        try:
            response = requests.post(API_URL, json={
                "title": "周报汇总",
                "description": "每周五下午5点汇总本周工作",
                "time": {"type": "recurring", "dueDate": "2025-01-17", "recurrence": "weekly"},
                "urgency": {"priority": "medium"},
                "category": {"area": "work", "tags": ["报告"]},
                "status": {"phase": "do", "progress": 0}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['weekly'] = data['id']
                assert data['time']['recurrence'] == 'weekly'
                self.log_pass("Create recurring task (weekly)")
            else:
                self.log_fail("Create recurring task (weekly)", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create recurring task (weekly)", str(e))
    
    def test_create_habit_task(self):
        print("\n=== Test 4: Create Habit Task ===")
        try:
            response = requests.post(API_URL, json={
                "title": "晨间跑步",
                "description": "每天早上跑步锻炼",
                "time": {"type": "habit", "habitWindow": "06:00-07:00"},
                "urgency": {"priority": "medium"},
                "category": {"area": "life", "tags": ["健身", "习惯"]},
                "status": {"phase": "do", "progress": 5}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['habit'] = data['id']
                assert data['time']['type'] == 'habit'
                assert data['status']['progress'] == 5
                self.log_pass("Create habit task with streak 5")
                print(f"  Habit streak: {data['status']['progress']}")
            else:
                self.log_fail("Create habit task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create habit task", str(e))
    
    def test_create_blocking_task(self):
        print("\n=== Test 5: Create Blocking Task ===")
        try:
            response = requests.post(API_URL, json={
                "title": "等待设计评审",
                "description": "需要等待设计团队的评审意见",
                "time": {"type": "single", "dueDate": "2025-01-18"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["设计", "等待"]},
                "status": {"phase": "wait", "progress": 0},
                "resources": {"blockedReason": "等待设计师评审"}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['blocking'] = data['id']
                assert data['resources']['blockedReason'] == "等待设计师评审"
                self.log_pass("Create blocking task")
                print(f"  Blocked reason: {data['resources']['blockedReason']}")
            else:
                self.log_fail("Create blocking task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create blocking task", str(e))
    
    def test_create_dependent_task(self):
        print("\n=== Test 6: Create Dependent Task ===")
        try:
            if 'blocking' not in self.task_ids:
                self.log_fail("Create dependent task", "No blocking parent task")
                return
                
            response = requests.post(API_URL, json={
                "title": "修改设计稿",
                "description": "根据评审意见修改设计",
                "parentId": self.task_ids['blocking'],
                "time": {"type": "single", "dueDate": "2025-01-19"},
                "urgency": {"priority": "high"},
                "category": {"area": "work", "tags": ["设计", "修改"]},
                "status": {"phase": "collect", "progress": 0}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.task_ids['dependent'] = data['id']
                assert data['parentId'] == self.task_ids['blocking']
                self.log_pass("Create dependent task")
                print(f"  Parent ID: {data['parentId']}")
            else:
                self.log_fail("Create dependent task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Create dependent task", str(e))
    
    def test_list_tasks(self):
        print("\n=== Test 7: List All Tasks ===")
        try:
            response = requests.get(API_URL)
            if response.status_code == 200:
                tasks = response.json()
                count = len(tasks)
                if count >= 5:
                    self.log_pass(f"List all tasks ({count} tasks)")
                else:
                    self.log_fail(f"List all tasks", f"Expected at least 5, got {count}")
            else:
                self.log_fail("List all tasks", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("List all tasks", str(e))
    
    def test_update_task(self):
        print("\n=== Test 8: Update Task ===")
        try:
            if 'single' not in self.task_ids:
                self.log_fail("Update task", "No task to update")
                return
                
            response = requests.patch(f"{API_URL}/{self.task_ids['single']}", json={
                "title": "更新的任务标题",
                "urgency": {"priority": "urgent"},
                "category": {"tags": ["更新", "标签"]}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                assert data['title'] == "更新的任务标题"
                assert data['urgency']['priority'] == "urgent"
                self.log_pass("Update task fields")
            else:
                self.log_fail("Update task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Update task", str(e))
    
    def test_update_habit_streak(self):
        print("\n=== Test 9: Update Habit Streak ===")
        try:
            if 'habit' not in self.task_ids:
                self.log_fail("Update habit streak", "No habit task")
                return
            
            # Update habit with new streak
            response = requests.patch(f"{API_URL}/{self.task_ids['habit']}", json={
                "status": {"progress": 10},
                "time": {"lastDone": datetime.now().strftime("%Y-%m-%d")}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                assert data['status']['progress'] == 10
                self.log_pass("Update habit streak to 10")
                print(f"  New streak: {data['status']['progress']}")
            else:
                self.log_fail("Update habit streak", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Update habit streak", str(e))
    
    def test_archive_task(self):
        print("\n=== Test 10: Archive Task ===")
        try:
            if 'single' not in self.task_ids:
                self.log_fail("Archive task", "No task to archive")
                return
            
            response = requests.patch(f"{API_URL}/{self.task_ids['single']}", json={
                "status": {"phase": "archive", "progress": 100}
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                assert data['status']['phase'] == 'archive'
                self.log_pass("Archive task (mark complete)")
                print(f"  New phase: {data['status']['phase']}")
            else:
                self.log_fail("Archive task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Archive task", str(e))
    
    def test_delete_task(self):
        print("\n=== Test 11: Delete Task ===")
        try:
            if 'dependent' not in self.task_ids:
                self.log_fail("Delete task", "No task to delete")
                return
            
            task_id = self.task_ids['dependent']
            response = requests.delete(f"{API_URL}/{task_id}")
            
            if response.status_code in [200, 201]:
                # Verify deletion
                time.sleep(0.2)
                get_response = requests.get(f"{API_URL}/{task_id}")
                # Check if task no longer exists (expect 404 or similar error)
                if get_response.status_code != 200:
                    self.log_pass("Delete task")
                else:
                    self.log_fail("Delete task", "Task still exists after deletion")
            else:
                self.log_fail("Delete task", f"Status {response.status_code}")
        except Exception as e:
            self.log_fail("Delete task", str(e))
    
    def test_filtering_by_phase(self):
        print("\n=== Test 12: Filter Tasks by Phase ===")
        try:
            response = requests.get(API_URL)
            if response.status_code not in [200, 201]:
                self.log_fail("Filter by phase", f"Status {response.status_code}")
                return
            tasks = response.json()
            
            # Count tasks by phase
            phases = {}
            for task in tasks:
                phase = task.get('status', {}).get('phase', 'unknown')
                phases[phase] = phases.get(phase, 0) + 1
            
            if len(phases) > 0:
                self.log_pass(f"Filter by phase (found {len(phases)} phase types)")
                print(f"  Phases: {phases}")
            else:
                self.log_fail("Filter by phase", "No phases found")
        except Exception as e:
            self.log_fail("Filter by phase", str(e))
    
    def test_priority_sorting(self):
        print("\n=== Test 13: Priority-based Sorting ===")
        try:
            response = requests.get(API_URL)
            if response.status_code not in [200, 201]:
                self.log_fail("Priority sorting", f"Status {response.status_code}")
                return
            for task in tasks:
                priority = task.get('urgency', {}).get('priority', 'none')
                priorities.add(priority)
            
            if len(priorities) > 1:
                self.log_pass(f"Tasks with different priorities ({', '.join(priorities)})")
            else:
                self.log_fail("Priority sorting", "Only one priority level found")
        except Exception as e:
            self.log_fail("Priority sorting", str(e))
    
    def test_tag_support(self):
        print("\n=== Test 14: Tag Support ===")
        try:
            response = requests.get(API_URL)
            if response.status_code not in [200, 201]:
                self.log_fail("Tag support", f"Status {response.status_code}")
                return
            tasks = response.json()
            
            tagged_tasks = [t for t in tasks if t.get('category', {}).get('tags')]
            
            if len(tagged_tasks) > 0:
                self.log_pass(f"Tasks with tags ({len(tagged_tasks)} tasks)")
                sample_tags = tagged_tasks[0].get('category', {}).get('tags', [])
                print(f"  Sample tags: {sample_tags}")
            else:
                self.log_fail("Tag support", "No tagged tasks found")
        except Exception as e:
            self.log_fail("Tag support", str(e))
    
    def test_area_distribution(self):
        print("\n=== Test 15: Area Distribution ===")
        try:
            response = requests.get(API_URL)
            if response.status_code not in [200, 201]:
                self.log_fail("Area distribution", f"Status {response.status_code}")
                return
            tasks = response.json()
            
            areas = {}
            for task in tasks:
                area = task.get('category', {}).get('area', 'general')
                areas[area] = areas.get(area, 0) + 1
            
            if len(areas) > 0:
                self.log_pass(f"Tasks distributed across areas")
                print(f"  Areas: {areas}")
            else:
                self.log_fail("Area distribution", "No areas found")
        except Exception as e:
            self.log_fail("Area distribution", str(e))
    
    def run_all_tests(self):
        print("=" * 60)
        print("OmniPlan Comprehensive Feature Test Suite")
        print("=" * 60)
        
        self.test_create_single_task()
        self.test_create_recurring_task()
        self.test_create_weekly_task()
        self.test_create_habit_task()
        self.test_create_blocking_task()
        self.test_create_dependent_task()
        self.test_list_tasks()
        self.test_update_task()
        self.test_update_habit_streak()
        self.test_archive_task()
        self.test_delete_task()
        self.test_filtering_by_phase()
        self.test_priority_sorting()
        self.test_tag_support()
        self.test_area_distribution()
        
        # Print summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        total = self.passed + self.failed
        print(f"✓ Passed: {self.passed}")
        print(f"✗ Failed: {self.failed}")
        print(f"Total:   {total}")
        print()
        
        if self.failed == 0:
            print("✓ All tests passed! 🎉")
            return 0
        else:
            print(f"✗ {self.failed} test(s) failed")
            return 1

if __name__ == "__main__":
    runner = TestRunner()
    exit(runner.run_all_tests())
