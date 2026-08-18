import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db import Base, PublicTeardown, Streak
import uuid

class TestPublicTeardowns(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_create_and_get_teardown(self):
        teardown_id = str(uuid.uuid4())
        
        # 1. Create a public teardown
        db_teardown = PublicTeardown(
            id=teardown_id,
            user_uid="test_user_123",
            company_name="Acme Corp",
            company_one_liner="AI powered widgets",
            company_batch="W26",
            company_industry="AI",
            company_website="https://acme.example.com",
            teardown_title="Acme System Architecture",
            teardown_content="### 1. Problem Statement\nWidgets are static. AI widgets are dynamic.",
            user_display_name="Developer Bob",
            unlocked_badges_count=3
        )
        self.db.add(db_teardown)
        self.db.commit()

        # 2. Retrieve it
        retrieved = self.db.query(PublicTeardown).filter(PublicTeardown.id == teardown_id).first()
        
        # 3. Assert values match
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.id, teardown_id)
        self.assertEqual(retrieved.company_name, "Acme Corp")
        self.assertEqual(retrieved.company_one_liner, "AI powered widgets")
        self.assertEqual(retrieved.company_batch, "W26")
        self.assertEqual(retrieved.company_industry, "AI")
        self.assertEqual(retrieved.company_website, "https://acme.example.com")
        self.assertEqual(retrieved.teardown_title, "Acme System Architecture")
        self.assertEqual(retrieved.teardown_content, "### 1. Problem Statement\nWidgets are static. AI widgets are dynamic.")
        self.assertEqual(retrieved.user_display_name, "Developer Bob")
        self.assertEqual(retrieved.unlocked_badges_count, 3)

    def test_streak_check_in(self):
        user_uid = "streak_user_456"
        
        # 1. Create initial streak
        streak = Streak(user_uid=user_uid, streak_count=1, last_check_in="2026-08-18")
        self.db.add(streak)
        self.db.commit()

        # 2. Get and assert initial streak
        retrieved = self.db.query(Streak).filter(Streak.user_uid == user_uid).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.streak_count, 1)
        self.assertEqual(retrieved.last_check_in, "2026-08-18")

        # 3. Simulate check-in
        retrieved.streak_count += 1
        retrieved.last_check_in = "2026-08-19"
        self.db.commit()

        # 4. Verify updated values
        updated = self.db.query(Streak).filter(Streak.user_uid == user_uid).first()
        self.assertEqual(updated.streak_count, 2)
        self.assertEqual(updated.last_check_in, "2026-08-19")

if __name__ == "__main__":
    unittest.main()
