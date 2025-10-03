import os
import sys

# Ensure the package root (services/python) is on sys.path for imports like `import edtech_service`
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
