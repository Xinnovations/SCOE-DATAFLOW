from datetime import datetime
import random

def generate_roll_number(_: str = "", __: str = "") -> str:
    number = random.randint(0, 9999)
    return f"SCOE{str(number).zfill(4)}"

def generate_institutional_email(name: str, department: str) -> str:
    clean_name = '.'.join(filter(None, name.lower().replace('  ', ' ').split(' ')))
    dept = (department or 'dept').lower().replace(' ', '')
    return f"{clean_name}@{dept}.scoe.edu.in"


