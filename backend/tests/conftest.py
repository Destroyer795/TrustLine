import pytest
import secrets
from decimal import Decimal
from django.utils import timezone

@pytest.fixture
def db_setup(db):
    os.environ['USE_SQLITE_TEST'] = 'true'
